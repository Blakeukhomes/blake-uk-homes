# PWA icons

Drop two PNGs here before deploying:

- `icon-192.png` — 192×192 px
- `icon-512.png` — 512×512 px

Both should use the dark `#0b1020` background with the orange accent skyscraper mark
to match the in-app `Logo` component. The Blake UK Homes wordmark is "Blake" in ink-950
with "Homes" in accent-500 — match this in the icon if you redesign it.

Quick way to generate from the SVG logo:

```bash
# requires `sharp-cli` or `inkscape`
npx sharp-cli -i logo.svg -o icon-192.png resize 192 192
npx sharp-cli -i logo.svg -o icon-512.png resize 512 512
```
