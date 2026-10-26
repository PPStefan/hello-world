# Song Quiz

A small iPhone-friendly web app for a 6-year-old: answer one math question
(adding or taking away, numbers below 10) and one reading question (tap the
picture that matches the word) to unlock two songs from Spotify.

## Personalise it

Edit `config.js`:

- `name` – shown on the start screen ("Hi Emma!").
- `songs` – Spotify song links. In the Spotify app tap ••• → Share → Copy Song Link.
  Two are picked at random after each finished quiz.
- `playlist` – optional; shown instead when `songs` is empty.

- `spotifyClientId` – turns on full songs (see below).
- `songsPerQuiz` / `minutesPerQuiz` – how much music one finished quiz unlocks.

## Full songs (Spotify Premium)

Spotify's built-in web player only plays 30-second previews on iPhone. With a
Spotify Client ID the app instead remote-controls the Spotify app on the phone:
she picks a song on the website, it plays in full, and after `songsPerQuiz`
songs the music pauses and two new questions appear. Music started outside a
round is paused too, as long as the website is open.

One-time setup:

1. Go to https://developer.spotify.com/dashboard and log in with her Spotify account.
2. **Create app**. Name and description can be anything. Redirect URI:
   `https://ppstefan.github.io/hello-world/` (exactly, with the last `/`).
   Tick **Web API**, accept the terms and save.
3. Copy the **Client ID** into `spotifyClientId` in `config.js`.
4. On her iPhone, open the website, tap **Grown-ups: connect Spotify** and agree.

The Spotify app must be installed on the phone; if it has been closed for a
long time the website asks her to open it for a moment.

The iPhone puts a paused Spotify app to sleep within about a minute, and the
website can't wake it. Set `keepAwakeTrack` in `config.js` to a long silent
Spotify track (search "silence" in Spotify, pick one of 10+ minutes, check it
is really silent, then ••• → Share → Copy Song Link). It plays during the quiz
instead of pausing, for at most 10 minutes, so the next song starts right away.

## Put it on the iPhone

1. Publish the repo with GitHub Pages (Settings → Pages → deploy from branch, root folder).
2. Open the Pages link in Safari on the iPhone.
3. Tap Share → **Add to Home Screen**. It now opens full-screen like an app.

To try it on a computer, just open `index.html` in a browser.
