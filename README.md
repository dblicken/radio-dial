# Radio Dial

A name-that-tune game in a single web page. A radio dial sweeps through static and lands on a song for a few seconds, then moves on. When someone in the room names it, hit **Got it** (or the space bar) to stop the dial and reveal the song.

**Play it:** https://dblicken.github.io/radio-dial/ (after GitHub Pages is turned on, see below)

## Two versions

- **Party** (`index.html`): one phone acts as the radio, people shout answers, and whoever holds the phone stops the dial.
- **Solo** (`solo.html`, at https://dblicken.github.io/radio-dial/solo.html): a round of 10 songs for one player. Each song plays and a clock runs. Tap **Name it** when you know it, then pick from 5 choices. At the end you get a Wordle-style result to copy: ⚡ Lightning · 🟩 under 4s · 🟨 under 8s · 🟧 slower · ⬜ after the buzzer · 🟥 wrong.

### Solo scoring (v2): fast *and* real

- **Listening time sets the points:** 2000 × ½^(seconds ÷ 2.5). That works out to 1,741 at 0.5s, 1,434 at 1.2s, 1,149 at 2s, 500 at 5s and 125 at 10s. Because the points halve every 2.5 seconds, the first seconds are worth far more than the later ones.
- **Picking time verifies it:** after you stop, a red bar drains for 4 seconds. Pick within 1.5s for full points. After that the points slide down to ×0.5, and if the bar runs out it counts as a miss. Stopping early and then reading the choices at leisure no longer pays.
- **Wrong or too slow costs −500.** Stopping at once and guessing at random now loses points on average: 20% × ~1,850 − 80% × 500 ≈ −30.
- **⚡ Lightning:** correct in under 2s with a pick under 1.5s.

The wrong answers come from the same station, so they're from the same era and genre. Where possible they're also by different artists, so you can't just spot the one artist that doesn't fit.

## How to play (party)

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

## Original release years (`year.js`)

Deezer, like Spotify, dates a song by the album it sits on. A 2015 remaster says 2015, and a 2008 soundtrack reissue says 2008. `year.js` asks **MusicBrainz**, a free community music database that tracks every release of every recording, for the song's *first* release date:

1. Clean the title: "(2018 Remaster)", "- Single Version" and "(From '…' Soundtrack)" are stripped. The game shows these cleaned titles too.
2. Search MusicBrainz for that title by that artist.
3. Keep only results where the title and artist match after normalizing ("AC/DC" = "acdc", accents and "The" ignored), which filters out covers and similarly named songs.
4. Take the earliest first-release year among the matches.

If MusicBrainz finds nothing, the game falls back to Deezer's year and shows it greyed out with "(may be a reissue date)". Requests wait in line at about one per second, as MusicBrainz asks, and results are cached. Solo starts the lookup when the song comes in, so the year is usually ready by the time you answer.

## Turning on GitHub Pages

Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.** The site appears about a minute later. On iPhone, open it in Safari and use **Share → Add to Home Screen**.

## Ideas for later

- Through-the-wall mode (muffled audio that clears up over time)
- Two-team scoring
- Decade guess for a bonus point
- Mashup round (two stations bleeding into each other)

## The Radio Game (`radio-game/`)

A fork of Radio Dial Solo v3.1 (Nov 26, 2026), played at https://dblicken.github.io/radio-dial/radio-game/, where new enhancements get tried. It has its own copy of `year.js`, so experiments here can't change the original. (A car-dashboard look was tried and dropped; it's in the git history, commit ac229e7.)

**The original is frozen** on the branch `radio-dial-v1-frozen`, an exact snapshot from Nov 26, 2026. The files at the top of `main` (`index.html`, `solo.html`, `year.js`) are also left as they were.

### Years in The Radio Game

The Radio Game's copy of `year.js` prefers the year of the **first official studio album** the song appeared on (soundtracks count; compilations, live albums, remixes and demos don't). Failing that it uses the first official single, and only then the earliest release of any kind. So Arctic Monkeys' "Fake Tales of San Francisco" shows 2006, the year of the album, not 2004, the year of the demos. A small note appears beside the year when it comes from a single or another fallback.
