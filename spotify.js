// Spotify sign-in (PKCE, so no server is needed) and the few Web API calls
// the app uses to remote-control the Spotify app on the phone.
window.SpotifyRemote = (() => {
  "use strict";

  const AUTH = "https://accounts.spotify.com";
  const API = "https://api.spotify.com/v1";
  const SCOPES = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "playlist-read-private",
    "playlist-read-collaborative",
  ].join(" ");
  const KEY = "songquiz.spotify";

  const clientId = ((window.APP_CONFIG || {}).spotifyClientId || "").trim();
  const redirectUri = location.origin + location.pathname.replace(/index\.html$/, "");

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
    remove(k) { try { localStorage.removeItem(k); } catch { /* private mode */ } },
  };

  let tokens = null;
  try { tokens = JSON.parse(store.get(KEY)); } catch { tokens = null; }

  function saveTokens(t) {
    tokens = t;
    if (t) store.set(KEY, JSON.stringify(t));
    else store.remove(KEY);
  }

  const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const randomString = () => b64url(crypto.getRandomValues(new Uint8Array(48)));

  async function login() {
    const verifier = randomString();
    const state = randomString();
    const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    store.set(`${KEY}.verifier`, verifier);
    store.set(`${KEY}.state`, state);
    const q = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: challenge,
      scope: SCOPES,
      state,
    });
    location.href = `${AUTH}/authorize?${q}`;
  }

  function logout() { saveTokens(null); }

  async function tokenRequest(params) {
    const res = await fetch(`${AUTH}/api/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, ...params }),
    });
    if (!res.ok) {
      if (params.grant_type === "refresh_token") saveTokens(null); // access was revoked
      throw new Error(`Spotify sign-in failed (${res.status})`);
    }
    const d = await res.json();
    saveTokens({
      access: d.access_token,
      refresh: d.refresh_token || (tokens && tokens.refresh),
      expires: Date.now() + (d.expires_in - 60) * 1000,
    });
  }

  // Finish the sign-in when Spotify sends us back with ?code=…
  async function handleRedirect() {
    const q = new URLSearchParams(location.search);
    if (!q.has("code") && !q.has("error")) return;
    const verifier = store.get(`${KEY}.verifier`);
    const expected = store.get(`${KEY}.state`);
    store.remove(`${KEY}.verifier`);
    store.remove(`${KEY}.state`);
    history.replaceState(null, "", redirectUri);
    if (q.get("error")) throw new Error(`Spotify said: ${q.get("error")}`);
    if (!verifier || q.get("state") !== expected) throw new Error("Spotify sign-in expired, please try again.");
    await tokenRequest({
      grant_type: "authorization_code",
      code: q.get("code"),
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
  }

  async function accessToken(forceRefresh) {
    if (!tokens) return null;
    if (forceRefresh || Date.now() > tokens.expires) {
      await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh });
    }
    return tokens.access;
  }

  async function api(method, path, body, retried) {
    const token = await accessToken(false);
    if (!token) throw Object.assign(new Error("Not connected to Spotify"), { status: 401 });
    const res = await fetch(API + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && !retried) {
      await accessToken(true);
      return api(method, path, body, true);
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!res.ok) {
      const err = new Error((data && data.error && data.error.message) || `Spotify error ${res.status}`);
      err.status = res.status;
      err.reason = data && data.error && data.error.reason;
      throw err;
    }
    return data;
  }

  // Songs in a playlist, for the pick list. Returns [] if Spotify won't share them.
  async function playlistTracks(playlistId) {
    const fields = "items(track(id,uri,name,artists(name),album(images))),next";
    for (const kind of ["items", "tracks"]) {
      try {
        const out = [];
        let path = `/playlists/${playlistId}/${kind}?limit=100&fields=${encodeURIComponent(fields)}`;
        while (path && out.length < 300) {
          const page = await api("GET", path);
          (page.items || []).forEach((it) => {
            const t = it.track || it.item;
            if (t && t.id && t.uri && t.uri.startsWith("spotify:track:")) out.push(t);
          });
          path = page.next ? page.next.replace(API, "") : null;
        }
        return out;
      } catch (e) {
        if (e.status === 401) throw e;
      }
    }
    return [];
  }

  // Start playback; if no device is active, wake up the phone's Spotify app.
  async function play(body) {
    try {
      await api("PUT", "/me/player/play", body);
    } catch (e) {
      if (e.status !== 404 && e.reason !== "NO_ACTIVE_DEVICE") throw e;
      const { devices = [] } = (await api("GET", "/me/player/devices")) || {};
      const device = devices.find((d) => d.is_active)
        || devices.find((d) => d.type === "Smartphone")
        || devices[0];
      if (!device) throw Object.assign(new Error("No Spotify device"), { reason: "NO_DEVICE" });
      await api("PUT", `/me/player/play?device_id=${encodeURIComponent(device.id)}`, body);
    }
  }

  return {
    configured: Boolean(clientId),
    connected: () => Boolean(tokens),
    redirectUri,
    login,
    logout,
    handleRedirect,
    playlistTracks,
    play,
    resume: () => play(undefined),
    pause: () => api("PUT", "/me/player/pause"),
    nowPlaying: () => api("GET", "/me/player"),
  };
})();
