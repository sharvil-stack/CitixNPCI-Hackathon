package main

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// CardSaathi handoff records contain only pseudonymous workflow metadata.
// Never add PAN, Aadhaar, names, income, account/card numbers, raw chat or documents.
type CardSaathiContract struct{ contractapi.Contract }

type Handoff struct {
	ReferralID    string `json:"referral_id"`
	MemberRef     string `json:"member_ref"`
	CardID        string `json:"card_id"`
	IssuerCode    string `json:"issuer_code"`
	ConsentScope  string `json:"consent_scope"`
	ConsentStatus string `json:"consent_status"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
	UpdatedByMSP  string `json:"updated_by_msp"`
}

var idPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{4,100}$`)
var slugPattern = regexp.MustCompile(`^[a-z0-9-]{2,80}$`)

func (c *CardSaathiContract) requireMSP(ctx contractapi.TransactionContextInterface, allowed string) error {
	msp, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return err
	}
	if msp != allowed {
		return fmt.Errorf("operation requires %s; caller is %s", allowed, msp)
	}
	return nil
}

func txTime(ctx contractapi.TransactionContextInterface) (string, error) {
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", err
	}
	return time.Unix(ts.Seconds, int64(ts.Nanos)).UTC().Format(time.RFC3339Nano), nil
}

// CreateReferral records explicit consent for a handoff. In this template Org1MSP
// represents the CardSaathi-originating organisation; change MSP IDs before deployment.
func (c *CardSaathiContract) CreateReferral(ctx contractapi.TransactionContextInterface, referralID, memberRef, cardID, issuerCode, consentScope string) error {
	if err := c.requireMSP(ctx, "Org1MSP"); err != nil {
		return err
	}
	if !idPattern.MatchString(referralID) || !idPattern.MatchString(memberRef) || !slugPattern.MatchString(cardID) || !slugPattern.MatchString(issuerCode) {
		return fmt.Errorf("invalid referral metadata")
	}
	if consentScope != "card_application_handoff" {
		return fmt.Errorf("unsupported consent scope")
	}
	stub := ctx.GetStub()
	existing, err := stub.GetState(referralID)
	if err != nil {
		return err
	}
	if existing != nil {
		return fmt.Errorf("referral already exists")
	}
	now, err := txTime(ctx)
	if err != nil {
		return err
	}
	r := Handoff{ReferralID: referralID, MemberRef: memberRef, CardID: cardID, IssuerCode: issuerCode,
		ConsentScope: consentScope, ConsentStatus: "GRANTED", Status: "CONSENTED", CreatedAt: now, UpdatedAt: now, UpdatedByMSP: "Org1MSP"}
	b, err := json.Marshal(r)
	if err != nil {
		return err
	}
	if err := stub.PutState(referralID, b); err != nil {
		return err
	}
	return stub.SetEvent("CardSaathiReferralConsented", b)
}

// UpdateReferralStatus represents a participating institution updating the handoff status.
// Use a gateway identity belonging to Org2MSP for this transaction in the test network.
func (c *CardSaathiContract) UpdateReferralStatus(ctx contractapi.TransactionContextInterface, referralID, status, issuerCode string) error {
	if err := c.requireMSP(ctx, "Org2MSP"); err != nil {
		return err
	}
	valid := map[string]bool{"ACKNOWLEDGED": true, "UNDER_REVIEW": true, "ACTION_REQUIRED": true, "COMPLETED": true, "REJECTED": true}
	if !idPattern.MatchString(referralID) || !slugPattern.MatchString(issuerCode) || !valid[status] {
		return fmt.Errorf("invalid referral status update")
	}
	stub := ctx.GetStub()
	b, err := stub.GetState(referralID)
	if err != nil {
		return err
	}
	if b == nil {
		return fmt.Errorf("referral not found")
	}
	var r Handoff
	if err := json.Unmarshal(b, &r); err != nil {
		return err
	}
	if r.ConsentStatus != "GRANTED" {
		return fmt.Errorf("consent is not active")
	}
	if strings.ToLower(r.IssuerCode) != strings.ToLower(issuerCode) {
		return fmt.Errorf("issuer code does not match referral")
	}
	allowedNext := map[string]map[string]bool{
		"CONSENTED":       {"ACKNOWLEDGED": true},
		"ACKNOWLEDGED":    {"UNDER_REVIEW": true},
		"UNDER_REVIEW":    {"ACTION_REQUIRED": true, "COMPLETED": true, "REJECTED": true},
		"ACTION_REQUIRED": {"UNDER_REVIEW": true, "COMPLETED": true, "REJECTED": true},
	}
	if !allowedNext[r.Status][status] {
		return fmt.Errorf("invalid status transition: %s -> %s", r.Status, status)
	}
	now, err := txTime(ctx)
	if err != nil {
		return err
	}
	r.Status = status
	r.UpdatedAt = now
	r.UpdatedByMSP = "Org2MSP"
	b, err = json.Marshal(r)
	if err != nil {
		return err
	}
	if err := stub.PutState(referralID, b); err != nil {
		return err
	}
	return stub.SetEvent("CardSaathiReferralStatusChanged", b)
}

func (c *CardSaathiContract) RevokeConsent(ctx contractapi.TransactionContextInterface, referralID string) error {
	if err := c.requireMSP(ctx, "Org1MSP"); err != nil {
		return err
	}
	stub := ctx.GetStub()
	b, err := stub.GetState(referralID)
	if err != nil {
		return err
	}
	if b == nil {
		return fmt.Errorf("referral not found")
	}
	var r Handoff
	if err := json.Unmarshal(b, &r); err != nil {
		return err
	}
	now, err := txTime(ctx)
	if err != nil {
		return err
	}
	r.ConsentStatus = "REVOKED"
	r.Status = "CONSENT_REVOKED"
	r.UpdatedAt = now
	r.UpdatedByMSP = "Org1MSP"
	b, err = json.Marshal(r)
	if err != nil {
		return err
	}
	if err := stub.PutState(referralID, b); err != nil {
		return err
	}
	return stub.SetEvent("CardSaathiConsentRevoked", b)
}

func (c *CardSaathiContract) GetReferral(ctx contractapi.TransactionContextInterface, referralID string) (*Handoff, error) {
	if !idPattern.MatchString(referralID) {
		return nil, fmt.Errorf("invalid referral id")
	}
	b, err := ctx.GetStub().GetState(referralID)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, fmt.Errorf("referral not found")
	}
	var r Handoff
	if err := json.Unmarshal(b, &r); err != nil {
		return nil, err
	}
	return &r, nil
}

func (c *CardSaathiContract) GetReferralHistory(ctx contractapi.TransactionContextInterface, referralID string) ([]map[string]interface{}, error) {
	if !idPattern.MatchString(referralID) {
		return nil, fmt.Errorf("invalid referral id")
	}
	it, err := ctx.GetStub().GetHistoryForKey(referralID)
	if err != nil {
		return nil, err
	}
	defer it.Close()
	rows := make([]map[string]interface{}, 0)
	for it.HasNext() {
		item, err := it.Next()
		if err != nil {
			return nil, err
		}
		var value interface{}
		if len(item.Value) > 0 {
			if err := json.Unmarshal(item.Value, &value); err != nil {
				value = string(item.Value)
			}
		}
		rows = append(rows, map[string]interface{}{"tx_id": item.TxId, "timestamp": item.Timestamp, "is_delete": item.IsDelete, "value": value})
	}
	return rows, nil
}

func main() {
	cc, err := contractapi.NewChaincode(&CardSaathiContract{})
	if err != nil {
		panic(err)
	}
	if err := cc.Start(); err != nil {
		panic(err)
	}
}
