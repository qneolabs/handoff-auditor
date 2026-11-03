# AI-tool and model-use disclosure

**Qneolabs / Handoff Auditor - Current disclosure - November 3, 2026**

## Development assistance

ChatGPT and OpenAI Codex were used as development tools. Codex assisted with implementation, code review, test creation and execution, documentation, synthetic examples, integration preparation and demo packaging. This includes the local replay interface and these entry materials. The project is AI-assisted development; it is not represented as entirely human-written code or documentation.

Development assistance is separate from the application's model runtime. The standalone request runner used Meta's Responses API with `muse-spark-1.3`. It does not invoke OpenAI models or an alternative model provider as an application fallback. The browser replay has no live model transport or credential-entry flow.

## Model experiments actually performed

Both experiments used the same synthetic evidence case and each had a separate one-request authorization with no retries.

| Experiment | Saved outcome | Accepted model findings | Calculated token cost |
| --- | --- | ---: | ---: |
| First attempt, November 3 at 04:49 Bangkok | HTTP 200, provider status incomplete, no visible answer | 0 | US$0.00937525 |
| Revised attempt, November 3 at 05:26 Bangkok | HTTP 200, provider status completed, response and citation validation passed | 1 | US$0.01031025 |

The combined calculated token cost is **US$0.01968550**. These figures use saved provider-reported usage and the rates verified before execution; they are not final billing confirmations. No pricing or billing service was accessed to prepare this disclosure.

The revised request increased the output allowance from 2,048 to 8,192 tokens and the client timeout from 20 to 60 seconds. It also retained better diagnostics. Both the first result and its consumed guard were preserved. The first attempt's precise provider stop reason and reasoning-token breakdown were not retained and remain unknown. The revised success does not retrospectively establish those missing details.

The successful response identified a contradiction between a claim of live owner acceptance and a source stating that approval was pending. The application accepted one proposal after its format, project/input binding, references and literal quotations passed validation. “Accepted proposal” does not mean that owner acceptance or the source's real-world authenticity was verified.

## Demonstration and example provenance

The Meta replay displays the saved successful provider response. It does not regenerate the answer, call Meta again, or silently substitute a fixture. The preserved private replay reproduces the original saved packet. This repository contains a labelled sharing copy: provider request/response and local authorization identifiers are redacted in the saved JSON and bundled downloads. Claims, evidence, findings, review state and historical model-call count are preserved. Its downloads reproduce the included sharing artifacts, not byte-identical private originals. The surrounding interface explicitly states that replay adds zero calls.

Other semantic rehearsal responses are hand-authored fixtures. The three structured demo samples and the built-in 20-case evaluation are synthetic deterministic checks. They are labelled separately and are not presented as live Meta results or a model-accuracy benchmark. The original private replay's 34 local tests and 10 browser checks qualify that version's stated software workflows only. The sharing copy's separate checks and their limits are recorded in [VALIDATION.md](VALIDATION.md).

The saved Meta packet remains **DRAFT**, M-01 remains **OPEN**, and no reviewer is recorded. This disclosure does not acknowledge, dismiss or resolve that finding.

## Selected caption-led video and editing

The selected [demo is hosted on YouTube](https://youtu.be/GFu-Zam6310) as **Unlisted, caption-led and silent**. Its local source is the 180-second edition, `handoff-auditor-caption-led-180s.mp4`, SHA-256 `c495596c4d89041f0e309b1ae35f7dc2fbf9610e9e50f7b87d67b7705efc64e1`. This hash identifies the local source, not YouTube's transcoded stream. It has one video stream and **no audio stream**, voice or music. Codex assisted the script, caption adaptation, local editing and verification. The original application picture and timing are retained; 24 English captions are burned into a separate band below it. Playback replays a saved real Meta response and separately labelled deterministic examples, with **no live inference during the demo**. DRAFT, M-01 OPEN and reviewer-unrecorded states are preserved.

The earlier two-minute and three-minute narrated editions used Microsoft Zira Desktop offline speech synthesis. Those files remain unchanged but are not the selected demonstration. Their narration redistribution rights were not established; no such audio is included in the selected edition. No font binaries, narration or video files are bundled in the source repository. The new caption treatment does not expand the source code's MIT grant to external media or third-party rights.

The displayed product implementation is standalone. Earlier concept, evaluation and storyboard planning existed before the event; it must not be represented as newly created hackathon implementation. The older planning record does not establish current eligibility or agreement acceptance. The current disclosure concerns the demonstrable standalone implementation and recorded experiments, with the prior conceptual work distinguished.

## Inputs, implementation and references

The two model requests used the prepared synthetic handoff and source text. Work Core source, history, credentials and project data were not used as evidence inputs. The standalone prototype and integration do not modify or connect to Work Core.

Meta's API documentation and the Meta legal-agent workshop were technical references. The saved implementation record states that workshop implementation code or assets were not copied. The integration used Node's built-in HTTP interface. Its baseline files were copies of the independent local prototype, rather than Work Core code.

## Scope of this disclosure

This document updates the project description to include the two experiments performed after the earlier preparation notes. Historical files remain unchanged. Their earlier “no real model evaluation” statements describe the preparation stage before those calls.

As of November 3, 2026, the [repository](https://github.com/qneolabs/handoff-auditor) is public under MIT, Copyright (c) 2026 Krishna Thapa (Qneolabs). Cerebral Valley's submission email confirms **Qneolabs Handoff Auditor, entry #761**. Earlier preparation records and private entry drafts remain historical records, not the current submission status.

This factual disclosure is not an organizer-approved interpretation of the runtime-model or AI-tool rules. Submission confirmation does not establish track eligibility, organizer acceptance of this disclosure or independently verified waiver acceptance. This documentation correction makes no new model request and does not alter the submitted entry or hosted video.
