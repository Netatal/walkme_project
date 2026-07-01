// Scroll-reveal: fade/slide elements in as they enter the viewport
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// Hero chart: draw the white line in on scroll, with a bounce when it lands on its peak
const heroChart = document.querySelector(".hero-chart-svg");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (heroChart && !reduceMotion) {
  const line = heroChart.querySelector(".chart-line");
  const glow = heroChart.querySelector(".chart-line-glow");
  const startDot = heroChart.querySelector(".chart-start-dot");
  const peakGlow = heroChart.querySelector(".chart-peak-glow");
  const DRAW_MS = 1500;
  const BOUNCE_MS = 550;
  const BOUNCE_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  const length = line.getTotalLength();
  [line, glow].forEach((p) => {
    p.style.strokeDasharray = `${length}`;
    p.style.strokeDashoffset = `${length}`;
  });

  const resetChart = () => {
    [line, glow].forEach((p) => {
      p.style.transition = "none";
      p.style.strokeDashoffset = `${length}`;
    });
    if (startDot) {
      startDot.style.transition = "none";
      startDot.style.opacity = "0";
      startDot.style.transform = "scale(0)";
    }
    [peakGlow].forEach((el) => {
      if (!el) return;
      el.style.transition = "none";
      el.style.opacity = "0";
      el.style.transform = "scale(0)";
    });
  };

  const playChartAnimation = () => {
    resetChart();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      line.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.45, 0, 0.2, 1)`;
      glow.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.45, 0, 0.2, 1)`;
      line.style.strokeDashoffset = "0";
      glow.style.strokeDashoffset = "0";

      if (startDot) {
        startDot.style.transition = `transform 0.4s ${BOUNCE_EASE}, opacity 0.25s ease-out`;
        startDot.style.opacity = "1";
        startDot.style.transform = "scale(1)";
      }
      [peakGlow].forEach((el) => {
        if (!el) return;
        el.style.transition = `transform ${BOUNCE_MS}ms ${BOUNCE_EASE} ${DRAW_MS}ms, opacity 0.3s ease-out ${DRAW_MS}ms`;
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      });
    }));
  };

  if ("IntersectionObserver" in window) {
    const chartObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playChartAnimation();
          }
        });
      },
      { threshold: 0.3 }
    );
    chartObserver.observe(heroChart);
  } else {
    playChartAnimation();
  }
}

// 40% counter: count up from 0 to 40 on scroll into view
const fortyPctPaths = document.getElementById("forty-pct-paths");
const fortyPctText  = document.getElementById("forty-pct-text");
const statArtSvg    = document.querySelector(".stat-art-svg");

if (fortyPctPaths && fortyPctText && statArtSvg && !reduceMotion) {
  const DURATION = 1400;
  const TARGET   = 40;

  const runCounter = () => {
    fortyPctPaths.style.opacity = "0";
    fortyPctText.style.opacity  = "1";

    const start = performance.now();
    const tick  = (now) => {
      const t = Math.min((now - start) / DURATION, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(eased * TARGET);
      fortyPctText.textContent = value + "%";

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        fortyPctText.textContent = "40%";
        // swap back to crisp paths
        fortyPctText.style.opacity  = "0";
        fortyPctPaths.style.opacity = "1";
      }
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter();
          }
        });
      },
      { threshold: 0.3 }
    );
    counterObserver.observe(statArtSvg);
  } else {
    runCounter();
  }
}

// Stat sphere: count the "40%" number up from 0 when it scrolls into view
const statCounter = document.querySelector(".stat-counter-text");

if (statCounter) {
  const target = parseInt(statCounter.dataset.target, 10);

  const playCounter = () => {
    if (reduceMotion) {
      statCounter.textContent = `${target}%`;
      return;
    }
    const COUNT_MS = 1400;
    const start = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / COUNT_MS, 1);
      const value = Math.round(easeOutCubic(progress) * target);
      statCounter.textContent = `${value}%`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playCounter();
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counterObserver.observe(statCounter);
  } else {
    playCounter();
  }
}

// Stat cards carousel
(function () {
  const viewport  = document.querySelector(".carousel-viewport");
  const track     = document.querySelector(".carousel-track");
  const cards     = Array.from(document.querySelectorAll(".stat-card"));
  const dots      = Array.from(document.querySelectorAll(".carousel-dot"));
  if (!viewport || !track || !cards.length) return;

  const N       = cards.length;
  const GAP     = 20;   // must match CSS gap
  const ANIM_MS = 500;
  const EASE    = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

  let active = 0; // current index, 0..N-1
  let busy   = false;

  // --- Helpers ---

  function cardSlotWidth() {
    return cards[0].offsetWidth + GAP;
  }

  function calcT(idx) {
    const center = idx * cardSlotWidth() + cards[0].offsetWidth / 2;
    return center - viewport.offsetWidth / 2;
  }

  function applyTransform(idx, animate) {
    track.style.transition = animate ? `transform ${ANIM_MS}ms ${EASE}` : "none";
    if (!animate) void track.offsetWidth;
    track.style.transform = `translateX(${-calcT(idx)}px)`;
  }

  function styleCards(idx) {
    cards.forEach((c, i) => {
      const d = Math.abs(i - idx);
      c.classList.toggle("is-active",   d === 0);
      c.classList.toggle("is-adjacent", d === 1);
      c.classList.toggle("is-far",      d > 1);
    });
  }

  function styleDots(idx) {
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
  }

  // --- Navigation ---

  function step(dir) {
    if (busy) return;
    const next = active + dir;
    if (next < 0 || next >= N) return; // clamp at boundaries

    active = next;
    busy   = true;
    styleCards(active);
    styleDots(active);
    applyTransform(active, true);
    setTimeout(() => { busy = false; }, ANIM_MS + 30);
  }

  function jumpTo(idx) {
    if (busy || idx === active) return;
    active = idx;
    busy   = true;
    styleCards(active);
    styleDots(active);
    applyTransform(active, true);
    setTimeout(() => { busy = false; }, ANIM_MS + 30);
  }

  // --- Events ---

  dots.forEach((dot, i) => dot.addEventListener("click", () => { jumpTo(i); resetTicker(); }));

  // Click left of active → prev; click right of active → next
  cards.forEach((card, i) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      if (i < active) step(-1); else step(+1);
      resetTicker();
    });
  });

  // Keyboard
  viewport.setAttribute("tabindex", "0");
  viewport.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(+1); resetTicker(); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); step(-1); resetTicker(); }
  });

  // Auto-advance — stops at the last card
  let ticker = setInterval(() => { if (active < N - 1) step(+1); }, 4500);
  function resetTicker() {
    clearInterval(ticker);
    ticker = setInterval(() => { if (active < N - 1) step(+1); }, 4500);
  }

  // Recenter on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => applyTransform(active, false), 120);
  });

  // Init
  styleCards(active);
  styleDots(active);
  applyTransform(active, false);
})();

// Sticky header: compact + shadow after scrolling past threshold
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const THRESHOLD = 40;
  const update = () => header.classList.toggle('scrolled', window.scrollY > THRESHOLD);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// Buttons: lightweight magnetic hover + ripple-on-click feedback
document.querySelectorAll("[data-interactive].btn").forEach((btn) => {
  btn.addEventListener("pointermove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.06}px, ${y * 0.18 - 3}px) scale(1.03)`;
  });
  btn.addEventListener("pointerleave", () => {
    btn.style.transform = "";
  });
});
