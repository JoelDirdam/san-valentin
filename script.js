/**
 * San Valentín - Mini juego de misión
 * Flujo: Intro → Misión → Reto 1 (Reacción) → Reto 2 (Memoria, 4 niveles) → Victoria → Pregunta final (Sí/No) → Agradecimiento → Carta
 */

(function () {
  'use strict';

  // ========== CONFIGURACIÓN (editable) ==========
  var CONFIG = {
    // Reto 1: Reacción — los corazones siguen apareciendo hasta que atrapes 3
    reaction: {
      heartsToCatch: 3,
      heartLifetimeMs: 2200,
      spawnIntervalMs: 500,
      heartSymbols: ['❤️', '💕', '💖', '💗', '💘'],
    },
    // Reto 2: Memoria — 4 niveles [grid columns, número de corazones]
    memory: {
      showTimeMs: 1000,
      levels: [
        { cols: 3, hearts: 1 },
        { cols: 3, hearts: 2 },
        { cols: 4, hearts: 4 },
        { cols: 5, hearts: 5 },
      ],
    },
    messages: {
      reactionSuccess: '¡Bien!',
      reactionComplete: '¡Reto completado!',
      memoryCorrect: '¡Correcto!',
      memoryWrong: 'Casi. Era la otra casilla.',
      memoryWrongMultiple: 'Casi. Aquí estaban los corazones.',
    },
    // Frases del botón "No" (en orden; si hay más clics, se repite la última)
    noButtonPhrases: [
      'No',
      'Eeeh ¿Cómo que no?',
      '¿Estás segura?',
      '¿Segura segura?',
      'Piénsalo bien...',
      'Andaleee vuelve a pensarlo',
      '¿En serio no?',
      '¡Pero si somos perfectos juntos!',
      'Última oportunidad...',
      'Porfa di que siii',
      'Elige la opcion si 😐',
      'Andale chiquita bonita ¿Si? 💖',
    ],
    confettiColors: ['#c97b84', '#e8b4bc', '#f0d4da', '#b85c66', '#f8e8ec'],
    confettiCount: 60,
    heartsCount: 12,
  };

  // ========== ESTADO ==========
  var state = {
    completedChallenges: 0,
    reactionTimeouts: [],
    reactionIntervalId: null,
    memoryLevel: 0,
    memoryRevealed: false,
    noClickCount: 0,
  };

  // ========== REFERENCIAS DOM ==========
  var screens = {
    intro: document.getElementById('screen-intro'),
    mission: document.getElementById('screen-mission'),
    challenge1: document.getElementById('screen-challenge-1'),
    challenge2: document.getElementById('screen-challenge-2'),
    victory: document.getElementById('screen-victory'),
    final: document.getElementById('screen-final'),
    thanks: document.getElementById('screen-thanks'),
    letter: document.getElementById('screen-letter'),
  };

  var progressFill = document.getElementById('progress-fill');
  var progressLabel = document.getElementById('progress-label');
  var progressFill1 = document.getElementById('progress-fill-1');
  var progressLabel1 = document.getElementById('progress-label-1');
  var progressFill2 = document.getElementById('progress-fill-2');
  var progressLabel2 = document.getElementById('progress-label-2');
  var challenge1Area = document.getElementById('challenge-1-area');
  var challenge2Grid = document.getElementById('challenge-2-grid');
  var confettiContainer = document.getElementById('confetti-container');
  var heartsContainer = document.getElementById('hearts-container');

  // ========== NAVEGACIÓN ==========
  function showScreen(screenId) {
    var id = typeof screenId === 'string' ? screenId : screenId.id;
    Object.keys(screens).forEach(function (key) {
      if (screens[key]) {
        screens[key].classList.toggle('screen--active', screens[key].id === id);
      }
    });
  }

  function setProgress(completed, total) {
    var pct = total > 0 ? (completed / total) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = completed + ' / ' + total;
    if (progressFill1) progressFill1.style.width = pct + '%';
    if (progressLabel1) progressLabel1.textContent = completed + ' / ' + total;
  }

  function setProgress2(levelIndex, totalLevels) {
    var pct = totalLevels > 0 ? ((levelIndex + 1) / totalLevels) * 100 : 0;
    if (progressFill2) progressFill2.style.width = pct + '%';
    if (progressLabel2) progressLabel2.textContent = 'Nivel ' + (levelIndex + 1) + ' / ' + totalLevels;
  }

  function showFeedback(elementId, text, isSuccess) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('feedback--success', 'feedback--error');
    if (text) el.classList.add(isSuccess ? 'feedback--success' : 'feedback--error');
  }

  function showNextButton(buttonId) {
    var btn = document.getElementById(buttonId);
    if (btn) {
      btn.classList.remove('btn--hidden');
      btn.classList.add('btn--visible');
    }
  }

  // ========== INTRO ==========
  function initIntro() {
    var btn = document.getElementById('btn-start-mission');
    if (btn) {
      btn.addEventListener('click', function () {
        state.completedChallenges = 0;
        setProgress(0, 2);
        showScreen('screen-mission');
        initMission();
      });
    }
  }

  // ========== MISIÓN ==========
  function initMission() {
    var btn = document.getElementById('btn-begin-challenges');
    if (btn) {
      btn.addEventListener('click', function () {
        runChallenge1();
      });
    }
  }

  // ========== RETO 1: REACCIÓN (corazones infinitos hasta completar) ==========
  function runChallenge1() {
    showScreen('screen-challenge-1');
    state.reactionTimeouts = [];
    if (state.reactionIntervalId) {
      clearInterval(state.reactionIntervalId);
      state.reactionIntervalId = null;
    }

    setProgress(0, 3);
    if (progressLabel1) progressLabel1.textContent = '0 / ' + CONFIG.reaction.heartsToCatch;
    showFeedback('feedback-1', '');
    var btnNext = document.getElementById('btn-next-1');
    if (btnNext) {
      btnNext.classList.add('btn--hidden');
      btnNext.classList.remove('btn--visible');
      btnNext.dataset.listenerAdded = '';
    }

    challenge1Area.innerHTML = '';
    var caught = 0;
    var toCatch = CONFIG.reaction.heartsToCatch;
    var symbols = CONFIG.reaction.heartSymbols;
    var lifetime = CONFIG.reaction.heartLifetimeMs;
    var interval = CONFIG.reaction.spawnIntervalMs;

    function spawnOne() {
      if (caught >= toCatch) return;
      var heart = document.createElement('button');
      heart.type = 'button';
      heart.className = 'challenge-1-heart';
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      heart.setAttribute('aria-label', 'Corazón');
      var padding = 40;
      heart.style.left = (padding + Math.random() * (100 - 2 * padding)) + '%';
      heart.style.top = (padding + Math.random() * (100 - 2 * padding)) + '%';

      function removeHeart(asMissed) {
        heart.classList.add(asMissed ? 'challenge-1-heart--missed' : 'challenge-1-heart--clicked');
        setTimeout(function () { heart.remove(); }, 250);
      }

      var timeoutId = setTimeout(function () {
        removeHeart(true);
        showFeedback('feedback-1', 'Se escapó. Sigue intentando.');
      }, lifetime);

      state.reactionTimeouts.push(timeoutId);

      heart.addEventListener('click', function () {
        if (heart.classList.contains('challenge-1-heart--clicked') || heart.classList.contains('challenge-1-heart--missed')) return;
        clearTimeout(timeoutId);
        caught++;
        setProgress(caught, toCatch);
        if (progressLabel1) progressLabel1.textContent = caught + ' / ' + toCatch;
        removeHeart(false);
        showFeedback('feedback-1', caught >= toCatch ? CONFIG.messages.reactionComplete : CONFIG.messages.reactionSuccess, true);
        if (caught >= toCatch) {
          state.reactionTimeouts.forEach(function (id) { clearTimeout(id); });
          state.reactionTimeouts = [];
          if (state.reactionIntervalId) {
            clearInterval(state.reactionIntervalId);
            state.reactionIntervalId = null;
          }
          showNextButton('btn-next-1');
          var nextBtn = document.getElementById('btn-next-1');
          if (nextBtn && !nextBtn.dataset.listenerAdded) {
            nextBtn.dataset.listenerAdded = '1';
            nextBtn.addEventListener('click', function () {
              state.completedChallenges = 1;
              setProgress(1, 2);
              runChallenge2Level(0);
            }, { once: true });
          }
        }
      });

      challenge1Area.appendChild(heart);
    }

    // Corazones infinitos: no hay maxSpawns, solo se para al completar
    state.reactionIntervalId = setInterval(function () {
      if (caught >= toCatch) {
        clearInterval(state.reactionIntervalId);
        state.reactionIntervalId = null;
        return;
      }
      spawnOne();
    }, interval);
  }

  // Estado del nivel de memoria actual (para un solo listener)
  var memoryLevelState = {
    levelIndex: 0,
    heartCount: 0,
    correctIndexes: [],
    selectedIndexes: [],
    correctGuesses: 0,
    revealed: false,
  };

  function handleMemoryGridClick(e) {
    var cell = e.target.closest('.challenge-2-cell');
    if (!cell) return;
    var st = memoryLevelState;
    if (st.revealed || st.selectedIndexes.length >= st.heartCount) return;
    var index = parseInt(cell.getAttribute('data-index'), 10);
    if (st.selectedIndexes.indexOf(index) !== -1) return;

    st.selectedIndexes.push(index);
    var isCorrect = st.correctIndexes.indexOf(index) !== -1;
    if (isCorrect) st.correctGuesses++;

    cell.classList.add(isCorrect ? 'challenge-2-cell--revealed' : 'challenge-2-cell--wrong');
    cell.textContent = isCorrect ? '❤️' : '✗';

    if (st.correctGuesses === st.heartCount) {
      st.revealed = true;
      showFeedback('feedback-2', CONFIG.messages.memoryCorrect, true);
      showNextButton('btn-next-2');
      bindNext2(st.levelIndex);
    } else if (st.selectedIndexes.length === st.heartCount) {
      st.revealed = true;
      showFeedback('feedback-2', CONFIG.messages.memoryWrongMultiple, false);
      st.correctIndexes.forEach(function (idx) {
        var c = challenge2Grid.querySelector('[data-index="' + idx + '"]');
        if (c && !c.classList.contains('challenge-2-cell--revealed')) {
          c.classList.add('challenge-2-cell--revealed');
          c.textContent = '❤️';
        }
      });
      showNextButton('btn-next-2');
      bindNext2(st.levelIndex);
    }
  }

  function bindNext2(levelIdx) {
    var nextBtn = document.getElementById('btn-next-2');
    if (!nextBtn) return;
    nextBtn.addEventListener('click', function goNext() {
      nextBtn.removeEventListener('click', goNext);
      runChallenge2Level(levelIdx + 1);
    }, { once: true });
  }

  // ========== RETO 2: MEMORIA (4 niveles) ==========
  function runChallenge2Level(levelIndex) {
    showScreen('screen-challenge-2');
    challenge2Grid.innerHTML = '';
    challenge2Grid.removeAttribute('data-cols');
    showFeedback('feedback-2', '');

    var levels = CONFIG.memory.levels;
    if (levelIndex >= levels.length) {
      state.completedChallenges = 2;
      setProgress(2, 2);
      showScreen('screen-victory');
      initVictory();
      return;
    }

    var level = levels[levelIndex];
    var cols = level.cols;
    var heartCount = level.hearts;
    var size = cols * cols;
    challenge2Grid.setAttribute('data-cols', cols);
    setProgress2(levelIndex, levels.length);

    var correctIndexes = [];
    while (correctIndexes.length < heartCount) {
      var r = Math.floor(Math.random() * size);
      if (correctIndexes.indexOf(r) === -1) correctIndexes.push(r);
    }

    memoryLevelState.levelIndex = levelIndex;
    memoryLevelState.heartCount = heartCount;
    memoryLevelState.correctIndexes = correctIndexes.slice();
    memoryLevelState.selectedIndexes = [];
    memoryLevelState.correctGuesses = 0;
    memoryLevelState.revealed = false;

    var instructionEl = document.getElementById('challenge-2-instruction');
    if (instructionEl) {
      instructionEl.textContent = heartCount === 1
        ? 'Memoriza dónde está el corazón'
        : 'Memoriza dónde están los ' + heartCount + ' corazones';
    }

    for (var i = 0; i < size; i++) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'challenge-2-cell challenge-2-cell--show';
      cell.setAttribute('data-index', i);
      cell.setAttribute('aria-label', 'Casilla ' + (i + 1));
      if (correctIndexes.indexOf(i) !== -1) cell.textContent = '❤️';
      challenge2Grid.appendChild(cell);
    }

    setTimeout(function () {
      if (memoryLevelState.revealed) return;
      document.querySelectorAll('#challenge-2-grid .challenge-2-cell').forEach(function (c) {
        c.textContent = '';
        c.classList.remove('challenge-2-cell--show');
      });
      if (instructionEl) {
        instructionEl.textContent = heartCount === 1
          ? '¿Dónde estaba el corazón?'
          : 'Toca las ' + heartCount + ' casillas donde estaban los corazones.';
      }
    }, CONFIG.memory.showTimeMs);

    challenge2Grid.removeEventListener('click', handleMemoryGridClick);
    challenge2Grid.addEventListener('click', handleMemoryGridClick);
  }

  // ========== VICTORIA ==========
  function initVictory() {
    var btn = document.getElementById('btn-to-final');
    if (btn) {
      btn.addEventListener('click', function () {
        showScreen('screen-final');
        initFinal();
      });
    }
  }

  // ========== PREGUNTA FINAL: Sí / No ==========
  function initFinal() {
    var btnYes = document.getElementById('btn-yes-final');
    var btnNo = document.getElementById('btn-no-final');
    var phrases = CONFIG.noButtonPhrases;
    var baseScale = 1;
    var scaleStep = 0.08;

    if (btnNo) {
      btnNo.textContent = phrases[0];
      btnNo.addEventListener('click', function () {
        state.noClickCount++;
        var idx = Math.min(state.noClickCount - 1, phrases.length - 1);
        btnNo.textContent = phrases[idx];
        if (btnYes) {
          baseScale += scaleStep;
          btnYes.style.transform = 'scale(' + baseScale + ')';
        }
      });
    }

    if (btnYes) {
      btnYes.addEventListener('click', function () {
        showScreen('screen-thanks');
        runCelebration();
        initThanks();
      });
    }
  }

  // ========== AGRADECIMIENTO + ABRIR CARTA ==========
  function initThanks() {
    var btnOpen = document.getElementById('btn-open-letter');
    if (btnOpen) {
      btnOpen.addEventListener('click', function () {
        showScreen('screen-letter');
      });
    }
  }

  // ========== CELEBRACIÓN ==========
  function runCelebration() {
    createConfetti();
    createHearts();
  }

  function createConfetti() {
    if (!confettiContainer) return;
    for (var i = 0; i < CONFIG.confettiCount; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '-10px';
      piece.style.backgroundColor = CONFIG.confettiColors[i % CONFIG.confettiColors.length];
      piece.style.animation = 'confettiFall ' + (2 + Math.random() * 2) + 's ease-out forwards';
      piece.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
      piece.style.setProperty('--delay', Math.random() * 0.5 + 's');
      confettiContainer.appendChild(piece);
    }
    if (!document.getElementById('confetti-keyframes')) {
      var style = document.createElement('style');
      style.id = 'confetti-keyframes';
      style.textContent =
        '@keyframes confettiFall { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) translateX(var(--tx, 0)) rotate(720deg); opacity: 0.3; } } .confetti-piece { animation-delay: var(--delay, 0s); }';
      document.head.appendChild(style);
    }
    setTimeout(function () { confettiContainer.innerHTML = ''; }, 5000);
  }

  function createHearts() {
    if (!heartsContainer) return;
    var symbols = ['💕', '💖', '💗', '❤️', '💘'];
    for (var i = 0; i < CONFIG.heartsCount; i++) {
      var heart = document.createElement('span');
      heart.className = 'heart-float';
      heart.textContent = symbols[i % symbols.length];
      heart.style.left = Math.random() * 100 + '%';
      heart.style.animationDelay = Math.random() * 2 + 's';
      heart.style.animationDuration = 3 + Math.random() * 2 + 's';
      heartsContainer.appendChild(heart);
    }
  }

  initIntro();
})();
