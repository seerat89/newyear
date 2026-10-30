# Audio sources

This file records the sources of audio used by the New Year Countdown project.

Audio files are stored under `public/audio/`. Source information is kept here so the original track, creator, and license source can be identified later.

## Christmas mode playlist

Files are stored in `public/audio/christmas/` and are played only while Christmas mode is active and music is enabled.

| File | Track | Source | Creator | Source URL |
| --- | --- | --- | --- | --- |
| `carol-of-the-bells.mp3` | Carol of the Bells (Instrumental Violin Cover) (1) | Pixabay | DJMYRIDA | https://pixabay.com/music/christmas-carol-of-the-bells-instrumental-violin-cover-1-528411/ |
| `christmas-prayer.mp3` | My Christmas Prayer | Mixkit | Michael Ramir C. | https://mixkit.co/free-stock-music/tag/christmas/ |
| `quiet-eve.mp3` | Quiet Eve - Christmas - Advent & Winter Music | Pixabay | JuliusH | https://pixabay.com/music/christmas-quiet-eve-christmas-advent-amp-winter-music-1772/ |
| `holiday-seasonal-3-510.mp3` | Holiday / Seasonal 3 | Mixkit | Diego Nava | https://mixkit.co/free-stock-music/tag/christmas/ |

### Licensing

The Pixabay tracks are made available under the Pixabay Content License.

The Mixkit tracks are made available under the Mixkit License.

The audio files are used as part of the New Year Countdown experience and are not distributed as standalone audio products.

### Implementation

The Christmas playlist is handled by `src/hooks/useChristmasMusic.ts`.

Christmas tracks are loaded only when Christmas mode is active and music is enabled. They are not included in the initial PWA precache.
