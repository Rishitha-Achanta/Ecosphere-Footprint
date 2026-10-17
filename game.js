const lifeAnswerKeys = ['transport', 'appliances', 'flights', 'diet', 'trash', 'shopping', 'secondhand', 'electronics', 'dishes', 'showers', 'plastics', 'chemicals'];
const lifeLabels = {
    transport: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    appliances: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    flights: ['Less than 1 hour', '2 hours', '4 hours', '6 hours', '8 hours', '10 hours', '12 hours', '14 hours', '16 hours', '18 hours', '20 hours', '22 hours', '24 hours', '26 hours', '28 hours', '30 hours', '30+ hours'],
    diet: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    trash: ['Less than 1 bag', '1–2 bags', '3–4 bags', '5–7 bags', '8–10 bags', 'More than 10 bags'],
    shopping: ['Once a year', 'Every few months', 'Monthly', 'Weekly', 'All the time'],
    secondhand: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    electronics: ['Every decade', 'Every 5 years', 'Every 2 years', 'Every year', 'Less than a year'],
    dishes: ['Handwash', 'Dishwasher'],
    showers: ['5 minutes', '10 minutes', '15 minutes', '20 minutes', '20 minutes+'],
    plastics: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    chemicals: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
};
const lifeScenes = [
    {
        answerKey: 'transport',
        title: 'A rainy morning commute',
        context: 'Your check-in says gasoline-vehicle travel is {answer}. A friend headed the same way offers to share the trip.',
        question: 'How do you get across town today?',
        choices: [
            {text: 'Drive alone in a gasoline car', points: 8},
            {text: 'Share the ride with your friend', points: 3},
            {text: 'Take the bus or train', points: -3},
            {text: 'Walk or bike if it is safe and practical', points: -5}
        ]
    },
    {
        answerKey: 'appliances',
        title: 'A warm afternoon at home',
        context: 'You reported running high-energy appliances {answer}. The room is getting warm while you work.',
        question: 'What is your first move to stay comfortable?',
        choices: [
            {text: 'Run the air conditioner with the windows open', points: 8},
            {text: 'Cool the room with windows closed and a reasonable setting', points: 3},
            {text: 'Use a fan and close the curtains against direct sun', points: -2},
            {text: 'Ventilate naturally when it is cooler outside', points: -4}
        ]
    },
    {
        answerKey: 'flights',
        title: 'A weekend visit with friends',
        context: 'You estimated {answer} of air travel in a typical year. Friends invite you to a nearby gathering.',
        question: 'How do you make the trip happen?',
        choices: [
            {text: 'Book several flights for short visits', points: 9},
            {text: 'Take one direct flight', points: 5},
            {text: 'Use a train or bus if the route works', points: -3},
            {text: 'Join remotely or plan a local get-together', points: -5}
        ]
    },
    {
        answerKey: 'diet',
        title: 'Lunch with your friends',
        context: 'Your questionnaire answer for beef and lamb meals was {answer}. The cafe has several filling options.',
        question: 'What goes on your plate today?',
        choices: [
            {text: 'Order the beef or lamb special', points: 8},
            {text: 'Choose another meat option', points: 4},
            {text: 'Try a vegetarian meal', points: -3},
            {text: 'Choose a plant-based meal using food already available', points: -5}
        ]
    },
    {
        answerKey: 'trash',
        title: 'The kitchen bin is full',
        context: 'You said your household makes {answer} of trash each week. You notice clean containers and food scraps in the bin.',
        question: 'How do you handle the cleanup?',
        choices: [
            {text: 'Throw everything into the regular trash', points: 7},
            {text: 'Recycle accepted containers', points: 2},
            {text: 'Recycle and compost where those services exist', points: -3},
            {text: 'Sort waste and set aside usable items to reuse', points: -5}
        ]
    },
    {
        answerKey: 'shopping',
        title: 'A tempting new jacket',
        context: 'You said you buy new clothes or other products {answer}. Your current jacket still works, but a new one catches your eye.',
        question: 'What do you do before checking out?',
        choices: [
            {text: 'Buy the new jacket right away', points: 7},
            {text: 'Wait a day and decide whether you need it', points: 2},
            {text: 'Repair or keep wearing the jacket you own', points: -3},
            {text: 'Borrow one or look for a second-hand option', points: -5}
        ]
    },
    {
        answerKey: 'secondhand',
        title: 'Finding a bookshelf',
        context: 'Your check-in says you buy second-hand products {answer}. You need a bookshelf for your room.',
        question: 'Where do you look first?',
        choices: [
            {text: 'Order a brand-new bookshelf', points: 6},
            {text: 'Check second-hand shops or local listings', points: -4},
            {text: 'Reuse, borrow, or repair a shelf already nearby', points: -5}
        ]
    },
    {
        answerKey: 'electronics',
        title: 'A new phone is released',
        context: 'You usually replace electronics {answer}. Your current phone still works, and a newer model is advertised.',
        question: 'How do you decide what to do?',
        choices: [
            {text: 'Buy the new phone now', points: 8},
            {text: 'Replace it when it no longer meets your needs', points: 2},
            {text: 'Repair it or keep using it for longer', points: -5}
        ]
    },
    {
        answerKey: 'dishes',
        title: 'Dishes after dinner',
        context: 'You said you usually use a {answer}. Tonight there are enough dishes for a small load.',
        question: 'How do you wash them efficiently?',
        choices: [
            {text: 'Run the dishwasher half-full', points: 6},
            {text: 'Wait for a full load and use an efficient cycle', points: -4},
            {text: 'Handwash in a filled basin', points: -3},
            {text: 'Leave the hot tap running while washing', points: 6}
        ]
    },
    {
        answerKey: 'showers',
        title: 'Winding down for the night',
        context: 'You usually take showers that last {answer}. You have had a busy day and want to relax.',
        question: 'How do you use water tonight?',
        choices: [
            {text: 'Take a shower longer than 15 minutes', points: 7},
            {text: 'Take a shower of about 10 minutes', points: 3},
            {text: 'Keep it near 5 minutes', points: -3},
            {text: 'Take a quick shower and turn off the water while soaping up', points: -5}
        ]
    },
    {
        answerKey: 'plastics',
        title: 'Packing snacks for tomorrow',
        context: 'You reported using single-use plastics {answer}. You are packing a drink and snacks for the day.',
        question: 'What do you bring along?',
        choices: [
            {text: 'Single-use bottles, bags, cups, and wrapped snacks', points: 8},
            {text: 'A mix of disposable packaging and reusable items', points: 3},
            {text: 'A reusable bottle and food container', points: -3},
            {text: 'Reusable containers and unpackaged snacks', points: -5}
        ]
    },
    {
        answerKey: 'chemicals',
        title: 'A battery and leftover paint',
        context: 'You said you handle household or garden products {answer}. A remote needs a new battery, and you find old paint and cleaner in storage.',
        question: 'How do you store or dispose of them?',
        choices: [
            {text: 'Put batteries and leftover products in regular trash', points: 8},
            {text: 'Store everything without checking the labels', points: 3},
            {text: 'Follow product labels and local disposal guidance', points: -4},
            {text: 'Store items safely and take hazardous waste to a collection site', points: -5}
        ]
    }
];

const gamePanel = document.querySelector('#game-panel');
const gameGate = document.querySelector('#game-gate');
let cameFromCascadeEnd = false;
try { cameFromCascadeEnd = sessionStorage.getItem('ecosphere-life-unlocked') === 'cascade-bottom'; } catch { /* Private browsing may disable session storage. */ }
if (gamePanel && !cameFromCascadeEnd) {
    gameGate.hidden = false;
} else if (gamePanel) {
    const emptyPanel = document.querySelector('#game-empty');
    const answerMaxima = {transport: 4, appliances: 4, flights: 16, diet: 4, trash: 5, shopping: 4, secondhand: 4, electronics: 4, dishes: 1, showers: 4, plastics: 4, chemicals: 4};
    let surveyAnswers;
    try { surveyAnswers = JSON.parse(localStorage.getItem('ecosphere-answers')); } catch { /* The questionnaire may not have been completed. */ }
    const hasSurveyAnswers = surveyAnswers && Object.keys(surveyAnswers).length === lifeAnswerKeys.length && lifeAnswerKeys.every(key => Number.isInteger(surveyAnswers[key]) && surveyAnswers[key] >= 0 && surveyAnswers[key] <= answerMaxima[key]);

    if (!hasSurveyAnswers) {
        emptyPanel.hidden = false;
    } else {
        gamePanel.hidden = false;
        const scoreKeys = ['transport', 'appliances', 'flights', 'diet', 'trash', 'shopping', 'secondhand', 'electronics', 'showers', 'plastics'];
        const scoreMaxima = {...answerMaxima};
        const startingScore = Math.round(scoreKeys.reduce((total, key) => {
            const points = key === 'secondhand'
                ? 5 - surveyAnswers[key] / scoreMaxima[key] * 5
                : key === 'flights'
                    ? surveyAnswers[key] / scoreMaxima[key] * 5
                    : surveyAnswers[key] / scoreMaxima[key] * 5;
            return total + points;
        }, 0));
        const scenePriority = scene => {
            if (scene.answerKey === 'secondhand') return 4 - surveyAnswers.secondhand;
            if (scene.answerKey === 'dishes') return 2;
            if (scene.answerKey === 'chemicals') return 2;
            return surveyAnswers[scene.answerKey] / answerMaxima[scene.answerKey] * 4;
        };
        const scenes = [...lifeScenes]
            .sort(() => Math.random() - 0.5)
            .sort((left, right) => scenePriority(right) - scenePriority(left));
        const gameState = {round: 0, score: startingScore, actions: []};
        const choicesNode = document.querySelector('#life-choices');
        const hintButton = document.querySelector('#hint-button');
        const hintOutput = document.querySelector('#hint-output');
        const hintKeyHelp = document.querySelector('#hint-key-help');
        const progressTrack = document.querySelector('#game-progress-track');

        const scoreText = value => `${value > 0 ? '+' : ''}${value}`;
        const currentSceneData = scene => ({
            title: scene.title,
            context: scene.context.replace('{answer}', lifeLabels[scene.answerKey][surveyAnswers[scene.answerKey]]),
            question: scene.question
        });
        const renderComplete = () => {
            document.querySelector('#life-event').hidden = true;
            document.querySelector('#game-complete').hidden = false;
            progressTrack.setAttribute('aria-valuenow', scenes.length);
            document.querySelector('#game-progress-fill').style.width = '100%';
            document.querySelector('#game-progress-label').textContent = `${scenes.length} of ${scenes.length} decisions`;
            document.querySelector('#final-score').textContent = gameState.score;
            document.querySelector('#starting-score').textContent = startingScore;
            document.querySelector('#score-change').textContent = scoreText(gameState.score - startingScore);
            const recap = document.querySelector('#game-recap');
            recap.replaceChildren();
            gameState.actions.forEach(action => {
                const item = document.createElement('li');
                const decision = document.createElement('span');
                decision.textContent = `${action.title}: ${action.choice}`;
                const points = document.createElement('strong');
                points.textContent = `${scoreText(action.points)} impact points`;
                item.append(decision, points);
                recap.append(item);
            });
            document.querySelector('#complete-title').focus({preventScroll: true});
        };
        const renderRound = (moveFocus = false) => {
            if (gameState.round >= scenes.length) {
                renderComplete();
                return;
            }
            const scene = scenes[gameState.round];
            const day = Math.floor(gameState.round / 3) + 1;
            const decision = gameState.round % 3 + 1;
            document.querySelector('#game-day').textContent = `Day ${day} of 4`;
            document.querySelector('#game-decision').textContent = `Decision ${decision} of 3`;
            document.querySelector('#event-kicker').textContent = `DAY ${day} · DECISION ${decision} OF 3`;
            document.querySelector('#event-title').textContent = scene.title;
            document.querySelector('#event-context').textContent = currentSceneData(scene).context;
            document.querySelector('#event-question').textContent = scene.question;
            document.querySelector('#game-score').textContent = gameState.score;
            document.querySelector('#game-progress-label').textContent = `${gameState.round} of ${scenes.length} decisions`;
            progressTrack.setAttribute('aria-valuemax', scenes.length);
            progressTrack.setAttribute('aria-valuenow', gameState.round);
            document.querySelector('#game-progress-fill').style.width = `${gameState.round / scenes.length * 100}%`;
            hintOutput.textContent = '';
            hintKeyHelp.hidden = true;
            hintButton.disabled = false;
            hintButton.textContent = 'Get a Gemini hint';
            choicesNode.replaceChildren();
            scene.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = 'life-choice';
                button.type = 'button';
                button.setAttribute('aria-label', `${choice.text}; ${scoreText(choice.points)} impact points`);
                const label = document.createElement('span');
                label.className = 'choice-letter';
                label.textContent = String.fromCharCode(65 + index);
                const text = document.createElement('span');
                text.className = 'choice-text';
                text.textContent = choice.text;
                const pointLabel = document.createElement('strong');
                pointLabel.className = choice.points > 0 ? 'choice-points is-higher' : 'choice-points is-lower';
                pointLabel.textContent = `${scoreText(choice.points)} points`;
                button.append(label, text, pointLabel);
                button.addEventListener('click', () => {
                    gameState.score += choice.points;
                    gameState.actions.push({title: scene.title, choice: choice.text, points: choice.points});
                    gameState.round += 1;
                    renderRound(true);
                });
                choicesNode.append(button);
            });
            if (moveFocus) document.querySelector('#event-title').focus({preventScroll: true});
        };

        hintButton.addEventListener('click', async () => {
            const scene = scenes[gameState.round];
            if (!scene || location.protocol === 'file:') {
                hintOutput.textContent = 'Run the local server with python server.py to ask Gemini for a hint.';
                return;
            }
            hintButton.disabled = true;
            hintButton.textContent = 'Asking Gemini…';
            hintOutput.textContent = 'Asking Gemini for a hint based on your answers…';
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 85000);
            try {
                const response = await fetch('/api/hint', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        answers: surveyAnswers,
                        scenario: currentSceneData(scene),
                        choices: scene.choices.map(choice => choice.text),
                        history: gameState.actions.map(action => `${action.title}: ${action.choice}`)
                    }),
                    signal: controller.signal
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const failure = new Error(data.error || `Hint request failed (${response.status}).`);
                    failure.recovery = data.recovery;
                    throw failure;
                }
                hintOutput.textContent = data.hint;
                hintButton.textContent = 'Hint received';
            } catch (error) {
                hintOutput.textContent = error?.name === 'AbortError'
                    ? 'Gemini took too long to respond. Check your connection and try again.'
                    : error instanceof TypeError
                        ? 'Could not reach the local server. Confirm python server.py is running, then try again.'
                        : error instanceof Error ? error.message : 'Gemini could not return a hint. Try again.';
                hintKeyHelp.hidden = error?.recovery !== 'replace_key';
                hintButton.disabled = false;
                hintButton.textContent = 'Try hint again';
            } finally {
                window.clearTimeout(timeout);
            }
        });
        document.querySelector('#restart-game').addEventListener('click', () => {
            gameState.round = 0;
            gameState.score = startingScore;
            gameState.actions = [];
            document.querySelector('#game-complete').hidden = true;
            document.querySelector('#life-event').hidden = false;
            renderRound();
        });
        renderRound();
    }
}
