# Radio Dial

A name-that-tune game in a single web page. A radio dial sweeps through static and lands on a song for a few seconds, then moves on. When someone in the room names it, hit **Got it** (or the space bar) to stop the dial and reveal the song.

**Play it:** https://dblicken.github.io/radio-dial/ (after GitHub Pages is turned on, see below)

## How to play

1. Pick a station (80s, 90s, Classic rock…), or type any playlist search, such as "motown" or "yacht rock".
2. Tap **Power on**. The dial sweeps, and every few seconds a song comes in.
3. Shout out the song, then tap **Got it**. The title, artist, album and year appear.
4. Score it **right** or **wrong**, and the dial starts scanning again.
5. Songs nobody stopped for land in **Slipped by**.

The sliders set how long each clip plays and how long the static lasts between clips.

## How it works

Everything is in `index.html`. There's no server, no build step and no API key.

- **Songs come from Deezer's public API**, which supplies song info and 30-second preview clips. Browsers normally block a page from reading data from another site unless that site allows it, and Deezer doesn't. So the page uses an old workaround called **JSONP**: browsers let a page load scripts from any site, so the page adds a `<script>` tag pointing at Deezer, and Deezer sends the data back wrapped in a call to a function the page has just set up.
- **The static is synthesized.** The page fills two seconds of audio with random numbers (white noise) and loops it through a band-pass filter whose center frequency keeps jumping. That wandering is what sounds like a dial being turned.
- **The next song loads during the static.** While one clip plays, the next is already loading in a second audio player and has jumped to a random point in its preview, so songs don't always start at the familiar intro.
- **Each sweep has an ID number.** Tapping Got it increments the ID, and the running loop sees the mismatch and quits, so two loops never play at once.

### Phone-specific tricks

- **iPhones only allow sound in direct response to a tap.** The page creates two audio players at load time and, on the Power on tap, plays a 0.1-second silent WAV through each. The WAV is built byte by byte in JavaScript. That tap unlocks both players, and from then on the game swaps songs into them.
- **iPhones ignore volume changes from a web page.** The page checks for this once, and if so it skips the fade-ins and cuts songs in sharply. It also uses `muted`, which iPhones do honor, to hide the jump to a random spot.
- **Silent switch:** `navigator.audioSession.type = 'playback'` lets the synthesized static play even when the ringer is off.
- **Phones on cellular often refuse to preload audio.** If a clip hasn't loaded after 4 seconds, the game starts it muted, jumps to a random spot, then unmutes.

## Turning on GitHub Pages

Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.** The site appears about a minute later. On iPhone, open it in Safari and use **Share → Add to Home Screen**.

## Ideas for later

- Through-the-wall mode (muffled audio that clears up over time)
- Two-team scoring
- Decade guess for a bonus point
- Mashup round (two stations bleeding into each other)
