// ✏️ Grown-up settings — edit this file to personalise the app.
window.APP_CONFIG = {
  // Her name, shown on the start screen. Leave "" for a plain "Hi!".
  name: "Stella",

  // Songs she can unlock. In the Spotify app: tap ••• next to a song →
  // Share → Copy Song Link, then paste it here between quotes.
  // Each time she finishes the quiz, two of these are picked at random.
  songs: [
    // "https://open.spotify.com/track/xxxxxxxxxxxxxxxxxxxxxx",
  ],

  // Optional: link to her whole playlist (••• → Share → Copy link to playlist).
  // Used only when the songs list above is empty.
  playlist: "https://open.spotify.com/playlist/0MFiZmMSqu2fQRdKAwwFek",

  // Spotify "Client ID" from developer.spotify.com (see README). When set,
  // full songs play through the Spotify app (Premium needed) and the quiz
  // comes back after each round. When empty, Spotify's preview player is used.
  spotifyClientId: "2a96bc04c83044dcb97572286a28d0f1",

  // How much music one finished quiz unlocks: a number of songs and,
  // optionally, a time limit in minutes (0 = no time limit). Whichever
  // runs out first sends her back to the quiz.
  songsPerQuiz: 2,
  minutesPerQuiz: 0,

  // A long silent Spotify track (at least 10 minutes) that plays during the
  // quiz, so the phone's Spotify app stays awake and the next song can start
  // straight away. Leave "" to simply pause instead.
  keepAwakeTrack: "",
};
