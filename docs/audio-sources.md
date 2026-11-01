# Audio sources

This file records the sources of audio used by the New Year Countdown project.

Only the midnight recording is stored in the repository (`public/audio/`); the playlist tracks are hosted in a Vercel Blob store. Source information is kept here so the original track, creator, and license source can be identified later.

## Christmas mode playlist

Files are hosted in a Vercel Blob store (`christmas/` folder, base address in `VITE_AUDIO_BASE_URL`; not in the repository) and are played only while Christmas mode is active and music is enabled.

| File | Track | Source | Creator | Source URL |
| --- | --- | --- | --- | --- |
| `carol-of-the-bells.mp3` | Carol of the Bells (Instrumental Violin Cover) (1) | Pixabay | DJMYRIDA | https://pixabay.com/music/christmas-carol-of-the-bells-instrumental-violin-cover-1-528411/ |
| `christmas-prayer.mp3` | My Christmas Prayer | Mixkit | Michael Ramir C. | https://mixkit.co/free-stock-music/tag/christmas/ |
| `quiet-eve.mp3` | Quiet Eve - Christmas - Advent & Winter Music | Pixabay | JuliusH | https://pixabay.com/music/christmas-quiet-eve-christmas-advent-amp-winter-music-1772/ |
| `holiday-seasonal-3-510.mp3` | Holiday / Seasonal 3 | Mixkit | Diego Nava | https://mixkit.co/free-stock-music/tag/christmas/ |

## Normal-day playlist

Files are hosted in a Vercel Blob store (`normal/` folder, base address in `VITE_AUDIO_BASE_URL`; not in the repository) and are played outside Christmas mode while music is enabled. They pause during the midnight sequence and resume after it.

| File | Track | Source | Creator | Source URL |
| --- | --- | --- | --- | --- |
| `vastness.mp3` | Vastness | Mixkit | Andrew Ev | not recorded |
| `forest-mist-whispers.mp3` | Forest Mist Whispers | Mixkit | Alejandro Magaña (A. M.) | not recorded |
| `voxscape.mp3` | Voxscape | Mixkit | Eugenio Mininni | not recorded |

The files carry no embedded title or artist tags. Direct track URLs are not recorded yet and are to be added here once confirmed.

## Midnight sequence

`public/audio/midnight-sequence.mp3` is our own edited mix (about 4 minutes), made from these four Pixabay sound effects. It is played around midnight by `src/hooks/useMidnightAudio.ts`.

| Sound effect | Source | Source URL |
| --- | --- | --- |
| Happy New Year | Pixabay | https://pixabay.com/sound-effects/people-happy-new-year-386552/ |
| New Year Countdown | Pixabay | https://pixabay.com/sound-effects/film-special-effects-new-year-countdown-616795/ |
| 10 Second Count Down | Pixabay | https://pixabay.com/sound-effects/people-10-second-count-down-104235/ |
| Fireworks / Diwali Celebration | Pixabay | https://pixabay.com/sound-effects/film-special-effects-sound-effects-of-fireworks-diwali-celebration-421220/ |

Creator names for these four are not recorded here yet.

### Licensing

The Pixabay tracks and sound effects are made available under the Pixabay Content License.

The Mixkit tracks (Christmas and normal-day) are made available under the Mixkit License.

The audio files are used as part of the New Year Countdown experience and are not distributed as standalone audio products.

### Implementation

Both playlists are handled by `src/hooks/usePlaylist.ts` (track lists in `src/lib/playlists.ts`).

Christmas tracks are loaded only when Christmas mode is active and music is enabled; the normal-day tracks only outside Christmas mode while music is enabled. They are not included in the initial PWA precache.
