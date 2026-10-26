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

Spotify plays full songs when someone is logged in to Spotify in Safari on
that iPhone (open open.spotify.com once and log in). Otherwise it plays
30-second previews.

## Put it on the iPhone

1. Publish the repo with GitHub Pages (Settings → Pages → deploy from branch, root folder).
2. Open the Pages link in Safari on the iPhone.
3. Tap Share → **Add to Home Screen**. It now opens full-screen like an app.

To try it on a computer, just open `index.html` in a browser.
