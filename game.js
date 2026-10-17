/* Legacy loader for a previously cached Lifestyle page.
   The Little Planet Life game engine now lives in server.py. */
if (!new URLSearchParams(window.location.search).has('server_game')) {
    window.location.replace(new URL('lifestyle.html?server_game=1', window.location.href).href);
}
