import json
import threading
import unittest
from urllib.request import Request, urlopen

import server


class GameRouteTests(unittest.TestCase):
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

    def test_direct_game_page_uses_sample_answers_and_accepts_choices(self):
        with urlopen(f'{self.base_url}/lifestyle.html') as response:
            page = response.read().decode()
        self.assertIn('game-default-note', page)
        self.assertIn('lifestyle.js', page)
        with urlopen(f'{self.base_url}/cascade.html') as response:
            cascade = response.read().decode()
        self.assertIn('href="lifestyle.html"', cascade)

        request = Request(
            f'{self.base_url}/api/game/start',
            data=json.dumps({'use_defaults': True, 'days': 1}).encode(),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urlopen(request) as response:
            started = json.loads(response.read())

        game_id = started['game_id']
        self.addCleanup(self.remove_game, game_id)
        game = started['game']
        self.assertEqual(game['total'], 3)
        self.assertEqual(game['completed'], 0)
        self.assertEqual(game['starting_score'], server.game_starting_score(server.DEFAULT_ANSWERS))
        self.assertIn('The selected response', game['scene']['context'])

        for completed in range(1, 4):
            request = Request(
                f'{self.base_url}/api/game/choose',
                data=json.dumps({'game_id': game_id, 'choice_index': 0}).encode(),
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            with urlopen(request) as response:
                game = json.loads(response.read())['game']
            self.assertEqual(game['completed'], completed)
            self.assertEqual(game['total'], 3)
        self.assertTrue(game['complete'])
        self.assertEqual(len(game['actions']), 3)

    @staticmethod
    def remove_game(game_id):
        with server.GAME_SESSIONS_LOCK:
            server.GAME_SESSIONS.pop(game_id, None)


if __name__ == '__main__':
    unittest.main()
