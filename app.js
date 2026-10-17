const answerNames = ['transport', 'appliances', 'flights', 'diet', 'trash', 'shopping', 'secondhand', 'electronics', 'dishes', 'showers', 'plastics', 'chemicals'];
const layers = ['sky', 'air', 'water', 'twilight', 'deep', 'floor'];
const form = document.querySelector('#footprint-form');
if (form) {
    const cards = Array.from(form.querySelectorAll('.question-card'));
    const flightRange = form.querySelector('[name="flight-hours"]');
    const flightOutput = document.querySelector('#flight-hours-value');
    const progressBar = document.querySelector('.progress-track span');
    const progressTrack = document.querySelector('.progress-track');
    const progressCaption = document.querySelector('.progress-caption');
    progressCaption.setAttribute('aria-live', 'polite');
    const questionGrid = form.querySelector('.question-grid');
    const submitPanel = form.querySelector('.quiz-submit');
    let activeQuestion = 0;
    cards.forEach((card, index) => { card.tabIndex = -1; card.hidden = index !== 0; });
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
        return Boolean(card.querySelector('input[type="radio"]:checked') || card.dataset.rangeAnswered === 'true');
    };
    const renderQuestion = (focus = false) => {
        const complete = activeQuestion >= cards.length;
        questionGrid.hidden = complete;
        controls.hidden = complete;
        submitPanel.hidden = !complete;
        if (complete) return;
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
    cards.forEach((card) => card.addEventListener('change', (event) => {
        if (card !== cards[activeQuestion]) return;
        if (event.target === flightRange) card.dataset.rangeAnswered = 'true';
        nextButton.disabled = !activeCardAnswered();
    }));
    renderQuestion();
    const updateFlightLabel = () => { flightOutput.value = `${flightRange.value} hours`; flightOutput.textContent = flightOutput.value; };
    flightRange.addEventListener('input', () => {
        form.querySelector('[name="flights"]').checked = false;
        cards[2].dataset.rangeAnswered = 'true';
        updateFlightLabel();
        if (cards[activeQuestion] === cards[2]) nextButton.disabled = false;
    });
    form.querySelector('[name="flights"]').addEventListener('change', () => {
        flightRange.value = 2;
        cards[2].dataset.rangeAnswered = 'false';
        updateFlightLabel();
        if (cards[activeQuestion] === cards[2]) nextButton.disabled = false;
    });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const submitted = new FormData(form);
        const answers = Object.fromEntries(answerNames.map(key => [key, key === 'flights' ? (submitted.get('flights') === '0' ? 0 : Number(submitted.get('flight-hours'))) : Number(submitted.get(key))]));
        try {
            localStorage.setItem('ecosphere-answers', JSON.stringify(answers));
            localStorage.removeItem('ecosphere-insights');
            navigateAfterRipple('cascade.html');
        } catch {
            window.alert('Your browser could not save this check-in. Please enable local storage and try again.');
        }
    });
}
function validAnswers(answers) {
    return answers && Object.keys(answers).length === answerNames.length && answerNames.every(key => Number.isFinite(answers[key]) && answers[key] >= 0 && answers[key] <= (key === 'flights' ? 30 : key === 'trash' ? 5 : 4));
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
    let answers;
    try { answers = JSON.parse(localStorage.getItem('ecosphere-answers')); } catch { /* Check-in may be absent. */ }
    if (!validAnswers(answers)) {
        status.textContent = 'Complete the check-in to add your own story to these landscapes.';
        document.querySelector('#score-band').textContent = 'Start with the 12 questions';
        document.querySelectorAll('[data-insight]').forEach(node => { node.textContent = 'Take the check-in to explore how your own routines connect to this environment.'; });
        return;
    }
    scoreNode.textContent = answerNames.length;
    document.querySelector('.score-out-of').textContent = 'answers considered';
    document.querySelector('#score-band').textContent = 'Your check-in';
    document.querySelector('#result-summary').textContent = 'Follow how all twelve of your choices connect through the atmosphere, ocean, and seafloor.';
    const fingerprint = JSON.stringify(answerNames.map(key => answers[key]));
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
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        if (location.protocol === 'file:') throw new Error('Server required');
        const response = await fetch('/api/insights', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers}), signal: controller.signal});
        if (!response.ok) throw new Error('Insights unavailable');
        const data = await response.json();
        if (!validInsights(data.insights)) throw new Error('Invalid response');
        showInsights(data.insights);
        status.textContent = 'Your personal connections · generated with Gemini';
        try { localStorage.setItem('ecosphere-insights', JSON.stringify({fingerprint, insights: data.insights})); } catch { /* Display still works without cache. */ }
    } catch {
        status.textContent = 'AI explanations are unavailable right now. Please try again when the connection is restored.';
    } finally { clearTimeout(timeout); }
}
personalize();
document.querySelector('#back-to-top')?.addEventListener('click', () => {
    document.querySelector('#page-top')?.scrollIntoView({behavior: 'smooth', block: 'start'});
});
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
