# Screenshots

This directory holds the images embedded in the root `README.md` and used
in any demo decks.

## Capture checklist

Take screenshots at **1440×900** (or wider) so they look sharp on retina
displays. Save as PNG. Crop to the visible viewport — no browser chrome.

| Filename | Page | What to show |
|---|---|---|
| `01-overview.png` | `/overview` | Full page with KPI cards + revenue trend chart + top products table visible |
| `02-forecasting.png` | `/forecasting` | KPI cards + forecast chart with historical-to-forecast transition visible |
| `03-inventory.png` | `/inventory` | KPI cards + simulated stock banner + risk table with mix of risk badges |
| `04-transactions.png` | `/transactions` | KPI cards + disclaimer + at least 5 flagged rows with reason code chips |
| `05-methodology.png` | `/methodology` | Top of page with multiple sections visible |
| `00-hero.png` | `/overview` | Optional — cropped tighter for the README hero image |

## How to capture cleanly

1. Make sure the backend has been hit at least once for each module so the
   pages aren't in loading state.
2. Use the browser at default zoom (100%).
3. On Windows: `Win + Shift + S` → rectangle selection → paste into your
   preferred editor and export PNG.
4. Optional: run the app with the full dataset (not the sample) so numbers
   look realistic.

## Tips

- For the hero image, prefer a "happy" view: positive growth deltas, no
  empty states, no errors.
- Avoid capturing during a slow loading state — wait until charts have
  rendered.
- If a recruiter will open the README on GitHub, dark mode is the
  default; check that your screenshots are still readable on a dark page
  background.
