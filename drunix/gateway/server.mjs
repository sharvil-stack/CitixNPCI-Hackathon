import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import crypto from 'node:crypto';
import grpc from '@grpc/grpc-js';
import { connect, hash, signers } from '@hyperledger/fabric-gateway';

const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'16kb'}));
const port = Number(process.env.PORT || 8090);
const apiToken = process.env.DRUNIX_GATEWAY_TOKEN || '';
const env = (name) => (process.env[name] || '').trim();
let gatewayCache = null;
let clientCache = null;
let contractCache = null;

function auth(req,res,next){
  if (!apiToken || req.get('x-api-token') !== apiToken) return res.status(401).json({error:'unauthorized'});
  next();
}
function slugOk(value){ return typeof value === 'string' && /^[a-z0-9_-]{3,100}$/.test(value); }
function issuerOk(value){ return typeof value === 'string' && /^[a-z0-9-]{2,80}$/.test(value); }
function contract(){
  if(contractCache) return contractCache;
  const endpoint=env('DRUNIX_PEER_ENDPOINT'), hostAlias=env('DRUNIX_PEER_HOST_ALIAS');
  const tlsPath=env('DRUNIX_TLS_CERT_PATH'), certPath=env('DRUNIX_IDENTITY_CERT_PATH'), keyPath=env('DRUNIX_IDENTITY_KEY_PATH');
  const mspId=env('DRUNIX_MSP_ID'), channel=env('DRUNIX_CHANNEL'), chaincode=env('DRUNIX_CHAINCODE');
  if(!endpoint||!tlsPath||!certPath||!keyPath||!mspId||!channel||!chaincode) throw new Error('DRUNIX gateway certificate, endpoint, MSP, channel and chaincode variables are required');
  const tlsRootCert=fs.readFileSync(tlsPath);
  clientCache=new grpc.Client(endpoint,grpc.credentials.createSsl(tlsRootCert),hostAlias?{'grpc.ssl_target_name_override':hostAlias}:{});
  const identity={mspId,credentials:fs.readFileSync(certPath)};
  const privateKey=crypto.createPrivateKey(fs.readFileSync(keyPath));
  gatewayCache=connect({client:clientCache,identity,signer:signers.newPrivateKeySigner(privateKey),hash:hash.sha256});
  contractCache=gatewayCache.getNetwork(channel).getContract(chaincode);
  return contractCache;
}
function parsed(bytes){ const s=Buffer.from(bytes||[]).toString('utf8'); return s ? JSON.parse(s) : {}; }

// Explicitly wait for the transaction's commit status. A gateway health check
// or an endorsement alone is not proof that a write reached the ledger.
async function submitCommitted(contractRef, name, args) {
  const submitted = await contractRef.submitAsync(name, { arguments: args });
  const transactionId = submitted.getTransactionId();
  const status = await submitted.getStatus();
  if (!status.successful) {
    throw new Error(`transaction ${transactionId} committed with invalid status ${status.code}`);
  }
  return {
    transaction_id: transactionId,
    commit_status: 'VALID',
    result: Buffer.from(submitted.getResult() || []).toString('utf8'),
  };
}

app.use(auth);
app.get('/health',(req,res)=>{
  try { contract(); return res.json({ready:true,mode:'drunix_gateway',notice:'Gateway credentials loaded. A successful ledger transaction is needed to confirm network operation.'}); }
  catch(e) { return res.status(503).json({ready:false,mode:'drunix_gateway',notice:'Gateway is not ready. Check local DRUNIX credentials and configuration.'}); }
});
app.post('/referrals',async(req,res)=>{
  const {referral_id,member_ref,card_id,issuer_code,consent_scope}=req.body||{};
  if(!slugOk(referral_id)||!slugOk(member_ref)||!slugOk(card_id)||!issuerOk(issuer_code)||consent_scope!=='card_application_handoff') return res.status(400).json({error:'invalid_minimised_referral_payload'});
  try {
    const c=contract();
    const commit=await submitCommitted(c,'CreateReferral',[referral_id,member_ref,card_id,issuer_code,consent_scope]);
    // Read-after-write: verify the committed state can be queried back from the ledger.
    const stored=parsed(await c.evaluateTransaction('GetReferral',referral_id));
    if(stored.referral_id!==referral_id || stored.status!=='CONSENTED' || stored.consent_status!=='GRANTED') {
      throw new Error('transaction committed but the stored referral did not match the expected state');
    }
    return res.status(201).json({referral_id,member_ref,card_id,issuer_code,consent_scope,status:'CONSENTED',mode:'drunix_gateway',transaction_id:commit.transaction_id,commit_status:commit.commit_status,ledger_verified:true,verification:'committed_and_read_back'});
  } catch(e) { return res.status(502).json({error:'drunix_create_failed',message:String(e.message).slice(0,180)}); }
});
app.get('/referrals/:id',async(req,res)=>{
  if(!slugOk(req.params.id)) return res.status(400).json({error:'invalid_id'});
  try { const result=await contract().evaluateTransaction('GetReferral',req.params.id); return res.json(parsed(result)); }
  catch(e){const status=String(e.message).includes('not found')?404:502;return res.status(status).json({error:'drunix_read_failed'});}
});
app.get('/referrals/:id/history',async(req,res)=>{
  if(!slugOk(req.params.id)) return res.status(400).json({error:'invalid_id'});
  try { const result=await contract().evaluateTransaction('GetReferralHistory',req.params.id); return res.json(parsed(result)); }
  catch{return res.status(502).json({error:'drunix_history_failed'});}
});
app.post('/referrals/:id/revoke',async(req,res)=>{
  if(!slugOk(req.params.id)) return res.status(400).json({error:'invalid_id'});
  try {
    const c=contract();
    const commit=await submitCommitted(c,'RevokeConsent',[req.params.id]);
    const stored=parsed(await c.evaluateTransaction('GetReferral',req.params.id));
    if(stored.status!=='CONSENT_REVOKED' || stored.consent_status!=='REVOKED') throw new Error('consent revocation could not be verified by read-back');
    return res.json({referral_id:req.params.id,status:'CONSENT_REVOKED',mode:'drunix_gateway',transaction_id:commit.transaction_id,commit_status:commit.commit_status,ledger_verified:true});
  }
  catch(e){return res.status(502).json({error:'drunix_revoke_failed',message:String(e.message).slice(0,180)});}
});
app.patch('/referrals/:id/status',async(req,res)=>{
  const {status,issuer_code}=req.body||{};
  const allowed=['ACKNOWLEDGED','UNDER_REVIEW','ACTION_REQUIRED','COMPLETED','REJECTED'];
  if(!slugOk(req.params.id)||!allowed.includes(status)||!issuerOk(issuer_code))return res.status(400).json({error:'invalid_status_payload'});
  try {
    const c=contract();
    const commit=await submitCommitted(c,'UpdateReferralStatus',[req.params.id,status,issuer_code]);
    const stored=parsed(await c.evaluateTransaction('GetReferral',req.params.id));
    if(stored.status!==status) throw new Error('status update could not be verified by read-back');
    return res.json({referral_id:req.params.id,status,mode:'drunix_gateway',transaction_id:commit.transaction_id,commit_status:commit.commit_status,ledger_verified:true});
  }
  catch(e){return res.status(502).json({error:'drunix_status_update_failed',message:String(e.message).slice(0,180)});}
});
app.listen(port,()=>console.log(`CardSaathi DRUNIX gateway listening on ${port}`));
