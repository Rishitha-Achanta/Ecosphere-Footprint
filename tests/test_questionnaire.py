import json
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server


def valid_scenarios():
    return {
        key: {
            'title': 'A changed routine',
            'scenario': f'Imagine a new, ordinary situation connected with {key}, during a busy day.',
            'question': f'In a typical week, how often does this situation involve {key}?',
        }
        for key in server.GAME_TOPICS
    }


class GameScenarioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base_url = f'http://127.0.0.1:{cls.httpd.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join()

    def start_game(self, days=1):
        request = Request(
            f'{self.base_url}/api/game/start',
            data=json.dumps({'use_defaults': True, 'days': days}).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urlopen(request) as response:
            return json.loads(response.read())

    def remove_game(self, game_id):
        with server.GAME_SESSIONS_LOCK:
            server.GAME_SESSIONS.pop(game_id, None)

    def test_validates_all_generated_game_topics_and_content(self):
        scenarios = valid_scenarios()
        self.assertEqual(server.validate_game_scenarios(scenarios), scenarios)
        with self.assertRaises(ValueError):
            server.validate_game_scenarios({key: value for key, value in scenarios.items() if key != 'transport'})
        scenarios['transport']['title'] = 'Short'
        with self.assertRaises(ValueError):
            server.validate_game_scenarios(scenarios)

    def test_generator_requests_game_topics_with_selected_answers_and_fixed_choices(self):
        expected = valid_scenarios()
        labels = {key: server.OPTIONS[key][value] for key, value in server.DEFAULT_ANSWERS.items()}
        with patch('server.gemini_interaction', return_value=json.dumps(expected)) as generate:
            result = server.generate_game_scenarios('test-key', labels)
        self.assertEqual(result, expected)
        prompt = generate.call_args.args[0]
        self.assertIn('everyday gasoline-vehicle travel', prompt)
        self.assertIn(labels['transport'], prompt)
        self.assertIn(server.LIFE_SCENES[0]['choices'][0][0], prompt)
        self.assertEqual(generate.call_args.kwargs['max_output_tokens'], 3200)
        self.assertEqual(set(generate.call_args.kwargs['response_format']['schema']['required']), set(server.GAME_TOPICS))

    def test_game_start_uses_gemini_scenarios_and_preserves_game_choices(self):
        scenarios = valid_scenarios()
        with patch.dict(server.os.environ, {'GEMINI_API_KEY': 'test-key'}):
            with patch('server.generate_game_scenarios', return_value=scenarios) as generate:
                result = self.start_game()
        game_id = result['game_id']
        self.addCleanup(self.remove_game, game_id)
        game = result['game']
        self.assertEqual(game['scenario_source'], 'gemini')
        self.assertEqual(game['scenario_note'], '')
        self.assertEqual(game['scene']['title'], scenarios[game['scene']['answer_key']]['title'])
        self.assertIn(scenarios[game['scene']['answer_key']]['scenario'], game['scene']['context'])
        self.assertEqual(
            [choice['text'] for choice in game['scene']['choices']],
            [choice for choice, _ in next(scene for scene in server.LIFE_SCENES if scene['answer_key'] == game['scene']['answer_key'])['choices']],
        )
        generate.assert_called_once_with(
            'test-key',
            {key: server.OPTIONS[key][value] for key, value in server.DEFAULT_ANSWERS.items()},
        )

    def test_game_start_falls_back_when_gemini_is_not_configured(self):
        with patch.dict(server.os.environ, {'GEMINI_API_KEY': ''}):
            result = self.start_game()
        game_id = result['game_id']
        self.addCleanup(self.remove_game, game_id)
        self.assertEqual(result['game']['scenario_source'], 'built-in')
        self.assertIn('Gemini is not configured', result['game']['scenario_note'])
        self.assertEqual(result['game']['scene']['title'], next(
            scene['title'] for scene in server.LIFE_SCENES if scene['answer_key'] == result['game']['scene']['answer_key']
        ))

    def test_game_start_falls_back_when_gemini_generation_fails(self):
        error = server.GeminiServiceError('Generation failed.', 'retry', retryable=True)
        with patch.dict(server.os.environ, {'GEMINI_API_KEY': 'test-key'}):
            with patch('server.generate_game_scenarios', side_effect=error):
                result = self.start_game()
        game_id = result['game_id']
        self.addCleanup(self.remove_game, game_id)
        self.assertEqual(result['game']['scenario_source'], 'built-in')
        self.assertIn('Gemini could not create fresh scenes', result['game']['scenario_note'])

    def test_questionnaire_scenario_endpoint_is_not_exposed(self):
        request = Request(f'{self.base_url}/api/question-scenarios', data=b'{}', method='POST')
        with self.assertRaises(HTTPError) as error:
            urlopen(request)
        self.assertEqual(error.exception.code, 404)

    def test_server_chooses_another_port_when_the_default_is_busy(self):
        occupied = server.LocalHTTPServer(('127.0.0.1', 0), server.Handler)
        self.addCleanup(occupied.server_close)
        fallback = server.create_http_server(occupied.server_port)
        self.addCleanup(fallback.server_close)
        self.assertNotEqual(fallback.server_port, occupied.server_port)


if __name__ == '__main__':
    unittest.main()
