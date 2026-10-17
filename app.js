const form = document.querySelector("#footprint-form");

if (form) {
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const answers = new FormData(form);
        const score = Array.from(answers.values()).reduce(
            (total, value) => total + Number(value),
            0
        );

        try {
            localStorage.setItem("ecosphere-score", String(score));
            window.location.assign("cascade.html");
        } catch (error) {
            console.error("Unable to save the footprint check-in.", error);
            window.alert("Your browser could not save this check-in. Please enable local storage and try again.");
        }
    });
}

const scoreElement = document.querySelector("#score-value");

if (scoreElement) {
    const scoreBand = document.querySelector("#score-band");
    const summary = document.querySelector("#result-summary");
    const airInsight = document.querySelector('[data-insight="air"]');
    const waterInsight = document.querySelector('[data-insight="water"]');
    const deepInsight = document.querySelector('[data-insight="deep"]');
    let score;

    try {
        const savedScore = localStorage.getItem("ecosphere-score");
        score = savedScore === null ? null : Number(savedScore);
    } catch (error) {
        console.error("Unable to read the saved footprint check-in.", error);
        score = null;
    }

    if (score === null || !Number.isInteger(score) || score < 0 || score > 30) {
        scoreElement.textContent = "—";
        scoreBand.textContent = "Start with the 10 questions";
        summary.textContent = "Take the footprint check-in to see a personal snapshot, then follow the ripple from sky to sea.";
    } else {
        scoreElement.textContent = String(score);

        if (score <= 9) {
            scoreBand.textContent = "Lighter ripple";
            summary.textContent = "Your answers point to several lower-impact routines. Explore how these choices connect to the bigger planetary picture.";
        } else if (score <= 19) {
            scoreBand.textContent = "Growing ripple";
            summary.textContent = "Your answers show a mix of everyday habits. A few small shifts could help soften your ripple over time.";
        } else {
            scoreBand.textContent = "Wider ripple";
            summary.textContent = "Your answers show places where everyday routines may have a wider footprint. There is no judgment here—every next step counts.";
        }

        if (airInsight) {
            airInsight.textContent = score >= 20
                ? "Reviewing your travel and home-energy routines could be a useful place to explore."
                : "Your transport and home-energy choices are part of the atmosphere's story.";
        }
        if (waterInsight) {
            waterInsight.textContent = score >= 20
                ? "Looking for ways to reduce packaging and waste can help keep waterways cleaner."
                : "The things we use and throw away can travel through waterways to the sea.";
        }
        if (deepInsight) {
            deepInsight.textContent = score >= 20
                ? "Energy use is one place to look for a practical next step that supports climate stability."
                : "Using energy thoughtfully is one way to care for the climate systems that reach even the deep ocean.";
        }
    }
}
