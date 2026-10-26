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
    if (remote && remote.configured) {
      startRound();
      return;
    }
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

  // ---- Reward with full songs: the page remote-controls her Spotify app ----
  // A finished quiz opens a "round" of SONGS songs (and optionally MINUTES).
  // The page checks what Spotify is playing every few seconds, pauses it when
  // the round is used up, and pauses any music that plays outside a round.
  const remote = window.SpotifyRemote;
  const ROUND_KEY = "songquiz.round";
  const SONGS = config.songsPerQuiz || 2;
  const MINUTES = config.minutesPerQuiz || 0;
  const POLL_MS = 4000;
  const playlistId = (String(config.playlist || "").match(/playlist[/:]([A-Za-z0-9]{22})/) || [])[1];

  let round = loadRound(); // { played: [track ids], deadline: ms or null } while music is allowed
  let trackList = null;
  let lastState = null;
  let pollTimer = null;
  let endTimer = null;
  let polling = false;
  let wakeLock = null;

  function loadRound() {
    try { return JSON.parse(localStorage.getItem(ROUND_KEY)); } catch { return null; }
  }
  function saveRound() {
    try {
      if (round) localStorage.setItem(ROUND_KEY, JSON.stringify(round));
      else localStorage.removeItem(ROUND_KEY);
    } catch { /* private mode: the round just won't survive a reload */ }
  }

  // Keep the screen on while music plays, so the page can stop it in time.
  async function keepAwake() {
    try { if (navigator.wakeLock && !wakeLock) wakeLock = await navigator.wakeLock.request("screen"); } catch { /* not supported */ }
    if (wakeLock) wakeLock.addEventListener("release", () => { wakeLock = null; }, { once: true });
  }
  function letSleep() {
    if (wakeLock) wakeLock.release().catch(() => {});
    wakeLock = null;
  }

  function note(html) {
    $("#songs").innerHTML = `<div class="note">${html}</div>`;
  }

  function startRound() {
    round = { played: [], deadline: MINUTES ? Date.now() + MINUTES * 60000 : null };
    saveRound();
    showRound();
    sounds.win();
    burst(["🎵", "🎶", "⭐", "🎉", "💖"]);
  }

  async function showRound() {
    show("reward");
    setStars(2);
    $("#again-btn").hidden = true;
    $("#reward-lead").textContent = `Pick a song to play 🎧`;
    keepAwake();
    renderCount();
    if (!remote.connected()) {
      note('A grown-up needs to connect Spotify first.<br><button class="small-btn" id="connect-now">Connect Spotify</button>');
      $("#connect-now").addEventListener("click", () => remote.login());
      return;
    }
    if (!trackList) {
      note("Loading your songs… 🎶");
      trackList = playlistId ? await remote.playlistTracks(playlistId).catch(() => []) : [];
    }
    renderTracks();
    poll();
  }

  function renderTracks() {
    const box = $("#songs");
    box.innerHTML = "";
    if (!playlistId) {
      note("🎶 Ask a grown-up to add your playlist in <b>config.js</b>!");
      return;
    }
    const context = `spotify:playlist:${playlistId}`;
    if (!trackList.length) {
      const btn = document.createElement("button");
      btn.className = "big-btn";
      btn.textContent = "Play my songs ▶";
      btn.id = "play-all";
      btn.addEventListener("click", () => playSong({ context_uri: context }));
      box.appendChild(btn);
      markPlaying();
      return;
    }
    const list = document.createElement("div");
    list.className = "songs track-list";
    list.id = "track-list";
    trackList.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "track";
      btn.dataset.id = t.id;
      const img = (t.album && t.album.images || []).slice(-1)[0];
      btn.innerHTML = '<img alt=""><span></span>';
      if (img) btn.querySelector("img").src = img.url;
      btn.querySelector("span").textContent = t.name;
      btn.addEventListener("click", () => playSong({ context_uri: context, offset: { uri: t.uri } }));
      list.appendChild(btn);
    });
    box.appendChild(list);
    markPlaying();
  }

  function markPlaying() {
    const playAll = $("#play-all");
    if (playAll) playAll.hidden = !round || round.played.length >= SONGS;
    const list = $("#track-list");
    if (!list || !round) return;
    const current = lastState && lastState.item && lastState.item.id;
    list.querySelectorAll(".track").forEach((b) => b.classList.toggle("playing", b.dataset.id === current));
    // Last song is playing: hide the others so she can't start a third.
    list.classList.toggle("locked", round.played.length >= SONGS);
  }

  function renderCount() {
    const el = $("#song-count");
    if (!round) { el.hidden = true; return; }
    const n = round.played.length;
    let text = n ? `🎵 Song ${n} of ${SONGS}` : `You can play ${SONGS} songs!`;
    if (round.deadline) {
      const min = Math.max(0, Math.ceil((round.deadline - Date.now()) / 60000));
      text += ` · ⏱ ${min} min`;
    }
    el.textContent = text;
    el.hidden = false;
    $("#reward-lead").textContent = n >= SONGS ? "Last song! Enjoy 🎧" : "Pick a song to play 🎧";
  }

  function renderNow(state) {
    const now = $("#now");
    const item = state && state.item;
    if (!item) { now.hidden = true; return; }
    const img = (item.album && item.album.images || [])[0];
    $("#now-art").src = img ? img.url : "";
    $("#now-art").style.visibility = img ? "" : "hidden";
    $("#now-title").textContent = item.name;
    $("#now-artist").textContent = (item.artists || []).map((a) => a.name).join(", ");
    $("#now-toggle").textContent = state.is_playing ? "⏸" : "▶";
    now.hidden = false;
  }

  async function playSong(body) {
    if (!round || round.played.length >= SONGS) return;
    try {
      await remote.play(body);
      setTimeout(poll, 800);
    } catch (e) {
      if (e.reason === "NO_DEVICE") {
        note('Spotify is asleep 😴<br>Tap the button, wait until Spotify is open, then come back here.<br><a class="small-btn" href="spotify:">Open Spotify</a>');
        waitForDevice(body);
      } else {
        note(`Oops, the music didn't start (${e.message}). Try again!`);
        setTimeout(renderTracks, 4000);
      }
    }
  }

  // Keep looking for the phone's Spotify app, and start the song once it shows up.
  let deviceWait = null;
  function waitForDevice(body) {
    clearTimeout(deviceWait);
    const started = Date.now();
    const tryAgain = async () => {
      if (!round) return;
      if (!document.hidden) {
        const list = await remote.devices().catch(() => []);
        if (list.length) { renderTracks(); playSong(body); return; }
      }
      if (Date.now() - started < 120000) deviceWait = setTimeout(tryAgain, 2000);
      else renderTracks();
    };
    deviceWait = setTimeout(tryAgain, 2000);
  }

  async function poll() {
    clearTimeout(pollTimer);
    if (polling || !remote.connected() || document.hidden) return;
    polling = true;
    try {
      lastState = await remote.nowPlaying();
      check(lastState);
    } catch { /* network hiccup: try again next time */ }
    polling = false;
    pollTimer = setTimeout(poll, POLL_MS);
  }

  function check(state) {
    const playing = Boolean(state && state.is_playing && state.item);
    if (!round) {
      if (playing) remote.pause().catch(() => {}); // no music without the quiz
      return;
    }
    if (round.deadline && Date.now() >= round.deadline) { endRound(); return; }
    renderNow(state);
    if (playing && state.item.id && !round.played.includes(state.item.id)) {
      if (round.played.length >= SONGS) { endRound(); return; }
      round.played.push(state.item.id);
      saveRound();
    }
    // The last song has finished (or Spotify stopped) while nothing new started.
    const item = state && state.item;
    const lastId = round.played[round.played.length - 1];
    if (round.played.length >= SONGS && !playing && (!item || item.id !== lastId
        || state.progress_ms < 1000 || item.duration_ms - state.progress_ms < 5000)) {
      endRound();
      return;
    }
    renderCount();
    markPlaying();

    // Stop right at the end of the last song (or when time runs out).
    clearTimeout(endTimer);
    let msLeft = Infinity;
    if (playing && round.played.length >= SONGS) msLeft = state.item.duration_ms - state.progress_ms;
    if (round.deadline) msLeft = Math.min(msLeft, round.deadline - Date.now());
    if (msLeft < POLL_MS + 2000) endTimer = setTimeout(endRound, Math.max(0, msLeft - 700));
  }

  function endRound() {
    if (!round) return;
    clearTimeout(endTimer);
    round = null;
    saveRound();
    letSleep();
    remote.pause().catch(() => {});
    $("#now").hidden = true;
    $("#song-count").hidden = true;
    setStars(0);
    show("timesup");
    sounds.right();
  }

  $("#now-toggle").addEventListener("click", () => {
    const playing = lastState && lastState.is_playing;
    $("#now-toggle").textContent = playing ? "▶" : "⏸";
    (playing ? remote.pause() : remote.resume()).catch(() => {}).finally(() => setTimeout(poll, 800));
  });

  function renderGrownup() {
    const el = $("#grownup");
    if (!remote || !remote.configured) return;
    el.innerHTML = remote.connected()
      ? 'Spotify connected ✓ <button class="link-btn" id="check">Check Spotify</button> <button class="link-btn" id="disconnect">Disconnect</button>'
      : '<button class="link-btn" id="connect">Grown-ups: connect Spotify</button>';
    const check = $("#check");
    if (check) check.addEventListener("click", async () => {
      const out = document.createElement("pre");
      out.className = "diagnose";
      out.textContent = "Checking…";
      el.appendChild(out);
      check.disabled = true;
      out.textContent = (await remote.diagnose(playlistId)).join("\n");
      check.disabled = false;
    });
    const connect = $("#connect");
    if (connect) connect.addEventListener("click", () => remote.login());
    const disconnect = $("#disconnect");
    if (disconnect) disconnect.addEventListener("click", () => { remote.logout(); renderGrownup(); });
  }

  async function initRemote() {
    if (!remote || !remote.configured) return;
    try {
      await remote.handleRedirect();
    } catch (e) {
      $("#grownup").textContent = e.message;
      setTimeout(renderGrownup, 5000);
    }
    renderGrownup();
    if (round) showRound();
    else poll();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      if (round) keepAwake();
      poll();
    });
  }

  function start() {
    setStars(0);
    mathQuestion();
  }

  $("#hello").textContent = config.name ? `Hi ${config.name}!` : "Hi!";
  $("#start-btn").addEventListener("click", start);
  $("#timesup-btn").addEventListener("click", start);
  $("#again-btn").addEventListener("click", () => {
    $("#songs").innerHTML = ""; // stop the music
    start();
  });
  initRemote();
})();
