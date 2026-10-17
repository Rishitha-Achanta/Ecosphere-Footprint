const answerNames = ['transport', 'flights', 'diet', 'local-food', 'energy', 'temperature', 'packaging', 'waste', 'water', 'shopping'];
const layers = ['sky', 'air', 'water', 'twilight', 'deep', 'floor'];
const form = document.querySelector('#footprint-form');
if (form) {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const answers = Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, Number(value)]));
        try {
            localStorage.setItem('ecosphere-answers', JSON.stringify(answers));
            localStorage.setItem('ecosphere-score', String(Object.values(answers).reduce((sum, n) => sum + n, 0)));
            localStorage.removeItem('ecosphere-insights');
            navigateAfterRipple('cascade.html');
        } catch {
            window.alert('Your browser could not save this check-in. Please enable local storage and try again.');
        }
    });
}

function fallbackInsights(a) {
    return {
        sky: `${a.flights === 0 ? 'You said you do not usually fly, avoiding the emissions associated with those journeys.' : 'Your reported flights connect to climate change through aviation emissions.'} This is different from depletion of the protective ozone layer pictured above.`,
        air: `${['Your walking, cycling, or transit routine can reduce demand for fuel compared with driving alone.', 'Your shared rides or occasional small-car trips can reduce fuel use compared with frequent solo driving.', 'Driving most days connects your routine to transport emissions, especially when the vehicle burns fuel.', 'Using a larger vehicle most days can require more energy per trip than smaller alternatives.'][a.transport]} The air, forests, and climate around you share that connection.`,
        water: `${a.packaging <= 1 ? 'Your limited use of disposable packaging helps reduce the amount of material that could escape into waterways.' : 'The packaging you bring home becomes waste that needs careful disposal to keep it out of waterways.'} The reef and fish here depend on healthy coastal waters.`,
        twilight: `${a.waste === 0 ? 'You recycle and compost when possible, helping keep useful materials out of mixed trash.' : a.waste <= 2 ? 'Your recycling routine helps recover accepted materials when they are sorted correctly.' : 'You said most waste goes into the trash; checking local recycling options could be a useful next step.'} Preventing litter on land helps limit the debris that can travel into ocean habitats.`,
        deep: `${['Your efficient or renewable-powered home can reduce the emissions associated with household energy.', 'The efficient features in your home can reduce energy demand.', 'You noted room to improve home efficiency; reducing wasted heating or cooling can lower energy demand.', 'You are unsure about your home efficiency or think it could improve; checking it is a useful first step.'][a.energy]} Those emissions connect indirectly to ocean warming and the deep sea’s long-term carbon cycle.`,
        floor: `${a.shopping <= 1 ? 'Your less frequent purchases can reduce demand for new materials and manufacturing.' : 'Buying clothes or gadgets often increases demand for materials and manufacturing; keeping one item in use longer is a practical next step.'} Resource use on land connects indirectly to the climate and waste pressures that reach marine ecosystems.`
    };
}
function validAnswers(answers) {
    return answers && answerNames.every(key => Number.isInteger(answers[key]) && answers[key] >= 0 && answers[key] <= 3);
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
    try { answers = JSON.parse(localStorage.getItem('ecosphere-answers')); } catch { /* Generic journey remains available. */ }
    if (!validAnswers(answers)) {
        status.textContent = 'Complete the check-in to add your own story to these landscapes.';
        document.querySelector('#score-band').textContent = 'Start with the 10 questions';
        document.querySelectorAll('[data-insight]').forEach(node => { node.textContent = 'Take the check-in to explore how your own routines connect to this environment.'; });
        return;
    }
    const score = answerNames.reduce((sum, key) => sum + answers[key], 0);
    scoreNode.textContent = score;
    document.querySelector('#score-band').textContent = score <= 9 ? 'Lighter ripple' : score <= 19 ? 'Growing ripple' : 'Wider ripple';
    document.querySelector('#result-summary').textContent = 'From the way you travel to the things you use, your routines connect to these landscapes. Follow your story from the sky to the ocean floor.';
    showInsights(fallbackInsights(answers));
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
        const response = await fetch('/api/insights', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answers}), signal: controller.signal });
        if (!response.ok) throw new Error('Insights unavailable');
        const data = await response.json();
        if (!validInsights(data.insights)) throw new Error('Invalid response');
        showInsights(data.insights);
        status.textContent = 'Your personal connections · generated with Gemini';
        try { localStorage.setItem('ecosphere-insights', JSON.stringify({fingerprint, insights: data.insights})); } catch { /* Display still works without cache. */ }
    } catch {
        status.textContent = 'Showing notes based on your answers. AI explanations are unavailable right now.';
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

// Start on press so the ripple responds immediately, including before navigation.
function navigateAfterRipple(url) {
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    window.setTimeout(() => window.location.assign(url), delay);
}
function createButtonRipple(button, event) {
    if (button.matches(':disabled, [aria-disabled="true"]') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
    // Preserve modified clicks, downloads, and links opening in another tab.
    if (button.matches('a[href]') && !event.defaultPrevented && event.button === 0 &&
        !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey &&
        !button.hasAttribute('download') && (!button.target || button.target === '_self')) {
        event.preventDefault();
        navigateAfterRipple(button.href);
    }
});
