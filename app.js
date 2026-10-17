const answerNames = ['transport', 'appliances', 'flights', 'diet', 'trash', 'shopping', 'secondhand', 'electronics', 'dishes', 'showers', 'plastics', 'chemicals'];
const layers = ['sky', 'air', 'water', 'twilight', 'deep', 'floor'];
const defaultInsights = Object.fromEntries(Array.from(document.querySelectorAll('[data-insight]'), node => [node.dataset.insight, node.textContent.trim()]));
const form = document.querySelector('#footprint-form');
if (form) {
    const cards = Array.from(form.querySelectorAll('.question-card'));
    const progressBar = document.querySelector('.progress-track span');
    const progressTrack = document.querySelector('.progress-track');
    const progressCaption = document.querySelector('.progress-caption');
    progressCaption.setAttribute('aria-live', 'polite');
    const questionGrid = form.querySelector('.question-grid');
    const submitPanel = form.querySelector('.quiz-submit');
    let activeQuestion = 0;
    cards.forEach((card, index) => { card.tabIndex = -1; card.hidden = index !== 0; });
    cards.forEach(card => card.querySelectorAll('input[type="range"]').forEach(slider => {
        const labels = slider.dataset.labels.split('|');
        slider.setAttribute('aria-valuetext', labels[Number(slider.value)]);
        const rail = document.createElement('div');
        rail.className = 'slider-mark-rail';
        rail.setAttribute('aria-hidden', 'true');
        labels.forEach((label, index) => {
            const tick = document.createElement('span');
            tick.className = 'slider-tick';
            tick.title = label;
            tick.style.left = `${index / (labels.length - 1) * 100}%`;
            rail.append(tick);
        });
        const labelSlots = window.matchMedia('(max-width: 520px)').matches ? 3 : 5;
        const visibleCount = Math.min(labelSlots, labels.length);
        const visibleIndexes = visibleCount === labels.length
            ? labels.map((_, index) => index)
            : Array.from({length: visibleCount}, (_, slot) => Math.round(slot * (labels.length - 1) / (visibleCount - 1)));
        visibleIndexes.forEach(index => {
            const markerLabel = document.createElement('span');
            markerLabel.className = 'slider-mark-label';
            if (index === 0) markerLabel.classList.add('is-first');
            if (index === labels.length - 1) markerLabel.classList.add('is-last');
            markerLabel.textContent = labels[index];
            markerLabel.style.left = `${index / (labels.length - 1) * 100}%`;
            rail.append(markerLabel);
        });
        slider.closest('.slider-control').insertAdjacentElement('afterend', rail);
    }));
    submitPanel.hidden = true;
    const controls = document.createElement('div');
    controls.className = 'quiz-step-controls';
    controls.innerHTML = '<button class="button button-secondary" type="button" data-step-back>Back</button><p class="step-hint" aria-live="polite"></p><button class="button button-primary" type="button" data-step-next disabled>Continue <span aria-hidden="true">→</span></button>';
    questionGrid.after(controls);
    const backButton = controls.querySelector('[data-step-back]');
    const nextButton = controls.querySelector('[data-step-next]');
    const stepHint = controls.querySelector('.step-hint');
    const activeCardAnswered = () => {
        const card = cards[activeQuestion];
        if (!card) return false;
        return card.dataset.answered === 'true';
    };
    const renderQuestion = (focus = false) => {
        const complete = activeQuestion >= cards.length;
        questionGrid.hidden = complete;
        controls.hidden = false;
        submitPanel.hidden = !complete;
        if (complete) {
            backButton.disabled = false;
            nextButton.hidden = true;
            stepHint.textContent = 'All 12 questions answered';
            progressTrack.setAttribute('aria-label', `All ${cards.length} questions answered`);
            progressBar.style.width = '100%';
            progressCaption.innerHTML = `${cards.length} of ${cards.length} questions <span>·</span> Complete`;
            return;
        }
        nextButton.hidden = false;
        cards.forEach((card, index) => { card.hidden = index !== activeQuestion; });
        backButton.disabled = activeQuestion === 0;
        nextButton.disabled = !activeCardAnswered();
        nextButton.innerHTML = activeQuestion === cards.length - 1 ? 'Finish check-in <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
        stepHint.textContent = `Question ${activeQuestion + 1} of ${cards.length}`;
        progressTrack.setAttribute('aria-label', `Question ${activeQuestion + 1} of ${cards.length}`);
        progressBar.style.width = `${((activeQuestion + 1) / cards.length) * 100}%`;
        progressCaption.innerHTML = `${activeQuestion + 1} of ${cards.length} questions <span>·</span> Answer to continue`;
        if (focus) {
            cards[activeQuestion].focus({preventScroll: true});
            cards[activeQuestion].scrollIntoView({behavior: 'smooth', block: 'center'});
        }
    };
    backButton.addEventListener('click', () => { if (activeQuestion > 0) { activeQuestion--; renderQuestion(true); } });
    nextButton.addEventListener('click', () => { if (activeCardAnswered()) { activeQuestion++; renderQuestion(true); } });
    cards.forEach((card) => card.addEventListener('input', (event) => {
        if (card !== cards[activeQuestion]) return;
        const slider = event.target.closest('input[type="range"]');
        if (!slider) return;
        card.dataset.answered = 'true';
        const labels = slider.dataset.labels.split('|');
        const selectedLabel = labels[Number(slider.value)];
        card.querySelector(`[data-slider-output="${slider.name}"]`).textContent = selectedLabel;
        slider.setAttribute('aria-valuetext', selectedLabel);
        nextButton.disabled = !activeCardAnswered();
    }));
    cards.forEach(card => {
        card.addEventListener('pointerdown', event => {
            if (card !== cards[activeQuestion] || !event.target.matches('input[type="range"]')) return;
            card.dataset.answered = 'true';
            nextButton.disabled = false;
        });
        card.addEventListener('keydown', event => {
            if (card !== cards[activeQuestion] || !event.target.matches('input[type="range"]')) return;
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return;
            card.dataset.answered = 'true';
            nextButton.disabled = false;
        });
    });
    renderQuestion();
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const submitted = new FormData(form);
        const answers = Object.fromEntries(answerNames.map(key => [key, Number(submitted.get(key))]));
        try {
            localStorage.setItem('ecosphere-answers', JSON.stringify(answers));
            localStorage.removeItem('ecosphere-insights');
            try {
                sessionStorage.removeItem('ecosphere-life-unlocked');
                sessionStorage.removeItem('ecosphere-life-game-id');
            } catch { /* Session storage is optional. */ }
            navigateAfterRipple('cascade.html');
        } catch {
            window.alert('Your browser could not save this check-in. Please enable local storage and try again.');
        }
    });
}
document.querySelector('#play-life-game')?.addEventListener('click', () => {
    try { sessionStorage.setItem('ecosphere-life-unlocked', 'cascade-bottom'); } catch { /* The game page will explain the route if storage is disabled. */ }
});
function validAnswers(answers) {
    const maxima = {transport: 4, appliances: 4, flights: 16, diet: 4, trash: 5, shopping: 4, secondhand: 4, electronics: 4, dishes: 1, showers: 4, plastics: 4, chemicals: 4};
    return answers && Object.keys(answers).length === answerNames.length && answerNames.every(key => Number.isInteger(answers[key]) && answers[key] >= 0 && answers[key] <= maxima[key]);
}
function responseScore(answers) {
    const scoreKeys = ['transport', 'appliances', 'flights', 'diet', 'trash', 'shopping', 'secondhand', 'electronics', 'showers', 'plastics'];
    const maxValues = {transport: 4, appliances: 4, flights: 16, diet: 4, trash: 5, shopping: 4, secondhand: 4, electronics: 4, showers: 4, plastics: 4};
    const points = scoreKeys.reduce((sum, key) => {
        const value = key === 'flights' ? answers[key] / 16 * 5 : key === 'secondhand' ? 5 - answers[key] / 4 * 5 : answers[key] / maxValues[key] * 5;
        return sum + value;
    }, 0);
    return Math.round(points);
}
function validInsights(data) {
    return data && layers.every(key => {
        const text = data[key];
        if (typeof text !== 'string') return false;
        const words = text.trim().split(/\s+/).length;
        const sentences = (text.match(/[^.!?]+[.!?](?=\s|$)/g) || []).length;
        return words >= 50 && words <= 150 && sentences >= 1 && sentences <= 3;
    });
}
function showInsights(insights) {
    document.querySelectorAll('[data-insight]').forEach(node => { node.textContent = insights[node.dataset.insight]; });
}
async function personalize() {
    const scoreNode = document.querySelector('#score-value');
    if (!scoreNode) return;
    const status = document.querySelector('#insight-status');
    const retryButton = document.querySelector('#insight-retry');
    const keyHelp = document.querySelector('#gemini-key-help');
    if (retryButton) retryButton.hidden = true;
    if (keyHelp) keyHelp.hidden = true;
    let answers;
    try { answers = JSON.parse(localStorage.getItem('ecosphere-answers')); } catch { /* Check-in may be absent. */ }
    if (!validAnswers(answers)) {
        status.textContent = 'Complete the check-in to add your own story to these landscapes.';
        document.querySelector('#score-band').textContent = 'Start with the 12 questions';
        document.querySelectorAll('[data-insight]').forEach(node => { node.textContent = 'Take the check-in to explore how your own routines connect to this environment.'; });
        return;
    }
    const score = responseScore(answers);
    scoreNode.textContent = score;
    document.querySelector('.score-out-of').textContent = 'out of 50 points';
    document.querySelector('#score-band').textContent = score < 17 ? 'Lower reported-use range' : score < 34 ? 'Middle reported-use range' : 'Higher reported-use range';
    document.querySelector('#result-summary').textContent = 'Your 12 answers shape these layer-by-layer ripples. The reflection score uses 10 resource-use answers; dishwashing and chemical-handling frequency inform your ripples but are not scored because method and disposal details matter. This is not a calculated footprint.';
    document.querySelectorAll('[data-insight]').forEach(node => { node.textContent = 'Preparing a layer-specific explanation from your answers…'; });
    const fingerprint = JSON.stringify({version: 4, answers: answerNames.map(key => answers[key])});
    try {
        const cached = JSON.parse(localStorage.getItem('ecosphere-insights'));
        if (cached?.fingerprint === fingerprint && validInsights(cached.insights)) {
            showInsights(cached.insights);
            status.textContent = 'Your personal connections · generated with Gemini';
            return;
        }
    } catch { /* Caching is optional. */ }
    status.textContent = 'Connecting your choices to each landscape…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 85000);
    try {
        if (location.protocol === 'file:') throw new Error('Open the site through the local Python server (python server.py) to connect to Gemini.');
        const response = await fetch('/api/insights', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers}), signal: controller.signal});
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const failure = new Error(data.error || `Gemini request failed (${response.status}).`);
            failure.recovery = data.recovery;
            throw failure;
        }
        if (!validInsights(data.insights)) {
            const failure = new Error('Gemini returned an incomplete explanation. Retry to generate it again.');
            failure.recovery = 'retry';
            throw failure;
        }
        showInsights(data.insights);
        status.textContent = 'Your personal connections · generated with Gemini';
        try { localStorage.setItem('ecosphere-insights', JSON.stringify({fingerprint, insights: data.insights})); } catch { /* Display still works without cache. */ }
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown Gemini error.';
        status.textContent = error?.name === 'AbortError'
            ? 'Gemini took too long to respond. Check your connection and retry.'
            : error instanceof TypeError
                ? 'Could not reach the local server. Confirm python server.py is running, then retry.'
                : reason;
        console.warn('Gemini ripple generation failed:', error);
        showInsights(defaultInsights);
        if (retryButton) retryButton.hidden = false;
        if (keyHelp && error?.recovery === 'replace_key') keyHelp.hidden = false;
    } finally { clearTimeout(timeout); }
}
document.querySelector('#insight-retry')?.addEventListener('click', () => personalize());
personalize();
document.querySelector('#back-to-top')?.addEventListener('click', () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    document.querySelector('#page-top')?.scrollIntoView({behavior, block: 'start'});
});
const journeyFigure = document.querySelector('#journey-figure');
if (journeyFigure) {
    const journeyStage = document.querySelector('#journey-stage');
    const journeyProgress = document.querySelector('#journey-progress');
    const journeyProgressbar = document.querySelector('#journey-progressbar');
    const journeyLayers = Array.from(document.querySelectorAll('.layer-section'));
    let journeyFrame = 0;
    const updateJourney = () => {
        journeyFrame = 0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
        journeyProgress.style.height = `${progress * 100}%`;
        journeyFigure.style.top = `${progress * 100}%`;
        journeyProgressbar.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
        const currentLayer = journeyLayers.filter(layer => layer.getBoundingClientRect().top <= window.innerHeight * .55).at(-1);
        const underwater = currentLayer && journeyLayers.indexOf(currentLayer) >= 2;
        journeyFigure.textContent = underwater ? '🤿' : '🧑‍🚀';
        journeyFigure.setAttribute('aria-label', underwater ? 'Scuba diver in the ocean' : 'Astronaut in the atmosphere');
        journeyStage.textContent = underwater ? 'Ocean · scuba diver' : 'Atmosphere · astronaut';
        journeyProgressbar.setAttribute('aria-valuetext', underwater ? 'Ocean, scuba diver' : 'Atmosphere, astronaut');
    };
    window.addEventListener('scroll', () => {
        if (!journeyFrame) journeyFrame = window.requestAnimationFrame(updateJourney);
    }, {passive: true});
    window.addEventListener('resize', updateJourney);
    updateJourney();
}
function navigateAfterRipple(url) {
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    window.setTimeout(() => window.location.assign(url), delay);
}
function createButtonRipple(button, event) {
    if (button.matches(':disabled, [aria-disabled="true"]') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = button.getBoundingClientRect();
    const keyboard = event.type === 'click' && event.detail === 0;
    const x = keyboard ? bounds.width / 2 : event.clientX - bounds.left;
    const y = keyboard ? bounds.height / 2 : event.clientY - bounds.top;
    const size = 2 * Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y));
    const ripple = document.createElement('span');
    ripple.className = 'button-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    button.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), {once: true});
    window.setTimeout(() => ripple.remove(), 700);
}
document.addEventListener('pointerdown', event => {
    const button = event.target.closest('button, .button');
    if (button && event.button === 0) createButtonRipple(button, event);
});
document.addEventListener('click', event => {
    const button = event.target.closest('button, .button');
    if (!button) return;
    if (event.detail === 0) createButtonRipple(button, event);
    if (button.matches('a[href]') && !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && !button.hasAttribute('download') && (!button.target || button.target === '_self')) {
        event.preventDefault();
        navigateAfterRipple(button.href);
    }
});
