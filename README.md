# BTPS Study 4c: simulated business-travel booking platform

A web app that tests the **behavioural validity** of four Business Travel Priorities Scale (BTPS) factors. Participants play a consultant at a fictional company and book the outbound flight for **8 business trips (plus 1 practice)** on a realistic corporate booking platform (*TravelDesk*). The task takes about **12 minutes**. The app runs inside a Qualtrics question (iframe) and writes all its data to Qualtrics Embedded Data.

Stack: Vite + React + TypeScript, static build, deploys to Vercel. No backend and no API keys.

## Factors tested

| BTPS factor | How it is varied | Behavioural indicator |
|---|---|---|
| Travel Strain (STR) | Direct, daytime flight vs one stop, 3h20m to 4h45m layover, awkward departure hour | Picks the less tiring flight even when it costs more |
| Environmental Sustainability (ENV) | CO₂ about 14 to 20% below vs above typical (newer vs older aircraft), independent of stops | Picks the lower-emission flight even when it costs more |
| Loyalty Rewards (LOY) | Airline is or is not a partner in the company's travel rewards scheme (*Meridian Rewards*), which gives the employee points | Picks the points-earning flight even when it costs more |
| AI Recommendation Quality | On 6 of 8 bookings (random), an AI Trip Assistant recommends one flight chosen **uniformly at random**, citing up to two genuine strengths of that flight | How often participants accept the AI's pick |

**The cost** is the fare. Each list of 4 flights contains one flight at each of four fare levels relative to the trip's fare cap: −15%, −5% (within policy), +5% and +15% (above the cap, which requires a reason). Fares get ±2% jitter so they look realistic, but the levels never overlap.

## Experimental design

`scripts/generate_design.py` builds the design and writes `src/data/design.json`.

- 8 choice sets × 4 flights. Within every set: the four fare levels each appear once, each benefit (STR, ENV, LOY) is split 2/2, and **no flight is both at least as good on every benefit and cheaper than another**. So choosing a benefit always costs something: a higher fare, another benefit, or both.
- Correlations across the 32 flights: benefits with fare +0.22 to +0.28 (the intended cost); benefits with each other −0.125 to −0.25.
- Randomised per participant (reproducible from a seed derived from `pid`): trip order, which design set goes with which destination, which 6 bookings show the AI, which flight the AI picks, default card order, airline names, departure times, layover hubs, and price and CO₂ values within their bands.
- The practice booking uses a separate set and always shows the AI, so the assistant is familiar before the scored bookings.

## Analysis outline

Each scored booking is one choice among 4 flights, so 8 × N choices. A conditional or mixed logit with fare as a continuous attribute:

```
U_ij = β_fare · fare_j + Σ_k (β_k + γ_k · BTPS_k,i) · x_kj + (α + λ · BTPS_AI,i) · AIpick_ij + ε_ij
```

- **STR, ENV, LOY:** γ_k > 0 means people high on factor k choose that benefit more often given its fare. The ratio (β_k + γ_k · BTPS_k) / −β_fare is the willingness to pay for each benefit. Comparing a factor's γ on its own attribute with its γ on the other attributes tests discriminant validity.
- **AI:** α is the overall acceptance effect beyond each flight's own attractiveness, and λ tests whether the BTPS AI factor predicts acceptance. Because the AI's pick is random, the descriptive acceptance rate can be compared with the 25% expected by chance and with each flight's choice share on no-AI bookings.

Process data (sorts, filters, details opened, time to choose, reasons given for above-cap fares) give converging indicators.

## Data

### Flat Embedded Data (one set of fields per scored booking, n = 1..8, in presentation order)

| Field | Meaning |
|---|---|
| `b4c_n_trip` | Destination id |
| `b4c_n_set` | Design set id (1 to 8) |
| `b4c_n_ai` | 1 if the Trip Assistant was shown |
| `b4c_n_rec` | Recommended option index within the design set (0 to 3; blank if no AI) |
| `b4c_n_choice` | Chosen option index within the design set (0 to 3) |
| `b4c_n_code` | Chosen flight's levels as STR ENV LOY PRICE, e.g. `1012` = direct, high CO₂, partner, fare level 2 |
| `b4c_n_price` | Chosen fare in S$ |
| `b4c_n_follow` | 1 if chose the AI pick, 0 if not, blank if no AI |
| `b4c_n_over` | 1 if the fare was above the cap |
| `b4c_n_just` | Reasons for an above-cap fare (`STR`, `ENV`, `LOY`, `AI`, `OTHER`), pipe-separated |
| `b4c_n_rt` | Milliseconds from results shown to booking confirmed |

Plus `b4c_version`, `b4c_seed`, `b4c_duration_s` and `b4c_check_attempts` (attempts at the 2-question instruction check).

### Full JSON (`b4c_json`)

Everything above plus, per booking: all 4 flights shown with their levels and displayed values (fare, CO₂, times, airline), default display order, the AI's cited reasons, time to first selection, number of times the participant went back to change flight, free-text justification, and a timestamped event log (`sort`, `filter`, `filter_clear`, `details`, `ai_show`, `select`, `change_flight`, `justify`, `confirm`). The practice booking is `pos: 0` and should be excluded from analysis.

Check in the pilot that `b4c_json` is stored in full; the flat fields hold everything needed for the main analysis if it is not (option fares can be rebuilt from the seed).

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173/?pid=test
npm run build        # production build to dist/
```

Outside an iframe, the end screen offers a **Download session JSON** button for checking. Add `&seed=123` to reproduce a specific randomisation, or `&debug=1` to show the download button inside Qualtrics.

## Deploy and embed in Qualtrics

1. Import this repository into Vercel (framework preset: Vite). No environment variables are needed.
2. `vercel.json` only allows the app to be framed by `*.qualtrics.com`. Edit it if your survey runs on another domain.
3. In Qualtrics, add the Embedded Data fields listed at the top of `qualtrics/question.js` to the Survey Flow **before** the booking block.
4. Add a Text/Graphic question with the iframe HTML from `qualtrics/question.js`, then paste the JavaScript into that question and set `APP_ORIGIN` to your Vercel URL. The Next button stays hidden until all bookings are confirmed, and the iframe resizes to fit its content.
5. Optional but recommended: append `&origin=https://YOURORG.qualtrics.com` to the iframe URL so the app only sends data to that origin.

Progress is kept in sessionStorage, so an accidental reload resumes at the next booking rather than restarting.

## Configuration

`src/config.ts` holds the company, platform and rewards-scheme names, currency, number of AI bookings (6 of 8), destinations, fare caps, fare levels, airline names, aircraft, departure-time pools, justification options and AI reason wording. Regenerate the design with `npm run design` if you change the attributes.

## Before data collection

- Run a timing pilot (5 to 10 people). Each booking is now shorter, so the median may be well under 1 minute per booking; if so, consider more bookings (this needs a new design).
- The study numbering has changed since IRB Amendment #1 (IRB-2025-994), which describes 4c as a stimulus-variety pilot and 4d as the simulated booking platform. Check whether an amendment is needed.
