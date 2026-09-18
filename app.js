// Text banks for each difficulty level
const TEXT_BANKS = {
    easy: [
        "The sun rises every morning and brings warmth and light to the world. Birds sing in the trees as people start their daily routine. A simple walk in the park can clear your mind and bring a smile to your face. Enjoy the little things each day.",
        "Walking by the river is peaceful and calming. The water flows gently over smooth stones while fish swim below the surface. Children play with colorful balls on the green grass under the warm sunshine.",
        "Practice makes you better at anything you do. Typing words with steady rhythm helps your hands learn where each key belongs. Take your time and focus on hitting the right letters without rushing."
    ],
    medium: [
        "The quick brown fox jumps over the lazy dog, a classic phrase that includes every letter of the alphabet to warm up your fingers. Typing with consistency is far more important than raw speed when you first begin, as accuracy naturally leads to faster results over time. Keep your back straight, your wrists level with the keyboard, and try to look at the screen rather than your hands.",
        "Technology continues to reshape how we communicate and learn across the globe. Developing strong keyboard skills enhances productivity, allowing thoughts to flow directly into written form without mechanical friction. Taking brief breaks to stretch prevents fatigue during extended typing sessions.",
        "Curiosity is the engine of intellectual growth and discovery. When tackling complex challenges, breaking them down into manageable pieces prevents feeling overwhelmed. Dedication, coupled with consistent daily practice, yields remarkable progress over weeks and months."
    ],
    hard: [
        "JavaScript (ECMAScript 2026) employs asynchronous event-driven architectures, utilizing Promises, async/await, and microtask queues to handle high-concurrency workloads efficiently. Proper error handling via try-catch blocks and strict null checks mitigates runtime exceptions in production environments.",
        "Quantum computing paradigms leverage superposition and entanglement principles, fundamentally disrupting conventional cryptographic algorithms like RSA-4096 and ECC-256. Transitioning towards post-quantum lattice-based encryption algorithms has become an imperative priority for cyber-security frameworks worldwide.",
        "According to thermodynamic principles, entropy (S = k * ln(W)) within an isolated macroscopic system tends to increase perpetually. Consequently, optimizing computational thermodynamic efficiency requires sophisticated cooling architectures alongside micro-architectural pipelining refinements."
    ]
};

// Tier definitions based on WPM
const TIERS = [
    { minWpm: 85, title: "Master", color: "text-purple-400" },
    { minWpm: 66, title: "Pro", color: "text-blue-400" },
    { minWpm: 46, title: "Fast", color: "text-amber-400" },
    { minWpm: 26, title: "Intermediate", color: "text-emerald-400" },
    { minWpm: 0, title: "Beginner", color: "text-slate-400" }
];

// DOM Elements
const durationSelect = document.getElementById("duration");
const timerDiv = document.getElementById("timer");
const textContainer = document.getElementById("text-container");
const textDiv = document.getElementById("text");
const input = document.getElementById("input");
const accuracyDiv = document.getElementById("Accuracy");
const wpmDiv = document.getElementById("wpm");
const prizeDiv = document.getElementById("prize");
const speedDiv = document.getElementById("speed");
const restartBtn = document.getElementById("restart-btn");
const capslockWarning = document.getElementById("capslock-warning");
const difficultyBtns = document.querySelectorAll(".difficulty-btn");

// Modal Elements
const resultsModal = document.getElementById("results-modal");
const modalRestartBtn = document.getElementById("modal-restart-btn");
const modalWpm = document.getElementById("modal-wpm");
const modalAccuracy = document.getElementById("modal-accuracy");
const modalCorrectChars = document.getElementById("modal-correct-chars");
const modalWrongChars = document.getElementById("modal-wrong-chars");
const modalCorrectWords = document.getElementById("modal-correct-words");
const modalWrongWords = document.getElementById("modal-wrong-words");
const modalRank = document.getElementById("modal-rank");
const modalBadgeIcon = document.getElementById("modal-badge-icon");

// Game State
let currentDifficulty = "medium";
let words = [];
let currentWordIndex = 0;
let correctWordsCount = 0;
let incorrectWordsCount = 0;
let correctCharsCount = 0;
let incorrectCharsCount = 0;

let countdown = null;
let timerStarted = false;
let totalTime = durationSelect ? parseInt(durationSelect.value, 10) || 15 : 15;
let timeLeft = totalTime;
let isGameOver = false;

// Get Rank Tier by WPM
function getTier(wpm) {
    return TIERS.find(tier => wpm >= tier.minWpm) || TIERS[TIERS.length - 1];
}

// Update Top Badges
function updateBadges(wpm) {
    const tier = getTier(wpm);
    if (prizeDiv) {
        prizeDiv.innerHTML = `<span>${tier.title}</span>`;
    }
    if (speedDiv) {
        speedDiv.innerHTML = `<span>${wpm} WPM</span>`;
    }
}

// Select and load a random text from current difficulty
function loadNewText() {
    const texts = TEXT_BANKS[currentDifficulty] || TEXT_BANKS.medium;
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    
    // Split text cleanly by any whitespace
    words = randomText.trim().split(/\s+/);
    
    // Render as individual spans
    if (textDiv) {
        textDiv.innerHTML = words.map((word, idx) => {
            return `<span class="word" id="word-${idx}">${word}</span>`;
        }).join(" ");
    }

    // Highlight the very first word
    highlightWord(0);
}

// Highlight the target word and scroll into view if needed
function highlightWord(idx) {
    if (!textDiv) return;
    const prevActive = textDiv.querySelector(".word.active");
    if (prevActive) {
        prevActive.classList.remove("active");
    }

    const currentWordElem = document.getElementById(`word-${idx}`);
    if (currentWordElem) {
        currentWordElem.classList.add("active");
        
        // Auto-scroll container if word goes off-view
        if (textContainer) {
            const containerRect = textContainer.getBoundingClientRect();
            const wordRect = currentWordElem.getBoundingClientRect();

            if (wordRect.bottom > containerRect.bottom - 20 || wordRect.top < containerRect.top + 20) {
                currentWordElem.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }
}

// Calculate and update live statistics
function updateStats() {
    const elapsedSeconds = totalTime - timeLeft;
    const elapsedMinutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0;
    
    // Standard WPM: (correct characters / 5) / minutes elapsed
    let currentWpm = 0;
    if (elapsedMinutes > 0) {
        currentWpm = Math.round((correctCharsCount / 5) / elapsedMinutes);
    }

    // Accuracy: correct characters / total attempted characters
    const totalAttemptedChars = correctCharsCount + incorrectCharsCount;
    let currentAccuracy = 100;
    if (totalAttemptedChars > 0) {
        currentAccuracy = Math.round((correctCharsCount / totalAttemptedChars) * 100);
    }

    if (wpmDiv) wpmDiv.innerText = currentWpm;
    if (accuracyDiv) accuracyDiv.innerText = `${currentAccuracy}%`;
    updateBadges(currentWpm);

    return { currentWpm, currentAccuracy };
}

// Start the timer on first valid keypress
function startTimer() {
    if (timerStarted || isGameOver) return;
    
    timerStarted = true;
    countdown = setInterval(() => {
        timeLeft--;
        if (timerDiv) timerDiv.innerText = timeLeft;
        updateStats();

        if (timeLeft <= 0) {
            clearInterval(countdown);
            finishGame();
        }
    }, 1000);
}

// Complete the game and display summary modal
function finishGame() {
    if (isGameOver) return;
    isGameOver = true;

    clearInterval(countdown);
    if (input) {
        input.disabled = true;
        input.classList.remove("input-error");
    }

    const { currentWpm, currentAccuracy } = updateStats();
    const tier = getTier(currentWpm);

    // Populate modal
    if (modalWpm) modalWpm.innerHTML = `${currentWpm} <span class="text-xs text-slate-500 font-normal">WPM</span>`;
    if (modalAccuracy) modalAccuracy.innerText = `${currentAccuracy}%`;
    if (modalCorrectChars) modalCorrectChars.innerText = correctCharsCount;
    if (modalWrongChars) modalWrongChars.innerText = incorrectCharsCount;
    if (modalCorrectWords) modalCorrectWords.innerText = correctWordsCount;
    if (modalWrongWords) modalWrongWords.innerText = incorrectWordsCount;
    if (modalRank) modalRank.innerText = tier.title;
    if (modalBadgeIcon) modalBadgeIcon.classList.add("hidden");

    // Show modal
    if (resultsModal) {
        resultsModal.classList.remove("hidden");
    }
    if (modalRestartBtn) {
        modalRestartBtn.focus();
    }
}

// Reset the entire game state without reloading the page
function resetGame() {
    clearInterval(countdown);
    countdown = null;
    timerStarted = false;
    isGameOver = false;

    totalTime = durationSelect ? parseInt(durationSelect.value, 10) || 15 : 15;
    timeLeft = totalTime;
    if (timerDiv) timerDiv.innerText = timeLeft;

    currentWordIndex = 0;
    correctWordsCount = 0;
    incorrectWordsCount = 0;
    correctCharsCount = 0;
    incorrectCharsCount = 0;

    if (wpmDiv) wpmDiv.innerText = "0";
    if (accuracyDiv) accuracyDiv.innerText = "100%";
    if (speedDiv) speedDiv.innerHTML = `<span>0 WPM</span>`;
    if (prizeDiv) prizeDiv.innerHTML = `<span>Ready</span>`;

    if (input) {
        input.disabled = false;
        input.value = "";
        input.classList.remove("input-error");
    }

    if (resultsModal) {
        resultsModal.classList.add("hidden");
    }

    loadNewText();
    if (textContainer) textContainer.scrollTop = 0;
    if (input) input.focus();
}

// Set active difficulty UI button style
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    difficultyBtns.forEach(btn => {
        if (btn.getAttribute("data-difficulty") === difficulty) {
            btn.className = "difficulty-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-blue-600 text-white shadow-md shadow-blue-600/30";
        } else {
            btn.className = "difficulty-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/60";
        }
    });
    resetGame();
}

// Event Listeners for Difficulty buttons
difficultyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const diff = btn.getAttribute("data-difficulty");
        setDifficulty(diff);
    });
});

// Event Listener for Duration dropdown
if (durationSelect) {
    durationSelect.addEventListener("change", () => {
        resetGame();
    });
}

// Clicking text container auto-focuses the input
if (textContainer && input) {
    textContainer.addEventListener("click", () => {
        if (!isGameOver) input.focus();
    });
}

// Live input handling for real-time error styling
if (input) {
    input.addEventListener("input", () => {
        if (isGameOver) return;
        
        // Start timer on input if not started yet
        if (!timerStarted && input.value.length > 0) {
            startTimer();
        }

        const currentTargetWord = words[currentWordIndex] || "";
        const typedValue = input.value;

        // Auto-complete if user finishes the very last word of the text
        if (currentWordIndex === words.length - 1 && typedValue === currentTargetWord) {
            const wordElem = document.getElementById(`word-${currentWordIndex}`);
            if (wordElem) {
                wordElem.classList.remove("active");
                wordElem.classList.add("correct");
            }
            correctWordsCount++;
            correctCharsCount += currentTargetWord.length;
            input.value = "";
            finishGame();
            return;
        }

        // Partial match validation
        if (!currentTargetWord.startsWith(typedValue)) {
            input.classList.add("input-error");
        } else {
            input.classList.remove("input-error");
        }
    });

    // Keydown event handling (Space submission, CapsLock, Shortcuts)
    input.addEventListener("keydown", (e) => {
        // Detect Caps Lock
        if (e.getModifierState && capslockWarning) {
            if (e.getModifierState("CapsLock")) {
                capslockWarning.classList.remove("hidden");
            } else {
                capslockWarning.classList.add("hidden");
            }
        }

        if (isGameOver) return;

        // Ignore modifier keys for starting the timer
        const ignoredKeys = ["Shift", "Control", "Alt", "Meta", "Escape", "Tab", "CapsLock"];
        if (!ignoredKeys.includes(e.key) && !timerStarted) {
            startTimer();
        }

        // Space key: submit current word
        if (e.key === " ") {
            e.preventDefault(); // Prevent space from being typed into the input field

            const typedWord = input.value.trim();
            if (typedWord.length === 0) return; // Ignore leading or repeated spaces

            const targetWord = words[currentWordIndex];
            const wordElem = document.getElementById(`word-${currentWordIndex}`);

            if (typedWord === targetWord) {
                if (wordElem) {
                    wordElem.classList.remove("active");
                    wordElem.classList.add("correct");
                }
                correctWordsCount++;
                // Count characters of the word plus the trailing space
                correctCharsCount += targetWord.length + 1;
            } else {
                if (wordElem) {
                    wordElem.classList.remove("active");
                    wordElem.classList.add("incorrect");
                }
                incorrectWordsCount++;
                // Count incorrect character attempts
                incorrectCharsCount += Math.max(typedWord.length, targetWord.length) + 1;
            }

            // Advance to next word
            currentWordIndex++;
            input.value = "";
            input.classList.remove("input-error");

            // Check if finished passage
            if (currentWordIndex >= words.length) {
                finishGame();
            } else {
                highlightWord(currentWordIndex);
            }

            updateStats();
        }
    });
}

// Global Keyboard Shortcuts
window.addEventListener("keydown", (e) => {
    // Esc to restart
    if (e.key === "Escape") {
        e.preventDefault();
        resetGame();
    }

    // Enter in results modal to restart
    if (e.key === "Enter" && resultsModal && !resultsModal.classList.contains("hidden")) {
        e.preventDefault();
        resetGame();
    }
});

// Restart Buttons
if (restartBtn) restartBtn.addEventListener("click", resetGame);
if (modalRestartBtn) modalRestartBtn.addEventListener("click", resetGame);

// Initial Setup
setDifficulty("medium");
