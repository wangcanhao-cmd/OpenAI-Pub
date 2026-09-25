# Oyster Growth & Environment Simulator

A standalone static web prototype for the JSU oyster sensor project.

## What it includes
- Three deployment contexts from the proposal: controlled flow-through system, Deer Island aquaculture site, and experimental reef complex.
- Six proposal water-quality variables: salinity, temperature, dissolved oxygen, pH, turbidity, and chlorophyll.
- Optional scenario controls for stocking density and a generic disturbance/contamination event.
- Timeline playback with adjustable speed and projected shell-height trajectory.

## Scientific status
The UI is ready for demonstration, but the numeric response functions in `app.js` are placeholder heuristics, **not a validated biological growth model**. The proposal states that Hall-effect closed-gape data will be paired with shell height, wet weight, and condition index to ground-truth growth estimates, and that the resulting environmental-growth response curves will be supplied to modeling partners. Once fitted coefficients are available, replace `stressAndGrowth()` with the calibrated model.

## Run locally
Open `index.html` directly, or serve the folder with any static web server.

## Deploy
This project lives in the `OpenAI/oyster-growth-simulator/` subdirectory. On Netlify, set the base/publish directory to `oyster-growth-simulator`. No build command is required.
