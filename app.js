(() => {
  "use strict";

  const config = window.APP_CONFIG || {};

  // Simple words a 6-year-old can read, each with a matching picture.
  const WORDS = [
    ["DOG", "🐶"], ["CAT", "🐱"], ["DUCK", "🦆"], ["COW", "🐮"], ["PIG", "🐷"],
    ["FISH", "🐟"], ["FROG", "🐸"], ["BEE", "🐝"], ["FOX", "🦊"], ["OWL", "🦉"],
    ["HEN", "🐔"], ["BUG", "🐞"], ["SUN", "☀️"], ["MOON", "🌙"], ["STAR", "⭐"],
    ["TREE", "🌳"], ["CAR", "🚗"], ["BUS", "🚌"], ["HAT", "🎩"], ["CAKE", "🎂"],
    ["BALL", "⚽"], ["EGG", "🥚"], ["BED", "🛏️"], ["CUP", "🥤"], ["KEY", "🔑"],
  ];
  const ANIMATIONS = ["bob", "wiggle", "hop", "sway"];
  const PRAISE = ["Yes! 🎉", "Super! 🌟", "Well done! 💪", "Great job! 🥳"];
  const TRY_AGAIN = ["Oops, try again! 🙂", "Almost! Try again 💛", "Not that one, try again!"];
  const MATH_THING = ["🍎", "🍓", "🐞", "🌸", "🍪", "🐟"];

  const $ = (sel) => document.querySelector(sel);
  const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => { s.hidden = s.id !== id; });
  }

  function setStars(count) {
    $("#star-math").classList.toggle("on", count >= 1);
    $("#star-word").classList.toggle("on", count >= 2);
  }

  // ---- Sounds (generated, no files needed) ----
  let audio;
  function tone(freq, start, duration, type = "sine", volume = 0.2) {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t = audio.currentTime + start;
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + duration);
  }
  const sounds = {
    right() { [523, 659, 784].forEach((f, i) => tone(f, i * 0.1, 0.3)); },
    wrong() { tone(220, 0, 0.25, "triangle", 0.15); tone(196, 0.15, 0.3, "triangle", 0.15); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.35)); },
  };

  function burst(emojis = ["⭐", "🌟", "✨", "🎈", "💖"]) {
    const box = $("#burst");
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 24; i++) {
      const s = document.createElement("span");
      s.textContent = pick(emojis);
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 220;
      s.style.left = `${cx - 18}px`;
      s.style.top = `${cy - 18}px`;
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      s.style.setProperty("--rot", `${rand(-180, 180)}deg`);
      box.appendChild(s);
      setTimeout(() => s.remove(), 1300);
    }
  }

  // Wire up a set of answer buttons: wrong ones shake, the right one moves on.
  function ask({ container, hint, options, isRight, render, onDone }) {
    const box = $(container);
    const hintEl = $(hint);
    box.innerHTML = "";
    hintEl.innerHTML = "&nbsp;";
    let finished = false;
    options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      render(btn, option);
      btn.addEventListener("click", () => {
        if (finished) return;
        if (isRight(option)) {
          finished = true;
          btn.classList.add("right");
          hintEl.textContent = pick(PRAISE);
          sounds.right();
          burst();
          setTimeout(onDone, 1300);
        } else {
          btn.classList.add("wrong");
          hintEl.textContent = pick(TRY_AGAIN);
          sounds.wrong();
        }
      });
      box.appendChild(btn);
    });
  }

  // ---- Question 1: adding or taking away, all numbers below 10 ----
  function mathQuestion() {
    const add = Math.random() < 0.5;
    let a, b;
    if (add) { a = rand(1, 8); b = rand(1, 9 - a); }
    else { a = rand(2, 9); b = rand(1, a - 1); }
    const answer = add ? a + b : a - b;

    const choices = new Set([answer]);
    while (choices.size < 3) {
      const n = answer + rand(-3, 3);
      if (n >= 0 && n <= 9) choices.add(n);
    }

    $("#sum").textContent = `${a} ${add ? "+" : "−"} ${b} = ?`;

    // Little pictures to count on, for help.
    const thing = pick(MATH_THING);
    const counters = $("#counters");
    counters.innerHTML = "";
    const addThings = (n, cls) => {
      for (let i = 0; i < n; i++) {
        const s = document.createElement("span");
        s.textContent = thing;
        if (cls) s.className = cls;
        counters.appendChild(s);
      }
    };
    if (add) {
      addThings(a);
      counters.insertAdjacentHTML("beforeend", '<span class="op">+</span>');
      addThings(b);
    } else {
      addThings(a - b);
      addThings(b, "gone");
    }

    ask({
      container: "#math-choices",
      hint: "#math-hint",
      options: shuffle([...choices]),
      isRight: (n) => n === answer,
      render: (btn, n) => { btn.textContent = n; },
      onDone: () => { setStars(1); wordQuestion(); },
    });
    show("math");
  }

  // ---- Question 2: read the word, tap the matching picture ----
  function wordQuestion() {
    const [target, ...others] = shuffle(WORDS);
    const options = shuffle([target, others[0], others[1]]);
    $("#word-text").textContent = target[0];

    ask({
      container: "#word-choices",
      hint: "#word-hint",
      options,
      isRight: (w) => w === target,
      render: (btn, w) => {
        const pic = document.createElement("span");
        pic.className = `pic ${pick(ANIMATIONS)}`;
        pic.style.animationDelay = `${Math.random() * -2}s`;
        pic.textContent = w[1];
        btn.setAttribute("aria-label", w[0]);
        btn.appendChild(pic);
      },
      onDone: () => { setStars(2); reward(); },
    });
    show("word");
  }

  // ---- Reward: two songs from her Spotify playlist ----
  function spotifyEmbed(link, kind) {
    const m = String(link).match(new RegExp(`${kind}[/:]([A-Za-z0-9]{22})`));
    if (!m) return null;
    const frame = document.createElement("iframe");
    frame.src = `https://open.spotify.com/embed/${kind}/${m[1]}?utm_source=generator`;
    frame.height = kind === "track" ? "152" : "380";
    frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    frame.loading = "lazy";
    return frame;
  }

  function reward() {
    const box = $("#songs");
    box.innerHTML = "";
    const tracks = shuffle(config.songs || [])
      .map((link) => spotifyEmbed(link, "track"))
      .filter(Boolean)
      .slice(0, 2);
    const frames = tracks.length ? tracks : [spotifyEmbed(config.playlist || "", "playlist")].filter(Boolean);

    $("#reward-lead").textContent = tracks.length ? "Pick a song to play 🎧" : "Pick 2 songs to play 🎧";
    if (frames.length) {
      frames.forEach((f) => box.appendChild(f));
    } else {
      box.innerHTML = '<div class="note">🎶 Ask a grown-up to add your songs in <b>config.js</b>!</div>';
    }
    show("reward");
    sounds.win();
    burst(["🎵", "🎶", "⭐", "🎉", "💖"]);
  }

  function start() {
    setStars(0);
    mathQuestion();
  }

  $("#hello").textContent = config.name ? `Hi ${config.name}!` : "Hi!";
  $("#start-btn").addEventListener("click", start);
  $("#again-btn").addEventListener("click", () => {
    $("#songs").innerHTML = ""; // stop the music
    start();
  });
})();
