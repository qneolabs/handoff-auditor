# Handoff Auditor — offline recording and simulation

Double-click **launch.cmd** to serve this app locally at http://127.0.0.1:8767/ with Python 3. Alternatively run `python serve.py --port 8767 --open` from this folder. No dependencies, account or key are needed. Keep the server console open while using it. The current task preview uses a separate available port shown in the package guide.

The default sample is **Recorded Meta result · offline replay**. Select **Replay saved Meta result**, inspect its source, and preview/download the saved draft. This is a captured real Meta response on synthetic evidence, recorded November 3, 2026. Viewing it never runs Meta again. M-01 remains open; reviewer entry and review changes are unavailable. Downloads preserve this sharing copy. Provider request/response and authorization identifiers are redacted in JSON; the source text, finding, review state and historical request count are unchanged. The original private artifacts are preserved separately.

The three other samples run deterministic structured simulations. Those retain their normal input and review controls. Importing or editing an evidence pack starts a separate simulation and clears any previous audit/review. It never reuses the recorded Meta finding. Refreshing returns to the read-only recorded sample.

The browser keeps state only in its current tab. Local downloads are explicit. The recording's files remain saved on disk. There are no API credentials, live transport or key-entry controls in this app. The page's `connect-src 'none'` policy blocks script connections, and its scripts/styles/assets are local. The optional Python server binds only to 127.0.0.1 and serves static files.

## Validation

With the existing Node.js installation, run:

```text
node --require ./tests/no-network.cjs --test tests/core.test.cjs tests/recording.test.cjs
```

The 29 original structured checks and five replay checks pass. The replay tests cover exports matching the included sharing copy, immutable review state, input binding, hashes of the included sharing artifacts and rejection of altered recordings. The original private replay had prior desktop/mobile checks. Validation of this sharing copy is reported separately; do not transfer the original browser results automatically.

## Files and limits

- `recording-data.js`: bundled saved response, packet and receipt, with source hashes.
- `recording.js`: local, read-only replay adapter; no transport or model generation.
- `recorded-meta/`: five saved artifacts for this sharing copy, with the stated identifier redactions.
- `app.js`, `index.html`, `styles.css`: existing evidence desk extended with a recording mode.
- `core.js`, `samples.js`, `evaluation.js`: unchanged structured simulation and synthetic examples.

One captured success does not establish model quality across other cases, source authenticity, permission, owner acceptance, deployment readiness or hackathon eligibility. See the parent package's [guide](../START-HERE.md) and [validation](../VALIDATION.md).
