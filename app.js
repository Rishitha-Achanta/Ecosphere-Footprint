const answerNames = ['transport', 'appliances', 'flights', 'diet', 'trash', 'shopping', 'secondhand', 'electronics', 'dishes', 'showers', 'plastics', 'chemicals'];
const layers = ['sky', 'air', 'water', 'twilight', 'deep', 'floor'];
const form = document.querySelector('#footprint-form');
if (form) {
    const flightRange = form.querySelector('[name="flight-hours"]');
    const flightOutput = document.querySelector('#flight-hours-value');
    const updateFlightLabel = () => { flightOutput.value = `${flightRange.value} hours`; flightOutput.textContent = flightOutput.value; };
    flightRange.addEventListener('input', () => {
        form.querySelector('[name="flights"]').checked = false;
        updateFlightLabel();
    });
    form.querySelector('[name="flights"]').addEventListener('change', () => { flightRange.value = 2; updateFlightLabel(); });
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
    return data && layers.every(key => typeof data[key] === 'string' && data[key].length >= 20 && data[key].length <= 650);
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
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            document.querySelectorAll('.layer-nav a').forEach(link => {
                if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        });
    }, {rootMargin: '-15% 0px -45% 0px'});
    document.querySelectorAll('.layer-section').forEach(section => observer.observe(section));
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
