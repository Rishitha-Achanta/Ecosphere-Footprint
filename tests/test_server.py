import json
import unittest
from unittest.mock import patch, MagicMock
import server

class InsightsTests(unittest.TestCase):
    def test_actual_questionnaire_choices(self):
        answers = {key: 0 for key in server.OPTIONS}
        self.assertEqual(len(answers), 10)
        labels = server.validate_answers({'answers': answers})
        self.assertEqual(labels['transport'], 'Walk, bike, or public transit')

    def test_invalid_answers(self):
        for bad in ({}, {'answers': {}}, {'answers': {key: True for key in server.OPTIONS}}, {'answers': {key: 4 for key in server.OPTIONS}}):
            with self.assertRaises(ValueError):
                server.validate_answers(bad)

    def test_model_contract_and_request(self):
        insights = {key: 'Your choices connect to this environment. One small change can help reduce waste.' for key in server.LAYERS}
        mocked = MagicMock()
        mocked.__enter__.return_value.read.return_value = json.dumps({'candidates': [{'content': {'parts': [{'text': json.dumps(insights)}]}}]}).encode()
        with patch('server.urlopen', return_value=mocked) as request:
            result = server.generate_insights({'transport': 'Walk, bike, or public transit'}, 'test-key')
        self.assertEqual(result, insights)
        payload = json.loads(request.call_args.args[0].data)
        self.assertIn('Walk, bike, or public transit', payload['contents'][0]['parts'][0]['text'])
        self.assertEqual(set(payload['generationConfig']['responseJsonSchema']['required']), set(server.LAYERS))

    def test_incomplete_and_verbose_responses(self):
        with self.assertRaises(ValueError):
            server.validate_insights({'air': 'Missing other layers.'})
        with self.assertRaises(ValueError):
            server.validate_insights({key: 'First sentence. Second sentence. Third sentence.' for key in server.LAYERS})

if __name__ == '__main__':
    unittest.main()
