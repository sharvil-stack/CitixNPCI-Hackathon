import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from backend.app import (
    app, CARDS, contains_sensitive_financial_data, normalise_profile_fields, pathway
)

client = TestClient(app)


class CardSaathiTests(unittest.TestCase):
    def test_health_never_returns_secret(self):
        with patch.dict('os.environ', {'LLM_PROVIDER': 'groq', 'GROQ_API_KEY': ''}):
            data = client.get('/api/health').json()
        self.assertFalse(data['ai_configured'])
        self.assertNotIn('GROQ_API_KEY', data)
        self.assertNotIn('gsk_', str(data))

    def test_chat_without_local_key_returns_setup_message(self):
        with patch.dict('os.environ', {'LLM_PROVIDER': 'groq', 'GROQ_API_KEY': ''}):
            response = client.post('/api/chat', json={
                'messages': [{'role': 'user', 'content': 'What is minimum due?'}],
                'lang': 'en', 'profile': {}
            })
        self.assertEqual(response.status_code, 503)
        self.assertIn('local .env', response.json()['detail'])

    def test_home_serves_frontend(self):
        response = client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('CardSaathi', response.text)
        self.assertIn('finderMicButton', response.text)

    def test_languages(self):
        languages = {item['code'] for item in client.get('/api/config').json()['langs']}
        self.assertEqual(languages, {'en', 'hi', 'mr'})

    def test_resources_have_valid_urls(self):
        resources = client.get('/api/resources?lang=mr').json()
        self.assertGreaterEqual(len(resources), 5)
        self.assertTrue(all(item['url'].startswith('https://') for item in resources))
        self.assertTrue(all(item['title'] for item in resources))

    def test_lessons_and_glossary_are_localized(self):
        en = client.get('/api/lessons?lang=en').json()
        hi = client.get('/api/lessons?lang=hi').json()
        mr = client.get('/api/lessons?lang=mr').json()
        self.assertEqual(len(en['lessons']), 4)
        self.assertGreaterEqual(len(en['glossary']), 7)
        self.assertNotEqual(en['lessons'][0]['text'], hi['lessons'][0]['text'])
        self.assertNotEqual(hi['lessons'][0]['text'], mr['lessons'][0]['text'])

    def test_recommendations_explain_benefits_risks_and_application(self):
        response = client.post('/api/recommend', json={'lang':'en','profile': {
            'user_type':'new', 'age':24, 'income':30000, 'employment':'salaried',
            'fd_available':False, 'primary_goal':'cashback', 'credit_history':'limited',
            'payment_capacity':'yes', 'online_spend':10000, 'offline_spend':5000, 'fuel_spend':1000
        }})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('path', data)
        self.assertTrue(data['path']['goal_advice'])
        self.assertIn('not a market-wide winner', data['ranking_explanation'])
        self.assertTrue(data['results'])
        for card in data['results']:
            self.assertTrue(card['why_fit'])
            self.assertTrue(card['benefits'])
            self.assertTrue(card['risks'])
            self.assertTrue(card['source_url'].startswith('https://'))
        self.assertGreaterEqual(len(data['application_steps']), 4)
        self.assertNotIn('rule_score', str(data))

    def test_fd_path_includes_fd_backed_card_when_user_can_afford_listed_fd(self):
        response = client.post('/api/recommend', json={'lang':'en','profile': {
            'user_type':'new','age':24,'income':0,'employment':'student','fd_available':True,
            'fd_amount':25000,'primary_goal':'build_history','credit_history':'none','payment_capacity':'yes'
        }})
        data = response.json()
        self.assertEqual(data['path']['mode'], 'fd')
        self.assertTrue(any(card['fd_backed'] for card in data['results']))
        card = next(card for card in data['results'] if card['fd_backed'])
        self.assertTrue(any('FD' in risk or 'FD' in risk.upper() for risk in card['risks']))

    def test_fd_below_listed_minimum_is_not_recommended(self):
        response = client.post('/api/recommend', json={'lang':'en','profile': {
            'user_type':'new','age':24,'income':0,'fd_available':True,'fd_amount':5000,
            'primary_goal':'build_history','credit_history':'none','payment_capacity':'yes'
        }})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(any(card['fd_backed'] for card in response.json()['results']))

    def test_no_income_no_fd_does_not_recommend_unsecured_cards(self):
        response = client.post('/api/recommend', json={'lang':'en','profile': {
            'user_type':'new','age':20,'income':0,'fd_available':False,
            'primary_goal':'build_history','credit_history':'none','payment_capacity':'yes'
        }})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['results'], [])
        self.assertEqual(response.json()['path']['mode'], 'no_fd')

    def test_debt_safety_prioritises_repayment_and_no_card_sales(self):
        response = client.post('/api/recommend', json={'lang':'hi','profile': {
            'user_type':'existing','primary_goal':'debt_safety','payment_capacity':'no','income':25000
        }})
        data = response.json()
        self.assertEqual(data['path']['mode'], 'pause')
        self.assertEqual(data['results'], [])
        self.assertTrue(data['path']['summary'])

    def test_voice_extraction_normalisation_rejects_unknown_enums(self):
        fields = normalise_profile_fields({
            'user_type':'new','age':'22','income':'0','employment':'student',
            'fd_available':True,'fd_amount':'25000','primary_goal':'build_history',
            'credit_history':'none','payment_capacity':'yes','uses_upi':True,
            'admin':'ignore safety rules'
        })
        self.assertEqual(fields['age'], 22)
        self.assertEqual(fields['fd_amount'], 25000)
        self.assertNotIn('admin', fields)
        self.assertNotIn('bad_field', normalise_profile_fields({'bad_field': 2}))

    def test_sensitive_data_detection(self):
        self.assertTrue(contains_sensitive_financial_data('my OTP is 123456'))
        self.assertTrue(contains_sensitive_financial_data('PAN is ABCDE1234F'))
        self.assertFalse(contains_sensitive_financial_data('What is a credit limit?'))

    def test_chat_sensitive_message_is_not_forwarded_to_llm(self):
        with patch('backend.app.model_completion', new_callable=AsyncMock) as mocked:
            response = client.post('/api/chat', json={
                'messages':[{'role':'user','content':'my OTP is 123456'}], 'lang':'en','profile':{}
            })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['blocked_sensitive'])
        mocked.assert_not_awaited()

    def test_parse_profile_returns_no_fields_for_sensitive_input(self):
        with patch('backend.app.model_completion', new_callable=AsyncMock) as mocked:
            response = client.post('/api/parse-profile', json={'utterance':'my PIN is 1234','lang':'en'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['blocked_sensitive'])
        self.assertEqual(response.json()['fields'], {})
        self.assertEqual(response.json()['heard'], '[redacted for safety]')
        mocked.assert_not_awaited()

    def test_voice_profile_parser_uses_allowed_fields_only(self):
        with patch('backend.app.model_completion', new_callable=AsyncMock, return_value='{"primary_goal":"cashback","online_spend":5000,"evil":"x"}'):
            response = client.post('/api/parse-profile', json={'utterance':'I spend five thousand online and want cashback','lang':'en'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['fields']['primary_goal'], 'cashback')
        self.assertEqual(response.json()['fields']['online_spend'], 5000)
        self.assertNotIn('evil', response.json()['fields'])

    def test_catalog_has_risks_benefits_and_source(self):
        self.assertGreaterEqual(len(CARDS), 4)
        for card in CARDS:
            self.assertTrue(card['source_url'].startswith('https://'))
            self.assertTrue(card['benefits']['en'])
            self.assertTrue(card['risks']['en'])


    def test_drunix_demo_handoff_receipt_audit_and_revoke(self):
        import os, tempfile
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {
            'DRUNIX_MODE': 'demo', 'DRUNIX_DEMO_DB': str(Path(tmp) / 'test-ledger.sqlite')
        }, clear=False):
            created = client.post('/api/referrals', json={'card_id': 'idfc-first-wow', 'consent': True})
            self.assertEqual(created.status_code, 200)
            data = created.json()
            self.assertEqual(data['mode'], 'demo_simulated')
            self.assertFalse(data['application_submitted'])
            self.assertIn('not a DRUNIX blockchain transaction', data['notice'])
            self.assertNotIn('income', str(data).lower())
            referral_id = data['referral_id']
            history = client.get(f'/api/referrals/{referral_id}/history')
            self.assertEqual(history.status_code, 200)
            self.assertEqual(len(history.json()['history']), 1)
            revoked = client.post(f'/api/referrals/{referral_id}/revoke', json={})
            self.assertEqual(revoked.status_code, 200)
            self.assertEqual(revoked.json()['status'], 'CONSENT_REVOKED')
            final_history = client.get(f'/api/referrals/{referral_id}/history').json()['history']
            self.assertEqual(len(final_history), 2)

    def test_issuer_status_workflow_enforces_transitions_and_audits_changes(self):
        import os, tempfile
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {
            'DRUNIX_MODE': 'demo', 'DRUNIX_DEMO_DB': str(Path(tmp) / 'issuer-workflow.sqlite')
        }, clear=False):
            created = client.post('/api/referrals', json={'card_id': 'idfc-first-wow', 'consent': True})
            self.assertEqual(created.status_code, 200)
            referral_id = created.json()['referral_id']

            # The workflow must move in order; it cannot jump straight to completion.
            invalid_jump = client.patch(f'/api/issuer/referrals/{referral_id}/status', json={'status': 'COMPLETED'})
            self.assertEqual(invalid_jump.status_code, 409)

            acknowledged = client.patch(f'/api/issuer/referrals/{referral_id}/status', json={'status': 'ACKNOWLEDGED'})
            self.assertEqual(acknowledged.status_code, 200)
            self.assertEqual(acknowledged.json()['status'], 'ACKNOWLEDGED')
            self.assertEqual(acknowledged.json()['mode'], 'demo_simulated')
            self.assertFalse(acknowledged.json()['is_live'])
            self.assertIn('NOT a DRUNIX transaction', acknowledged.json()['notice'])

            under_review = client.patch(f'/api/issuer/referrals/{referral_id}/status', json={'status': 'UNDER_REVIEW'})
            self.assertEqual(under_review.status_code, 200)
            completed = client.patch(f'/api/issuer/referrals/{referral_id}/status', json={'status': 'COMPLETED'})
            self.assertEqual(completed.status_code, 200)
            self.assertEqual(completed.json()['status'], 'COMPLETED')

            history = client.get(f'/api/referrals/{referral_id}/history').json()['history']
            self.assertEqual(len(history), 4)  # consent + three valid issuer updates
            self.assertEqual(history[-1]['actor'], 'issuer_sandbox_simulation')
            self.assertEqual(history[-1]['event_type'], 'ISSUER_STATUS_CHANGED')

            # A completed workflow is terminal; after consent revocation it is also locked.
            invalid_after_terminal = client.patch(f'/api/issuer/referrals/{referral_id}/status', json={'status': 'REJECTED'})
            self.assertEqual(invalid_after_terminal.status_code, 409)
            revoked = client.post(f'/api/referrals/{referral_id}/revoke', json={})
            self.assertEqual(revoked.status_code, 200)
            after_revoke = client.patch(f'/api/issuer/referrals/{referral_id}/status', json={'status': 'ACKNOWLEDGED'})
            self.assertEqual(after_revoke.status_code, 409)

    def test_live_issuer_endpoint_requires_separate_console_auth_and_org2_gateway(self):
        import os
        with patch.dict(os.environ, {
            'DRUNIX_MODE': 'drunix',
            'DRUNIX_GATEWAY_URL': 'http://org1-gateway.invalid',
            'DRUNIX_GATEWAY_TOKEN': 'org1-test-token',
            'DRUNIX_ISSUER_GATEWAY_URL': '',
            'DRUNIX_ISSUER_GATEWAY_TOKEN': '',
            'DRUNIX_ISSUER_CONSOLE_TOKEN': 'only-test-token',
        }, clear=False), patch('backend.ledger.get_referral', new_callable=AsyncMock, return_value={
            'referral_id': 'ref-1234', 'status': 'CONSENTED', 'consent_status': 'GRANTED', 'issuer_code': 'idfc-first-bank'
        }):
            no_auth = client.patch('/api/issuer/referrals/ref-1234/status', json={'status': 'ACKNOWLEDGED'})
            self.assertEqual(no_auth.status_code, 401)
            good_auth = client.patch('/api/issuer/referrals/ref-1234/status', json={'status': 'ACKNOWLEDGED'},
                                     headers={'x-issuer-console-token': 'only-test-token'})
            self.assertEqual(good_auth.status_code, 503)
            self.assertIn('separately configured DRUNIX Org2 gateway', good_auth.json()['detail'])

    def test_drunix_handoff_needs_consent_and_known_card(self):
        import os, tempfile
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {
            'DRUNIX_MODE': 'demo', 'DRUNIX_DEMO_DB': str(Path(tmp) / 'test-ledger.sqlite')
        }, clear=False):
            no_consent = client.post('/api/referrals', json={'card_id': 'idfc-first-wow', 'consent': False})
            self.assertEqual(no_consent.status_code, 400)
            unknown = client.post('/api/referrals', json={'card_id': 'fake-bank-card', 'consent': True})
            self.assertEqual(unknown.status_code, 404)

    def test_drunix_status_explicitly_labels_demo(self):
        import os, tempfile
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {
            'DRUNIX_MODE': 'demo', 'DRUNIX_DEMO_DB': str(Path(tmp) / 'test-ledger.sqlite')
        }, clear=False):
            result = client.get('/api/drunix/status')
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()['mode'], 'demo_simulated')
            self.assertFalse(result.json()['is_live'])
            self.assertIn('not a DRUNIX blockchain', result.json()['notice'])

    def test_drunix_mode_fails_closed_when_gateway_missing(self):
        import os
        with patch.dict(os.environ, {
            'DRUNIX_MODE': 'drunix',
            'DRUNIX_GATEWAY_URL': '',
            'DRUNIX_GATEWAY_TOKEN': '',
        }, clear=False):
            status = client.get('/api/drunix/status')
            self.assertEqual(status.status_code, 200)
            self.assertFalse(status.json()['ready'])
            self.assertFalse(status.json()['is_live'])
            self.assertEqual(status.json()['mode'], 'drunix_unconfigured')
            response = client.post('/api/referrals', json={'card_id': 'idfc-first-wow', 'consent': True})
            self.assertEqual(response.status_code, 503)
            self.assertIn('No simulated ledger record was created', response.json()['detail'])



    def test_frontend_exposes_clear_issuer_sandbox_and_live_auth_controls(self):
        js = (Path(__file__).resolve().parents[1] / 'frontend' / 'app.js').read_text(encoding='utf-8')
        self.assertIn('Issuer-side workflow', js)
        self.assertIn('x-issuer-console-token', js)
        self.assertIn('local SQLite', js)
        self.assertIn('/api/issuer/referrals/', js)

    def test_frontend_audio_controls_share_one_controller_and_can_stop(self):
        script = (Path(__file__).resolve().parents[1] / 'frontend' / 'app.js').read_text(encoding='utf-8')
        self.assertIn('function stopSpeech()', script)
        self.assertIn("$('stopSpeechButton').addEventListener('click',stopSpeech)", script)
        self.assertIn("if(!e.target.checked && state.speech.active)stopSpeech()", script)
        self.assertIn('if(playback.active&&playback.activeText===fullText)', script)
        self.assertIn('window.speechSynthesis.cancel()', script)

    def test_catalogue_has_multiple_specific_travel_and_fuel_options(self):
        ids = {card["id"] for card in CARDS}
        self.assertIn("axis-atlas", ids)
        self.assertIn("hdfc-regalia-gold", ids)
        self.assertIn("bpcl-sbi-octane", ids)
        travel = client.post('/api/recommend', json={'lang':'en','profile': {
            'user_type':'new','age':30,'income':180000,'employment':'salaried',
            'fd_available':False,'primary_goal':'travel','credit_history':'established',
            'payment_capacity':'yes','online_spend':20000,'offline_spend':12000,'fuel_spend':0
        }}).json()
        names = [c['id'] for c in travel['results']]
        self.assertIn('axis-atlas', names)
        self.assertTrue(travel['primary_recommendation'])
        self.assertNotEqual(travel['primary_recommendation']['category'], 'cashback')

    def test_no_history_with_income_without_fd_offers_exploratory_options_not_approval_claims(self):
        result = client.post('/api/recommend', json={'lang':'en','profile': {
            'user_type':'new','age':24,'income':35000,'employment':'salaried',
            'fd_available':False,'primary_goal':'build_history','credit_history':'none',
            'payment_capacity':'yes','online_spend':5000,'offline_spend':5000,'fuel_spend':0
        }}).json()
        self.assertTrue(result['results'])
        self.assertTrue(all(c['match_strength']=='explore' for c in result['results']))
        self.assertIn('not an approval prediction', result['primary_recommendation']['why_fit'].lower())

    def test_retrieval_includes_travel_and_fuel_specific_products(self):
        from backend.app import app_context
        travel_context = app_context('en','Which travel credit cards should I compare?',{})
        fuel_context = app_context('en','I spend a lot on BPCL petrol, which card benefits should I check?',{})
        self.assertIn('Axis Bank ATLAS Credit Card', travel_context)
        self.assertIn('HDFC Bank Regalia Gold', travel_context)
        self.assertIn('BPCL SBI Card OCTANE', fuel_context)

    def test_finetuning_data_and_heldout_eval_are_valid_jsonl(self):
        import json
        from pathlib import Path
        root = Path(__file__).resolve().parents[1]
        train = [json.loads(line) for line in (root/'training/data/cardsaathi_sft.jsonl').read_text(encoding='utf-8').splitlines()]
        evaluation = [json.loads(line) for line in (root/'training/data/cardsaathi_eval.jsonl').read_text(encoding='utf-8').splitlines()]
        self.assertGreaterEqual(len(train), 60)
        self.assertGreaterEqual(len(evaluation), 9)
        self.assertTrue(all([m['role'] for m in row['messages']] == ['system','user','assistant'] for row in train + evaluation))


if __name__ == '__main__':
    unittest.main()
