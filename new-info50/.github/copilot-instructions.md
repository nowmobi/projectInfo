<!-- Copilot / AI agent instructions for this repo -->
# Project Summary

This is a small static-site + packaging toolchain that:
- Uses simple Node scripts to apply theme/config (`node_templete.js`),
  package & obfuscate (`node_compress.js`) and run batch jobs (`node_batch.js`).
- Serves a static frontend under the repository root (HTML in `index.html`, `pages/`, `public/`).

# How to run common developer tasks
- Install deps: `npm install`
- Apply theme/update files: `npm run node1`  (runs `node_templete.js`)
- Obfuscate & create zip: `npm run node2`  (runs `node_compress.js`)
- Full batch processing (Excel-driven): `npm run batch`  (runs `node_batch.js`)

Notes: scripts are defined in `package.json` as `node1`, `node2`, `batch`.

# Key files and why they matter
- `config.json` — single-source for `domain`, `color`, `color1`, `color2`. Node scripts read/write this.
- `node_templete.js` — reads `config.json`, updates `public/style/inpublic.css` CSS variables (`--color1`, `--color2`) and edits HTML domain strings.
- `node_compress.js` — obfuscates JS (uses `javascript-obfuscator`) and archives files into `z_<domain>.zip`.
- `node_batch.js` — batch workflow: reads `web.xlsx`, updates `config.json`, runs `node_templete.js` then `node_compress.js` for many domains.
- `public/js/BaseURL.js` — central remote URLs: frontend fetches articles from `Category_URL`.
- `public/js/inpublic.js`, `public/js/category.js`, `public/js/detail.js` — main frontend modules (use ES modules); they fetch `Category_URL` and render UI.
- `public/style/inpublic.css` — theme variables live here (edit `--color1/--color2` to change appearance).

# Project-specific conventions & patterns
- Config-first flow: update `config.json` then run `node_templete.js` to propagate changes to CSS/HTML.
- CSS theming uses CSS variables in `:root` (look for `--color1` / `--color2`). `node_templete.js` updates these values programmatically.
- Packaging names: output zip files are named `z_<safe-domain>.zip`; repeated packs increment a numeric suffix.
- Frontend expects ESM modules under `public/js/*` and a small global helper `Utils` (present in codebase). Use relative imports consistent with existing modules.
- Ad script selection: `index.html` conditionally loads `homegg.js` or `homegg_ads.js` based on `ad_code_identifier` (see `index.html` script block).

# Integration points & external deps
- Node scripts require: `javascript-obfuscator`, `archiver`, `xlsx` (declared in `package.json`).
- Frontend fetches data from `Category_URL` configured in `public/js/BaseURL.js` — changing remote APIs should be coordinated.

# Good prompt examples for edits
- Change primary theme color:
  1) Update `config.json` → `color` (hex)
  2) Run `npm run node1`
  3) Verify `public/style/inpublic.css` updated `--color1`
- Add a new HTML page under `pages/`: follow existing pages (`pages/about.html`, `pages/privacy.html`) and keep relative paths used by scripts.
- Debugging fetch issues in frontend: check `public/js/BaseURL.js` → `Category_URL`, then open browser console while loading `index.html`.

# What an AI agent should NOT change automatically
- Do not arbitrarily modify `web.xlsx` or `config.json` values without explicit user instruction — these drive batch outputs.
- Avoid breaking `node_compress.js` obfuscation options; changing them can break output compatibility.

# When you are uncertain, ask the human
- If a change affects the remote data API (`Category_URL`) or packaging naming, confirm intended behavior.
- Confirm before altering obfuscation settings or removing files from `filesToPack` in `node_compress.js`.

# Next steps
- If you want localized (Chinese) instructions or more examples (commands and expected file diffs), tell me which sections to expand.
