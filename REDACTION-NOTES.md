# Sharing-copy redactions

Provider request IDs, response IDs and local authorization IDs are replaced with a redaction marker in the saved JSON artifacts and bundled replay data. Original artifacts remain unchanged in the private local project. This copy is not byte-identical to those originals, and the app says so.

A subsequent publication audit found the first consumed authorization ID still present as plaintext in runtime/proposal.cjs. The sharing runtime now retains only SHA-256 fingerprints for both consumed authorization IDs, allowing the runner to reject either original ID without including its plaintext. These digests are intentionally retained denylist data, not credentials or authorization grants, and do not guarantee anonymity for a guessed ID. Missing, incomplete, duplicate or malformed denylist data is rejected before any attempt. The existing exclusive one-attempt lock, no-retry behavior and original private guards are unchanged.

The synthetic claims, exact evidence text, decisions, model finding, suggested follow-up, draft status, open disposition and absent reviewer are unchanged. Request/input hashes, historical usage and cost calculations remain for reproducibility. They are not keys or new pricing estimates.

Hashes in the replay bundle identify these included sharing artifacts. No new model output was generated. No license is applied and no publication or submission has occurred.
