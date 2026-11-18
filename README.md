# BTPS Study 4c: simulated business-travel booking platform

A web app that tests the **behavioural validity** of the Business Travel Priorities Scale (BTPS). Participants play a consultant at a fictional company and book the outbound flight for **8 business trips (plus 1 practice)** on a realistic corporate booking platform (*TravelDesk*). The task takes about **12 minutes**. The app runs inside a Qualtrics question (iframe) and writes all its data to Qualtrics Embedded Data.

Stack: Vite + React + TypeScript, static build, deploys to Vercel. No backend and no API keys.

## Which BTPS factors it tests

| BTPS factor | How it is varied | Behavioural indicators |
|---|---|---|
| Travel Strain (STR) | Direct, daytime flight vs one stop, 3h20m to 4h45m layover, awkward departure hour | Choice; "Direct only" filter; "Shortest" sort; legroom add-on |
| Work Productivity (PRD) | Wi-Fi, power and work-friendly seat vs none | Choice; "Wi-Fi" filter; lounge-with-work-pods add-on |
| Travel Safety (SAF) | Fictional airline safety rating 7/7 vs 4/7 | Choice; "Top safety" filter; safety-cover add-on |
| Environmental Sustainability (ENV) | CO₂ about 14 to 20% below vs above typical (newer vs older aircraft), shown independently of stops | Choice; "Lowest CO₂" sort; offset/SAF add-on |
| Loyalty Rewards (LOY) | Airline in vs out of the participant's alliance (SkyCircle Gold) | Choice; "SkyCircle only" filter; miles top-up add-on |
| AI Recommendation Quality | Trip Assistant absent, recommends the best option (good), or recommends the worst option (poor); within person 3 good / 3 poor / 2 none | Following rate for good vs poor picks (discernment), "Show this flight" clicks, AI cited as justification |
| Destination Attractiveness (exploratory) | Not manipulated. Each trip shows a one-line destination description | Uptake of the optional two-day leisure extension per destination |

A sixth flight attribute, **company policy (PRC)**, puts the fare within vs above the trip's fare cap. A fare above the cap is allowed but requires a reason, which gives participants a real (if non-monetary) cost and a second measure of priorities (the reasons map onto the factors).

## Experimental design

`scripts/generate_design.py` builds the design and writes `src/data/design.json`.

- 8 choice sets × 4 flights = 32 distinct profiles over 6 two-level attributes.
- Within every set, each attribute is balanced (2 favourable, 2 unfavourable), **no option dominates another**, and the count of favourable levels is (4, 3, 3, 2). The unique 4 is the "best" option (used for good AI picks) and the unique 2 is the "worst" (used for poor AI picks).
- Across the design every attribute is 16/16 balanced. Pairwise attribute correlations are −0.125 (one pair, SAF × ENV, is −0.25). A strictly orthogonal fraction is not possible here, because any orthogonal fraction contains extreme profiles that dominate the rest of a balanced set. These correlations are small (VIF about 1.2) and their sign is known.
- The AI cites two genuine favourable attributes of the flight it picks in both good and poor conditions. Good and poor messages are the same length and never false; poor picks are simply worse overall.

**Randomised per participant** (reproducible from a seed derived from `pid`): trip order, which design set goes with which destination, which bookings get good / poor / no AI, default card order, airline names within cells, departure times, layover hubs, prices and CO₂ values within their bands.

## Analysis outline

Each scored booking yields one choice among 4 alternatives, so 8 × N choices in total. A conditional or mixed logit with alternative-specific attributes interacted with standardised BTPS factor scores tests whether each factor predicts sensitivity to its own attribute (convergent) more than to the others (discriminant):

```
U_ij = Σ_k (β_k + γ_k · BTPS_k,i) · x_kj + Σ_k Σ_{m≠k} δ_km · BTPS_m,i · x_kj + AI_rec_j terms + ε_ij
```

For AI Recommendation Quality, the key test is the interaction BTPS_AI × recommended × quality (good vs poor): high scorers should follow good picks *and* reject poor picks, not just follow more often.

Process data (filters, sorts, details opened, add-ons bought, justification reasons) give converging indicators.

## Data

### Flat Embedded Data (one set of fields per scored booking, n = 1..8, in presentation order)

| Field | Meaning |
|---|---|
| `b4c_n_trip` | Destination id |
| `b4c_n_set` | Design set id (1 to 8) |
| `b4c_n_ai` | `good`, `poor` or `none` |
| `b4c_n_rec` | Recommended option index within the design set (0 to 3; blank if none) |
| `b4c_n_choice` | Chosen option index within the design set (0 to 3) |
| `b4c_n_code` | Chosen flight's attribute code in order STR PRD SAF ENV LOY PRC (1 = favourable) |
| `b4c_n_follow` | 1 if chose the AI pick, 0 if not, blank if no AI |
| `b4c_n_over` | 1 if the fare was above the cap |
| `b4c_n_just` | Reasons given for an above-cap fare (`STR`, `PRD`, `SAF`, `ENV`, `LOY`, `AI`, `OTHER`), pipe-separated |
| `b4c_n_addons` | Add-ons bought (`legroom`, `lounge`, `safety`, `offset`, `miles`), pipe-separated |
| `b4c_n_bleisure` | 1 if extended the stay |
| `b4c_n_rt` | Milliseconds from results shown to booking confirmed |

Plus `b4c_version`, `b4c_seed`, `b4c_duration_s` and `b4c_check_attempts` (attempts at the 2-question instruction check).

### Full JSON (`b4c_json`)

Everything above plus, per booking: all 4 flights shown with their attributes and displayed values, default display order, AI reasons, time to first selection, number of times the participant went back to change flight, free-text justification, and a timestamped event log (`sort`, `filter`, `filter_clear`, `details`, `ai_show`, `select`, `change_flight`, `addon`, `justify`, `bleisure`, `confirm`). The practice booking is included as `pos: 0` and should be excluded from analysis.

Flight attributes are design-set option indices (0 to 3), so `choice` and `rec` can be joined to `src/data/design.json` directly. Check in the pilot that `b4c_json` is stored in full; the flat fields hold everything needed for the main analysis if it is not.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173/?pid=test
npm run build        # production build to dist/
```

Outside an iframe, the end screen offers a **Download session JSON** button for checking. Add `&seed=123` to reproduce a specific randomisation. Add `&debug=1` to show the download button inside Qualtrics.

## Deploy and embed in Qualtrics

1. Import this repository into Vercel (framework preset: Vite). No environment variables are needed.
2. `vercel.json` only allows the app to be framed by `*.qualtrics.com`. Edit it if your survey runs on another domain.
3. In Qualtrics, add the Embedded Data fields listed at the top of `qualtrics/question.js` to the Survey Flow **before** the booking block.
4. Add a Text/Graphic question with the iframe HTML from `qualtrics/question.js`, then paste the JavaScript into that question and set `APP_ORIGIN` to your Vercel URL. The Next button stays hidden until all bookings are confirmed, and the iframe resizes to fit its content.
5. Optional but recommended: append `&origin=https://YOURORG.qualtrics.com` to the iframe URL so the app only sends data to that origin.

Progress is kept in sessionStorage, so an accidental reload resumes at the next booking rather than restarting.

## Configuration

`src/config.ts` holds the company and platform names, currency, alliance, add-on allowance (S$60) and prices, AI allocation (3 good / 3 poor / 2 none), destinations, fare caps, airline names, aircraft, departure-time pools, justification options and AI reason wording. Regenerate the design with `npm run design` if you change the attributes.

## Before data collection

- Run a timing pilot (5 to 10 people). If the median is under 1 minute per booking, consider 10 bookings; if over 1.5 minutes, drop to 6 (this needs a new design).
- The study numbering has changed since IRB Amendment #1 (IRB-2025-994), which describes 4c as a stimulus-variety pilot and 4d as the simulated booking platform. Check whether an amendment is needed.
