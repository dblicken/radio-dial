// year.js — shared by both Radio Dial pages.
//
// Problem: Deezer (like Spotify) dates a song by the album it sits on, so
// "Back In Black" from a 2003 remaster says 2003 and a soundtrack reissue says 2008.
// Fix: ask MusicBrainz, a free, community-built music database that tracks every
// release of every recording and records each recording's *first* release date.
//
// Also exports cleanTitle(), which strips "(2018 Remaster)", "- Single Version",
// "(From 'Dirty Dancing' Soundtrack)" and similar noise from titles.
(function () {
  const WORDS = 'remaster(?:ed)?|remix|version|edit|mono|stereo|live|from|soundtrack|feat\\.?|ft\\.?|deluxe|anniversary|single|radio|bonus|demo|re-?recorded|mix';
  const BRACKETS = new RegExp('\\s*[\\(\\[][^\\)\\]]*\\b(?:' + WORDS + ')\\b[^\\)\\]]*[\\)\\]]', 'gi');
  const DASH = new RegExp('\\s+-\\s+[^-]*\\b(?:' + WORDS + ')\\b.*$', 'i');

  function cleanTitle(t) {
    const c = (t || '').replace(BRACKETS, '').replace(DASH, '').trim();
    return c || t;
  }
  // Compare names loosely: "AC/DC" = "ACDC", "Beyoncé" = "Beyonce", "&" = "and".
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and').replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');

  // MusicBrainz asks for no more than ~1 request per second, so requests wait in line.
  let last = 0, chain = Promise.resolve();
  function mb(url) {
    const run = chain.then(async () => {
      const wait = last + 1100 - Date.now();
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      last = Date.now();
      const r = await fetch(url);
      if (!r.ok) throw new Error('MusicBrainz ' + r.status);
      return r.json();
    });
    chain = run.catch(() => {});
    return run;
  }

  // Given MusicBrainz search results, find the earliest year among recordings that
  // really are this song by this artist (not covers, not similarly named songs).
  // Which year to show, in order of preference:
  //   1. the first official studio album (or soundtrack) the song appeared on
  //   2. otherwise, its first official single
  //   3. otherwise, its earliest release of any kind (demos, EPs, bootlegs…)
  // Compilations, live albums, remixes and demos never count as "the album".
  const NOT_THE_ALBUM = ['compilation', 'live', 'remix', 'dj-mix', 'mixtape/street', 'demo', 'interview', 'audiobook', 'spokenword'];
  function earliestYear(recordings, title, artist) {
    const nt = norm(cleanTitle(title)), na = norm(artist);
    let album = null, single = null, any = null;   // each: { year, from }
    const keep = (cur, y, from) => (y > 1900 && (!cur || y < cur.year)) ? { year: y, from } : cur;
    for (const r of recordings || []) {
      if ((r.score || 0) < 70) continue;
      if (norm(cleanTitle(r.title)) !== nt) continue;
      const credit = norm((r['artist-credit'] || []).map(c => c.name + (c.joinphrase || '')).join(''));
      if (!credit || !(credit.includes(na) || na.includes(credit))) continue;
      any = keep(any, parseInt((r['first-release-date'] || '').slice(0, 4), 10), null);
      for (const rel of r.releases || []) {
        if (rel.status && rel.status !== 'Official') continue;
        const rg = rel['release-group'] || {};
        const y = parseInt((rel.date || '').slice(0, 4), 10);
        const extra = (rg['secondary-types'] || []).map(t => t.toLowerCase());
        if (extra.some(t => NOT_THE_ALBUM.includes(t))) continue;
        const from = rg.title || rel.title || null;   // e.g. "Parallel Lines"
        if (rg['primary-type'] === 'Album') album = keep(album, y, from);
        else if (rg['primary-type'] === 'Single') single = keep(single, y, from);
      }
    }
    if (album) return { ...album, kind: 'album' };
    if (single) return { ...single, kind: 'single' };
    if (any) return { ...any, kind: 'first release' };
    return null;
  }

  async function musicbrainzYear(track) {
    const title = cleanTitle(track.title), artist = track.artist ? track.artist.name : '';
    const q = 'recording:"' + title.replace(/["\\]/g, ' ') + '" AND artist:"' + artist.replace(/["\\]/g, ' ') + '"';
    const d = await mb('https://musicbrainz.org/ws/2/recording?fmt=json&limit=50&query=' + encodeURIComponent(q));
    return earliestYear(d.recordings, title, artist);
  }

  // Deezer's own date, as a fallback (often a reissue year).
  function deezerYear(id) {
    return new Promise(resolve => {
      const cb = 'dzy' + Math.random().toString(36).slice(2), s = document.createElement('script');
      const done = y => { clearTimeout(t); delete window[cb]; s.remove(); resolve(y); };
      const t = setTimeout(() => done(null), 8000);
      window[cb] = d => {
        const y = parseInt(((d && (d.release_date || (d.album && d.album.release_date))) || '').slice(0, 4), 10);
        done(y > 1900 ? y : null);
      };
      s.onerror = () => done(null);
      s.src = 'https://api.deezer.com/track/' + id + '?output=jsonp&callback=' + cb;
      document.head.appendChild(s);
    });
  }

  // → { year, sure } or null. sure = confirmed by MusicBrainz.
  // Results are remembered, so asking twice for the same song costs nothing.
  const cache = new Map();
  function originalYear(track) {
    if (!cache.has(track.id)) {
      cache.set(track.id, (async () => {
        const [mb, dzY] = await Promise.all([musicbrainzYear(track).catch(() => null), deezerYear(track.id)]);
        // An album or single year from MusicBrainz is trusted as is (Deezer's date is
        // usually a reissue). Only the any-release fallback is checked against Deezer.
        if (mb && mb.kind !== 'first release') return { year: mb.year, from: mb.from, sure: true, kind: mb.kind };
        if (mb) return { year: dzY ? Math.min(mb.year, dzY) : mb.year, sure: true, kind: mb.kind };
        return dzY ? { year: dzY, sure: false } : null;
      })());
    }
    return cache.get(track.id);
  }

  window.RadioYear = { cleanTitle, originalYear, earliestYear };
})();
