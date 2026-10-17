/*
 * Little Planet Life's rules live in server.py. This file only renders the
 * state returned by Python and forwards a player's click to the local server.
 */
const gameAnswerKeys = ['transport', 'appliances', 'flights', 'diet', 'trash', 'shopping', 'secondhand', 'electronics', 'dishes', 'showers', 'plastics', 'chemicals'];
const gameIdKey = 'ecosphere-life-game-id';
const gameEntryKey = 'ecosphere-life-unlocked';
const gamePanel = document.querySelector('#game-panel');
const gameGate = document.querySelector('#game-gate');
const gameEmpty = document.querySelector('#game-empty');
const gameSetup = document.querySelector('#game-setup');
const gameLoading = document.querySelector('#game-loading');
const gameError = document.querySelector('#game-error');
const gameErrorText = document.querySelector('#game-error-text');
const gameRetry = document.querySelector('#game-retry');
const gameActionStatus = document.querySelector('#game-action-status');
const gameDays = document.querySelector('#game-days');
let activeGameId = '';
let gameRequestBusy = false;
let selectedDays = Number(gameDays?.value || 4);

function sessionValue(key) {
    try { return sessionStorage.getItem(key) || ''; } catch { return ''; }
}

function setSessionValue(key, value) {
    try { sessionStorage.setItem(key, value); } catch { /* The current tab can still play this visit. */ }
}

function removeSessionValue(key) {
    try { sessionStorage.removeItem(key); } catch { /* Storage may be unavailable in private browsing. */ }
}

function getQuestionnaireAnswers() {
    try {
        const answers = JSON.parse(localStorage.getItem('ecosphere-answers'));
        if (!answers || typeof answers !== 'object' || Object.keys(answers).length !== gameAnswerKeys.length) return null;
        return gameAnswerKeys.every(key => Number.isInteger(answers[key])) ? answers : null;
    } catch {
        return null;
    }
}

function setVisible(element, show) {
    if (element) element.hidden = !show;
}

function showGameError(message) {
    setVisible(gamePanel, false);
    setVisible(gameLoading, false);
    setVisible(gameError, true);
    gameErrorText.textContent = message;
}

async function postGame(path, payload) {
    let response;
    try {
        response = await fetch(path, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
    } catch {
        throw new Error('Could not reach the local server. Start it with python server.py, then refresh this page.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error || `The game request failed (${response.status}).`);
        error.recovery = data.recovery;
        throw error;
    }
    return data;
}

function choiceButton(choice, index) {
    const button = document.createElement('button');
    button.className = 'life-choice';
    button.type = 'button';
    button.setAttribute('aria-label', choice.text);
    button.innerHTML = `<span class="choice-letter">${String.fromCharCode(65 + index)}</span><span class="choice-text"></span>`;
    button.querySelector('.choice-text').textContent = choice.text;
    button.addEventListener('click', () => chooseOption(index));
    return button;
}

function renderGame(game, announceChange = false, moveFocus = false) {
    const progressTrack = document.querySelector('#game-progress-track');
    const progressFill = document.querySelector('#game-progress-fill');
    const progressLabel = document.querySelector('#game-progress-label');
    document.querySelector('#game-score').textContent = game.score;
    progressTrack.setAttribute('aria-valuemax', game.total);
    progressTrack.setAttribute('aria-valuenow', game.completed);
    progressFill.style.width = `${game.completed / game.total * 100}%`;
    progressLabel.textContent = `${game.completed} of ${game.total} decisions`;

    if (game.complete) {
        document.querySelector('#life-event').hidden = true;
        document.querySelector('#game-complete').hidden = false;
        document.querySelector('#game-day').textContent = 'Your story is complete';
        document.querySelector('#game-decision').textContent = `${game.total} decisions made`;
        document.querySelector('#final-score').textContent = game.score;
        document.querySelector('#starting-score').textContent = game.starting_score;
        const recap = document.querySelector('#game-recap');
        recap.replaceChildren();
        game.actions.forEach(action => {
            const item = document.createElement('li');
            const decision = document.createElement('span');
            decision.textContent = `${action.title}: ${action.choice}`;
            item.append(decision);
            recap.append(item);
        });
        if (moveFocus) document.querySelector('#complete-title').focus({preventScroll: true});
        return;
    }

    const {scene} = game;
    document.querySelector('#game-complete').hidden = true;
    document.querySelector('#life-event').hidden = false;
    document.querySelector('#game-day').textContent = `Day ${game.day} of ${game.days}`;
    document.querySelector('#game-decision').textContent = `Decision ${game.decision} of 3`;
    document.querySelector('#event-kicker').textContent = `DAY ${game.day} · DECISION ${game.decision} OF 3`;
    document.querySelector('#event-title').textContent = scene.title;
    document.querySelector('#event-context').textContent = scene.context;
    document.querySelector('#event-question').textContent = scene.question;
    const choices = document.querySelector('#life-choices');
    choices.replaceChildren(...scene.choices.map(choiceButton));
    gameActionStatus.textContent = announceChange ? 'Your impact score has been updated.' : '';
    if (moveFocus) document.querySelector('#event-title').focus({preventScroll: true});
}

function showGameSetup() {
    if (!getQuestionnaireAnswers()) {
        setVisible(gameEmpty, true);
        return;
    }
    setVisible(gamePanel, false);
    setVisible(gameError, false);
    setVisible(gameLoading, false);
    setVisible(gameSetup, true);
}

async function openGame(days = selectedDays) {
    const answers = getQuestionnaireAnswers();
    if (!answers) {
        setVisible(gameLoading, false);
        setVisible(gameEmpty, true);
        return;
    }
    selectedDays = Number(days);
    setVisible(gameError, false);
    setVisible(gameSetup, false);
    setVisible(gameLoading, true);
    try {
        let response;
        const savedId = sessionValue(gameIdKey);
        if (savedId) {
            activeGameId = savedId;
            try {
                response = await postGame('/api/game/state', {game_id: activeGameId});
            } catch (error) {
                if (error.recovery !== 'restart_game') throw error;
                removeSessionValue(gameIdKey);
                activeGameId = '';
            }
        }
        if (!activeGameId) {
            response = await postGame('/api/game/start', {entry: 'cascade-bottom', answers, days: selectedDays});
            activeGameId = response.game_id;
            setSessionValue(gameIdKey, activeGameId);
        }
        setVisible(gameLoading, false);
        setVisible(gamePanel, true);
        renderGame(response.game);
    } catch (error) {
        showGameError(error instanceof Error ? error.message : 'The game could not be opened. Please try again.');
    }
}

async function chooseOption(choiceIndex) {
    if (gameRequestBusy || !activeGameId) return;
    gameRequestBusy = true;
    document.querySelectorAll('.life-choice').forEach(button => { button.disabled = true; });
    try {
        const response = await postGame('/api/game/choose', {game_id: activeGameId, choice_index: choiceIndex});
        renderGame(response.game, true, true);
    } catch (error) {
        if (error?.recovery === 'restart_game') {
            activeGameId = '';
            removeSessionValue(gameIdKey);
            await openGame(selectedDays);
        } else {
            gameActionStatus.textContent = error instanceof Error ? error.message : 'Your choice could not be saved. Please try again.';
            document.querySelectorAll('.life-choice').forEach(button => { button.disabled = false; });
        }
    } finally {
        gameRequestBusy = false;
    }
}

async function restartGame() {
    if (!activeGameId || gameRequestBusy) return;
    gameRequestBusy = true;
    const restartButton = document.querySelector('#restart-game');
    restartButton.disabled = true;
    try {
        const response = await postGame('/api/game/restart', {game_id: activeGameId});
        renderGame(response.game, null, true);
    } catch (error) {
        if (error?.recovery === 'restart_game') {
            activeGameId = '';
            removeSessionValue(gameIdKey);
            await openGame(selectedDays);
        } else {
            showGameError(error instanceof Error ? error.message : 'The game could not restart. Please try again.');
        }
    } finally {
        gameRequestBusy = false;
        restartButton.disabled = false;
    }
}

function beginLifestyle() {
    const parameters = new URLSearchParams(window.location.search);
    const arrivedFromCascade = parameters.get('from') === 'cascade';
    if (arrivedFromCascade) {
        setSessionValue(gameEntryKey, 'cascade-bottom');
        window.history.replaceState({}, '', window.location.pathname);
    }
    if (!arrivedFromCascade && sessionValue(gameEntryKey) !== 'cascade-bottom') {
        setVisible(gameGate, true);
        return;
    }
    if (sessionValue(gameIdKey)) {
        openGame();
    } else {
        showGameSetup();
    }
}

document.querySelector('#restart-game')?.addEventListener('click', restartGame);
document.querySelector('#start-game')?.addEventListener('click', () => openGame(Number(gameDays.value)));
document.querySelector('#new-game-length')?.addEventListener('click', () => {
    activeGameId = '';
    removeSessionValue(gameIdKey);
    showGameSetup();
});
gameRetry?.addEventListener('click', () => openGame(selectedDays));
beginLifestyle();
