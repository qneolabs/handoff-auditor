# Validation records and scope

## Historical local licensed-release validation - November 3, 2026

The following record covers owner-authorized MIT and caption-led video finalization **before public release and submission**, recorded in source provenance at 08:46:20 UTC. Its test counts, local-only wording and non-actions describe that stage, not the current publication/submission status.

- **34 app tests and 78 runtime fixture tests passed**, zero failures, in a disposable copy with HTTP/socket/DNS/HTTP2 operations blocked and credential environment excluded. Node.js v25.1.0 was used. The suites share 29 core checks; these are software checks, not 112 independent model evaluations.
- Both actual historical consumed authorization IDs were read privately and rejected before key validation, result-directory creation or transport invocation. No credentials were supplied. Missing, malformed, incomplete, duplicate and sparse fingerprint cases remain covered; lock, concurrency, disabled-CLI and no-retry checks passed.
- The privacy correction is unchanged: historical tracking/authorization identifiers are absent in plaintext; two consumed-ID SHA-256 fingerprints remain intentionally. The original private results and one-attempt guards remain outside this repository.
- All application/runtime source and test files, package configuration and saved replay artifacts remain byte-identical to the previously privacy-corrected candidate and tested disposable copy. No runtime behavior changed. No new browser session or model evaluation was run.
- The saved packet remains DRAFT, M-01 OPEN, reviewer unrecorded. No historical simulation reviewer was transferred.
- MIT is locally applied under the owner's explicit approval. The source inventory is now **53 files**, including LICENSE; SHA256SUMS lists 52 payload files and excludes itself. All 39 prior source-provenance rows remain valid. Tests' scratch files, private receipts/guards, Git metadata and media are excluded from the ZIP.
- Selected separate demo: `handoff-auditor-caption-led-180s.mp4`, SHA-256 `c495596c4d89041f0e309b1ae35f7dc2fbf9610e9e50f7b87d67b7705efc64e1`. Its previously verified 180-second/no-audio edition was adopted without changing any media bytes. Previous full decoding, caption and sampled visual-review results apply to this identical file; media was not regenerated.

For that finalization stage, the SHA256SUMS manifest, staged blobs and reviewed source ZIP were required to agree exactly. The private finalization evidence records the exact ZIP hash, before/after hashes, scan results and preservation checks. The targeted privacy/provenance review was not a comprehensive security or ownership audit. No publication, deployment, agreement acceptance, organizer message or submission occurred **during that local finalization**.

## Current publication and submission status - November 3, 2026

The [repository](https://github.com/qneolabs/handoff-auditor) is public under MIT, Copyright (c) 2026 Krishna Thapa (Qneolabs). Cerebral Valley's submission email confirms **Qneolabs Handoff Auditor, entry #761**. The selected [demo](https://youtu.be/GFu-Zam6310) is Unlisted, caption-led and silent, with no live inference. Two historical Meta attempts produced one usable saved result. ChatGPT and Codex were the development tools.

Submission confirmation is not organizer eligibility approval or independently verified waiver acceptance. The saved Meta packet remains DRAFT, M-01 OPEN, reviewer unrecorded.

## Documentation update verification - November 3, 2026

The current-status correction is based on original public commit `930cc65704a1428ddb5c36b6f7fdfffab84c46e7`. It changes the six approved top-level documents and their directly affected provenance/checksum records. The original commit, earlier archives and private evidence/authorization guards are preserved.

- A fresh offline run passed **34 app tests and 78 runtime fixture tests**, zero failures, using Node.js v25.1.0 in a disposable copy. HTTP/socket/DNS/HTTP2 operations were blocked and credential environment variables excluded. The suites share 29 core checks; these are software checks, not 112 independent model evaluations. No browser session or new model evaluation was run.
- All application/runtime files, test files, saved replay artifacts, package configuration and LICENSE remain byte-identical to the original public commit. The saved packet remains **DRAFT / M-01 OPEN / reviewer unrecorded**. The two historical real attempts and one usable saved result are unchanged.
- The source inventory remains **53 files**. SHA256SUMS covers all **52 payload files** and excludes itself; all 39 original source-provenance rows remain valid. The rebuilt source archive contains those 53 tracked files only, excluding Git metadata, test scratch files, private evidence/guards and media. Its CRC and all payload hashes are verified against the reviewed source and staged blobs before publication.

The updated archive and detailed verification receipts are kept separately from the original archive. This correction does not repeat the historical real-ID private check or the earlier video decoding/browser checks; their records retain their original scope. It makes no Meta request, changes no application behavior and does not claim organizer eligibility approval or independently verified waiver acceptance.
