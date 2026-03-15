// ============ GLOBALS ============
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('dots');
let userGuessSlide2 = 500000;
let userBudget = 500000;

// ============ DOT INDICATORS ============
slides.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  d.addEventListener('click', () => scrollToSlide(i));
  dotsContainer.appendChild(d);
});

function updateDots(idx) {
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

// ============ SCROLL TO SLIDE ============
function scrollToSlide(i) {
  slides[i].scrollIntoView({ behavior: 'smooth' });
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ============ HELPER ============
function formatCurrency(n) {
  return '$' + n.toLocaleString('en-US');
}

function countUp(el, start, end, duration, isCurrency) {
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * eased);
    el.textContent = isCurrency ? formatCurrency(current) : current.toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function getCurrentSlide() {
  let closest = 0;
  let minDist = Infinity;
  slides.forEach((s, i) => {
    const dist = Math.abs(s.getBoundingClientRect().top);
    if (dist < minDist) { minDist = dist; closest = i; }
  });
  return closest;
}

// ============ INTERSECTION OBSERVER ============
let donutAnimated = false;
let barsAnimated = false;
let medianAnimated = false;
let mortgageAnimated = false;
let shiftAnimated = false;
let mapAutoPlayed = false;
let introStarted = false;

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = Array.from(slides).indexOf(entry.target);
      updateDots(idx);
      entry.target.querySelectorAll('.anim').forEach(el => el.classList.add('visible'));

      // Slide-specific triggers
      if (entry.target.id === 'slide-competitors') animateDonut();
      if (entry.target.id === 'slide-competition-advantage') animateAdvantageBars();
      if (entry.target.id === 'slide-reality') animateMedianPrice();
      if (entry.target.id === 'slide-mortgage') animateMortgage();

      if (entry.target.id === 'slide-map-intro' && !introStarted) {
        introStarted = true;
        setTimeout(runIntroSequence, 400);
      }

      if (entry.target.id === 'slide-map') {
        updateMap(parseInt(document.getElementById('yearSlider').value));
        if (!mapAutoPlayed) {
          mapAutoPlayed = true;
          setTimeout(togglePlay, 800);
        }
      }

      if (entry.target.id === 'slide-shift' && !shiftAnimated) {
        shiftAnimated = true;
        setTimeout(() => {
          document.querySelectorAll('.shift-bar-late').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width') + '%';
          });
        }, 400);
      }
    }
  });
}, { threshold: 0.3 });

slides.forEach(s => observer.observe(s));

// ============ PRICE SLIDER (Slide 2) ============
const priceSlider = document.getElementById('priceSlider');
const priceDisplay = document.getElementById('priceDisplay');

priceSlider.addEventListener('input', () => {
  const val = parseInt(priceSlider.value);
  userGuessSlide2 = val;
  priceDisplay.textContent = formatCurrency(val);
});

// ============ REVEAL PRICE (Slide 2) ============
function revealPrice() {
  const btn = document.getElementById('revealBtn');
  const sliderArea = document.getElementById('sliderArea');
  const revealArea = document.getElementById('revealArea');

  btn.style.display = 'none';
  sliderArea.style.display = 'none';
  priceDisplay.style.display = 'none';
  document.querySelector('#slide-guess .subheadline').style.display = 'none';

  revealArea.classList.add('show');
  revealArea.querySelectorAll('.anim').forEach(el => el.classList.add('visible'));

  document.getElementById('userGuessStrike').textContent = 'Your guess: ' + formatCurrency(userGuessSlide2);
  countUp(document.getElementById('actualPriceEl'), 0, ACTUAL_PRICE, 1500, true);
}

// ============ DONUT CHART (Slide 3) ============
const donutOrder = [
  { key: 'individual', id: 'seg-individual' },
  { key: 'llc', id: 'seg-llc' },
  { key: 'trust', id: 'seg-trust' },
  { key: 'investor', id: 'seg-investor' }
];

function drawDonut(data) {
  const C = 2 * Math.PI * 82;
  let offset = 0;

  donutOrder.forEach(seg => {
    const el = document.getElementById(seg.id);
    const pct = data[seg.key];
    const len = (pct / 100) * C;
    const gap = C - len;
    el.style.strokeDasharray = `${len} ${gap}`;
    el.style.strokeDashoffset = -offset;
    offset += len;
  });
}

function updateCompetitionCards(name) {
  const data = neighborhoodMix[name];
  if (!data) return;

  document.getElementById('legend-individual').textContent = `Individuals ${data.individual}%`;
  document.getElementById('legend-llc').textContent = `LLC/Corp ${data.llc}%`;
  document.getElementById('legend-trust').textContent = `Trusts ${data.trust}%`;
  document.getElementById('legend-investor').textContent = `Investors ${data.investor}%`;

  document.getElementById('individualCard').textContent = `${data.individual}%`;
  document.getElementById('llcCard').textContent = `${data.llc}%`;
  document.getElementById('trustCard').textContent = `${data.trust}%`;
  document.getElementById('investorCard').textContent = `${data.investor}%`;

  document.getElementById('competitionCallout').innerHTML = data.callout;

  if (donutAnimated) drawDonut(data);
}

function animateDonut() {
  if (donutAnimated) return;
  donutAnimated = true;
  drawDonut(neighborhoodMix['Dorchester']);
}

document.querySelectorAll('.neighborhood-pills .pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.neighborhood-pills .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    updateCompetitionCards(pill.dataset.hood);
  });
});

// ============ ADVANTAGE BARS (Slide 4) ============
function animateAdvantageBars() {
  if (barsAnimated) return;
  barsAnimated = true;
  document.querySelectorAll('.advantage-bar').forEach(bar => {
    requestAnimationFrame(() => {
      bar.style.width = bar.dataset.width;
    });
  });
}

// ============ SELECTOR PILLS (Slide 8) ============
document.querySelectorAll('.selector-row').forEach(row => {
  row.querySelectorAll('.selector-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      row.querySelectorAll('.selector-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
});

// ============ TOGGLE PILLS (Slide 10) ============
document.querySelectorAll('.toggle-row .toggle-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.toggle-row .toggle-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// ============ CURRENCY INPUT (Slide 8) ============
const budgetInput = document.getElementById('budgetInput');
budgetInput.addEventListener('input', () => {
  let raw = budgetInput.value.replace(/[^0-9]/g, '');
  if (raw === '') { budgetInput.value = ''; userBudget = 0; return; }
  userBudget = parseInt(raw);
  budgetInput.value = formatCurrency(userBudget);
});

budgetInput.addEventListener('focus', () => {
  let raw = budgetInput.value.replace(/[^0-9]/g, '');
  budgetInput.value = raw;
});

budgetInput.addEventListener('blur', () => {
  let raw = budgetInput.value.replace(/[^0-9]/g, '');
  if (raw === '') return;
  userBudget = parseInt(raw);
  budgetInput.value = formatCurrency(userBudget);
});

// ============ SHOW REALITY (Slide 8 → 9) ============
function showReality() {
  document.getElementById('guessComparison').textContent = 'You guessed ' + formatCurrency(userBudget);
  const diff = Math.abs(MEDIAN_PRICE - userBudget);
  document.getElementById('guessDiff').textContent = 'You were ' + formatCurrency(diff) + ' off';

  document.getElementById('shareGuess').innerHTML =
    formatCurrency(userBudget) + ' &rarr; <span class="neon">' + formatCurrency(ACTUAL_PRICE) + '</span>';

  scrollToId('slide-reality');
}

// ============ ANIMATE MEDIAN PRICE (Slide 9) ============
function animateMedianPrice() {
  if (medianAnimated) return;
  medianAnimated = true;
  countUp(document.getElementById('medianPrice'), 0, MEDIAN_PRICE, 1500, true);
}

// ============ ANIMATE MORTGAGE (Slide 10) ============
function animateMortgage() {
  if (mortgageAnimated) return;
  mortgageAnimated = true;

  countUp(document.getElementById('yearsNumber'), 0, 27, 1500, false);
  countUp(document.getElementById('monthlyPayment'), 0, 3847, 1500, true);

  setTimeout(() => {
    document.getElementById('timelineFill').style.width = '56%';
  }, 300);
}

// ============ WRAPPED INTRO SEQUENCE (Slide 5) ============
const phases = [
  document.getElementById('introPhase1'),
  document.getElementById('introPhase2'),
  document.getElementById('introPhase3'),
  document.getElementById('introPhase4')
];
let currentPhase = -1;
let introComplete = false;
const PHASE_DURATION = 2200;

function showPhase(idx) {
  phases.forEach((p, i) => {
    if (i < idx) {
      p.classList.remove('active');
      p.classList.add('exit');
    } else if (i === idx) {
      p.classList.remove('exit');
      p.classList.add('active');
    } else {
      p.classList.remove('active', 'exit');
    }
  });
}

function runIntroSequence() {
  currentPhase = 0;
  showPhase(0);

  setTimeout(() => {
    currentPhase = 1;
    showPhase(1);
    const el = document.getElementById('statEarly');
    let val = 0;
    const timer = setInterval(() => {
      val++;
      el.textContent = val + '%';
      if (val >= 5) clearInterval(timer);
    }, 80);
  }, PHASE_DURATION);

  setTimeout(() => {
    currentPhase = 2;
    showPhase(2);
    const el = document.getElementById('statNow');
    let val = 0;
    const timer = setInterval(() => {
      val += 2;
      if (val > 38) val = 38;
      el.textContent = val + '%';
      if (val >= 38) clearInterval(timer);
    }, 40);
  }, PHASE_DURATION * 2);

  setTimeout(() => {
    currentPhase = 3;
    showPhase(3);
    introComplete = true;
  }, PHASE_DURATION * 3);
}

// Allow clicking to skip intro
document.getElementById('slide-map-intro').addEventListener('click', (e) => {
  if (e.target.closest('.btn')) return;
  if (introComplete) return;
  if (currentPhase < 3) {
    currentPhase = 3;
    showPhase(3);
    introComplete = true;
  }
});

// ============ SHARE (Slide 11) ============
function shareCard() {
  if (navigator.share) {
    navigator.share({
      title: 'Boston Housing Wrapped 2024',
      text: 'I just took the Boston Housing Wrapped quiz. Can you outbid the investors?',
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const btn = document.querySelector('#slide-share .btn');
      btn.textContent = 'Link Copied!';
      setTimeout(() => btn.textContent = 'Share', 2000);
    }).catch(() => {});
  }
}

// ============ TOUCH NAVIGATION ============
let touchStartY = 0;
document.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
  const diff = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(diff) < 50) return;
  const current = getCurrentSlide();
  if (diff > 0 && current < slides.length - 1) scrollToSlide(current + 1);
  else if (diff < 0 && current > 0) scrollToSlide(current - 1);
}, { passive: true });

// ============ INIT ============
window.addEventListener('load', () => {
  // Trigger first slide animations
  slides[0].querySelectorAll('.anim').forEach(el => el.classList.add('visible'));
  updateCompetitionCards('Dorchester');

  // Map init
  buildMap();
  buildShiftGrid();
  updateMap(2004);
  initYearSlider();
  initParticles();
});
