'use strict';

// ── States ──────────────────────────────────
let mode         = null;
let selectedNums = [];
let lives        = 3;
let questionCount = 0;
const TOTAL_Q    = 5;
const MAX_LIVES  = 3;
let currentAnswer = null;
let answering     = false;
let correctCount  = 0;

// ── Screen refs ────────────────────────────
const screens = {
    home:   document.getElementById('home-screen'),
    number: document.getElementById('number-screen'),
    game:   document.getElementById('game-screen'),
    result: document.getElementById('result-screen'),
};

// ── Audio ──────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { }
    }
    return audioCtx;
}

function playTone(freq, type, duration, vol = 0.3, delay = 0) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type      = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration + 0.05);
    } catch (e) { }
}

function soundCorrect() {
    playTone(523, 'sine', 0.12, 0.25);
    playTone(659, 'sine', 0.12, 0.25, 0.12);
    playTone(784, 'sine', 0.18, 0.25, 0.24);
}

function soundWrong() {
    playTone(200, 'sawtooth', 0.2, 0.3);
    playTone(150, 'sawtooth', 0.2, 0.3, 0.15);
}

function soundWin() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => playTone(f, 'sine', 0.25, 0.3, i * 0.1));
}

function soundLose() {
    playTone(300, 'sawtooth', 0.15, 0.3);
    playTone(250, 'sawtooth', 0.15, 0.3, 0.15);
    playTone(200, 'sawtooth', 0.3,  0.3, 0.3);
}

function soundClick() {
    playTone(440, 'sine', 0.06, 0.15);
}

// ── High Score ─────────────────────────────
const HS_KEY = 'easyMaths_highScore';

function getHighScore() {
    return parseInt(localStorage.getItem(HS_KEY) || '0', 10);
}

function saveHighScore(score) {
    const prev = getHighScore();
    if (score > prev) {
        localStorage.setItem(HS_KEY, score);
        return true; // new record
    }
    return false;
}

function updateHomeHighScore() {
    const el  = document.getElementById('home-high-score');
    const hs  = getHighScore();
    el.textContent = hs > 0 ? `🏆 Best Score: ${hs} / 5` : '🎮 No score yet — play to set one!';
}

// ── Screen transitions ─────────────────────
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    // Re-trigger animation by resetting class
    screens[name].style.animation = 'none';
    void screens[name].offsetHeight; // reflow
    screens[name].style.animation = '';
}

// ── Home Screen ────────────────────────────
function goHome() {
    soundClick();
    closeModal();
    showScreen('home');
    updateHomeHighScore();
}

function confirmGoHome() {
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

// ── Mode Selection ─────────────────────────
function startMode(selectedMode) {
    soundClick();
    mode = selectedMode;
    selectedNums = [];
    buildNumberGrid();
    document.getElementById('pick-mode-label').textContent = '3';
    updateSelectedPreview();
    document.getElementById('start-game-btn').disabled = true;
    showScreen('number');
}

// ── Number Grid ────────────────────────────
function buildNumberGrid() {
    const grid = document.getElementById('number-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className  = 'num-btn';
        btn.textContent = i;
        btn.dataset.num = i;
        btn.addEventListener('click', () => toggleNumber(i, btn));
        grid.appendChild(btn);
    }
}

function toggleNumber(num, btn) {
    if (btn.classList.contains('selected')) {
        // deselect
        selectedNums = selectedNums.filter(n => n !== num);
        btn.classList.remove('selected');
    } else {
        if (selectedNums.length >= 3) return; // already 3 selected
        selectedNums.push(num);
        btn.classList.add('selected');
        soundClick();
    }
    updateSelectedPreview();
    document.getElementById('start-game-btn').disabled = (selectedNums.length !== 3);
}

function updateSelectedPreview() {
    const el = document.getElementById('preview-nums');
    if (selectedNums.length === 0) {
        el.textContent = '—';
    } else {
        el.textContent = selectedNums.join(', ');
    }
}

// ── Game Start ─────────────────────────────
function beginGame() {
    if (selectedNums.length !== 3) return;
    soundClick();
    lives        = MAX_LIVES;
    questionCount = 0;
    correctCount  = 0;
    answering     = false;
    buildLivesDisplay();
    renderModeBadge();
    nextQuestion();
    showScreen('game');
}

function renderModeBadge() {
    const badge = document.getElementById('mode-badge');
    badge.textContent = mode === 'add' ? 'Addition' : 'Subtraction';
    badge.className = 'mode-badge ' + (mode === 'add' ? 'add' : 'sub');
}

// ── Lives Display ──────────────────────────
function buildLivesDisplay() {
    const container = document.getElementById('lives');
    container.innerHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
        const h = document.createElement('span');
        h.className = 'life-heart';
        h.dataset.index = i;
        h.textContent = '❤️';
        container.appendChild(h);
    }
}

function updateLivesDisplay() {
    const hearts = document.querySelectorAll('.life-heart');
    hearts.forEach((h, i) => {
        if (i >= lives) {
            if (!h.classList.contains('lost')) {
                h.classList.add('animate-lost');
                h.addEventListener('animationend', () => {
                    h.classList.remove('animate-lost');
                    h.classList.add('lost');
                    h.textContent = '🖤';
                }, { once: true });
            }
        }
    });
}

// ── Question Engine ────────────────────────
function nextQuestion() {
    if (questionCount >= TOTAL_Q) {
        endGame(true);
        return;
    }

    answering = false;
    questionCount++;
    document.getElementById('progress').textContent =
        `Question ${questionCount} of ${TOTAL_Q}`;

    const a = selectedNums[Math.floor(Math.random() * 3)];
    const b = selectedNums[Math.floor(Math.random() * 3)];

    let numA = a, numB = b;
    if (mode === 'sub' && a < b) {
        numA = b; numB = a;
    }

    currentAnswer = mode === 'add' ? numA + numB : numA - numB;

    const questionEl = document.getElementById('question');
    questionEl.textContent = `${numA} ${mode === 'add' ? '+' : '−'} ${numB} = ?`;
    questionEl.style.animation = 'none';
    void questionEl.offsetHeight;
    questionEl.style.animation = '';

    buildAnswerButtons();
}

// ── Answer Buttons ─────────────────────────
function buildAnswerButtons() {
    const container = document.getElementById('answers');
    container.innerHTML = '';

    const options = generateOptions(currentAnswer);

    options.forEach(val => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = val;
        btn.addEventListener('click', () => checkAnswer(val, btn));
        container.appendChild(btn);
    });
}

function generateOptions(correct) {
    const set = new Set([correct]);

    const attempts = 0;
    let tries = 0;
    while (set.size < 4 && tries < 50) {
        tries++;
        // Spread: ±1..5, avoiding duplicates
        const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        const candidate = correct + offset;
        // Keep non-negative for beginner friendliness
        if (candidate >= 0 && !set.has(candidate)) {
            set.add(candidate);
        }
    }

    let fill = 1;
    while (set.size < 4) {
        if (!set.has(correct + fill)) set.add(correct + fill);
        fill++;
    }

    return shuffle([...set]);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ── Answer Check ───────────────────────────
function checkAnswer(value, btn) {
    if (answering) return;
    answering = true;

    // Disable all buttons
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

    if (value === currentAnswer) {
        btn.classList.add('correct');
        correctCount++;
        soundCorrect();
        showFeedback('⭐');
        setTimeout(() => nextQuestion(), 900);
    } else {
        btn.classList.add('wrong');
        document.querySelectorAll('.answer-btn').forEach(b => {
            if (parseInt(b.textContent) === currentAnswer) b.classList.add('correct');
        });
        lives--;
        updateLivesDisplay();
        soundWrong();
        showFeedback('💔');
        if (lives <= 0) {
            setTimeout(() => endGame(false), 1000);
        } else {
            setTimeout(() => nextQuestion(), 1000);
        }
    }
}

// ── Feedback Overlay ───────────────────────
function showFeedback(emoji) {
    const overlay = document.getElementById('feedback-overlay');
    const emojiEl = document.getElementById('feedback-emoji');
    emojiEl.textContent = emoji;
    overlay.classList.remove('hidden');
    overlay.style.animation = 'none';
    void overlay.offsetHeight;
    overlay.style.animation = '';
    setTimeout(() => overlay.classList.add('hidden'), 500);
}

// ── End Game ───────────────────────────────
function endGame(win) {
    showScreen('result');

    const card    = document.getElementById('result-card');
    const emoji   = document.getElementById('result-emoji');
    const title   = document.getElementById('result-title');
    const message = document.getElementById('result-message');
    const score   = document.getElementById('result-score');
    const hsBanner = document.getElementById('new-high-score-banner');

    card.className = 'result-card ' + (win ? 'win' : 'lose');

    if (win) {
        emoji.textContent   = '🎉';
        title.textContent   = 'You Win!';
        message.textContent = 'Amazing! You answered all 5 questions!';
        soundWin();
    } else {
        emoji.textContent   = '😢';
        title.textContent   = 'Game Over';
        message.textContent = `You got ${correctCount} right. Keep going — you can do it!`;
        soundLose();
    }

    score.textContent = `Score: ${correctCount} / ${TOTAL_Q}  ·  ❤️ ${lives} lives left`;

    const isNewHigh = saveHighScore(correctCount);
    if (isNewHigh && correctCount > 0) {
        hsBanner.classList.remove('hidden');
    } else {
        hsBanner.classList.add('hidden');
    }
}

// ── Retry ──────────────────────────────────
function restartGame() {
    soundClick();
    beginGame();
}

// ── Stars decoration (CSS-generated by JS) ─
(function spawnStars() {
    const bg = document.getElementById('stars-bg');
    const symbols = ['✦', '✧', '·', '⬡', '◇'];
    for (let i = 0; i < 22; i++) {
        const s = document.createElement('span');
        s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = 10 + Math.random() * 16;
        const delay = Math.random() * 5;
        const dur   = 3 + Math.random() * 4;
        const opacity = 0.05 + Math.random() * 0.12;
        s.style.cssText = `
            position: absolute;
            left: ${x}%;
            top:  ${y}%;
            font-size: ${size}px;
            color: #7c4dff;
            opacity: ${opacity};
            animation: starFloat ${dur}s ${delay}s ease-in-out infinite alternate;
            pointer-events: none;
            user-select: none;
        `;
        bg.appendChild(s);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes starFloat {
            from { transform: translateY(0) rotate(0deg); }
            to   { transform: translateY(-12px) rotate(15deg); }
        }
    `;
    document.head.appendChild(style);
})();

// ── Init ───────────────────────────────────
updateHomeHighScore();
