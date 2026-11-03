'use strict';
window.AuditorRecordingData = {
  "schemaVersion": 1,
  "provenance": "recorded-meta-response-offline-replay",
  "packetJson": "{\r\n  \"schemaVersion\": 1,\r\n  \"title\": \"Handoff Auditor — Continuation Packet\",\r\n  \"mode\": \"meta-live\",\r\n  \"reviewStatus\": \"draft\",\r\n  \"reviewer\": null,\r\n  \"project\": {\r\n    \"id\": \"demo-semantic\",\r\n    \"name\": \"Synthetic acceptance contradiction\",\r\n    \"synthetic\": true\r\n  },\r\n  \"limitation\": \"Meta output contains untrusted proposals, not verified facts. Structured claim checks evaluate supplied declarations only. Exact quotes and valid source IDs do not prove semantic entailment, authenticity, freshness or permission. Human review never establishes production acceptance. All original claims, evidence gaps and decisions remain visible.\",\r\n  \"handoff\": {\r\n    \"title\": \"A deliberately bounded handoff\",\r\n    \"claims\": [\r\n      {\r\n        \"id\": \"C-01\",\r\n        \"text\": \"The owner has accepted this project for live use.\",\r\n        \"stage\": \"accepted\",\r\n        \"evidenceIds\": [\r\n          \"E-01\"\r\n        ]\r\n      }\r\n    ]\r\n  },\r\n  \"claimChecks\": [\r\n    {\r\n      \"claimId\": \"C-01\",\r\n      \"claimedStage\": \"accepted\",\r\n      \"status\": \"matching-record\",\r\n      \"supportingEvidenceIds\": [\r\n        \"E-01\"\r\n      ],\r\n      \"missingEvidenceIds\": [],\r\n      \"note\": \"A matching declared record is present; its authenticity and truth have not been independently verified.\"\r\n    }\r\n  ],\r\n  \"findings\": [\r\n    {\r\n      \"id\": \"M-01\",\r\n      \"type\": \"semantic-contradiction\",\r\n      \"severity\": \"high\",\r\n      \"title\": \"Claimed live acceptance contradicted by evidence prose\",\r\n      \"summary\": \"Claim C-01 asserts live owner acceptance, but E-01 prose contradicts it. Quote 'Owner approval is still pending.' shows approval has not been given. Quote 'live acceptance has not occurred.' directly denies the claimed live use acceptance. The record kind 'acceptance' does not override the prose.\",\r\n      \"recommendation\": \"Have a human verify actual owner acceptance status and obtain a corrected acceptance record if needed; do not treat the kind label or reviewer name as proof of acceptance.\",\r\n      \"claimIds\": [\r\n        \"C-01\"\r\n      ],\r\n      \"decisionIds\": [],\r\n      \"citations\": [\r\n        {\r\n          \"evidenceId\": \"E-01\",\r\n          \"quote\": \"Owner approval is still pending.\"\r\n        },\r\n        {\r\n          \"evidenceId\": \"E-01\",\r\n          \"quote\": \"live acceptance has not occurred.\"\r\n        }\r\n      ],\r\n      \"origin\": \"meta-model-proposal\",\r\n      \"review\": {\r\n        \"disposition\": \"open\",\r\n        \"note\": \"\"\r\n      }\r\n    }\r\n  ],\r\n  \"rejectedProposals\": [],\r\n  \"evidence\": [\r\n    {\r\n      \"id\": \"E-01\",\r\n      \"projectId\": \"demo-semantic\",\r\n      \"title\": \"Mislabelled acceptance record\",\r\n      \"kind\": \"acceptance\",\r\n      \"reviewer\": \"Synthetic owner\",\r\n      \"text\": \"Owner approval is still pending. The local checks passed, but live acceptance has not occurred.\",\r\n      \"verifies\": [\r\n        \"C-01\"\r\n      ]\r\n    }\r\n  ],\r\n  \"decisions\": [],\r\n  \"continuation\": {\r\n    \"unresolvedFindingIds\": [\r\n      \"M-01\"\r\n    ],\r\n    \"acknowledgedFindingIds\": [],\r\n    \"nextAction\": \"Review unresolved findings and rejected citations before relying on this packet.\",\r\n    \"acceptance\": \"This tool does not assert release readiness or production acceptance.\"\r\n  },\r\n  \"integration\": {\r\n    \"provider\": \"Meta\",\r\n    \"configuredModel\": \"muse-spark-1.3\",\r\n    \"endpoint\": \"https://api.meta.ai/v1/responses\",\r\n    \"mode\": \"meta-live\",\r\n    \"modelStatus\": \"completed\",\r\n    \"modelRequestsAttempted\": 1,\r\n    \"responseProvenance\": \"provider-response\",\r\n    \"promptVersion\": \"handoff-auditor-v1\",\r\n    \"inputSha256\": \"5a0e316be11b63ae3611e7340e43b24cc8749e4c8bd1a20b51ba25001f513122\",\r\n    \"requestSha256\": \"72cfcb474692f9f88106b3945d8dd70055880062d38ecf124567bd5b12344755\",\r\n    \"transportDiagnostics\": {\r\n      \"requestAttempted\": true,\r\n      \"httpStatus\": 200,\r\n      \"requestId\": \"redacted-for-public-review\",\r\n      \"timeoutMs\": 60000,\r\n      \"elapsedMs\": 21291,\r\n      \"responseBytes\": 25545,\r\n      \"failureCode\": null,\r\n      \"providerErrorCode\": null,\r\n      \"providerErrorType\": null\r\n    },\r\n    \"sourceValidation\": \"Reference membership and verbatim quotations only; semantic entailment and authenticity require human review.\"\r\n  },\r\n  \"diagnostics\": {\r\n    \"schemaVersion\": 1,\r\n    \"responseReceived\": true,\r\n    \"responseId\": \"redacted-for-public-review\",\r\n    \"modelReported\": \"muse-spark-1.3\",\r\n    \"responseStatus\": \"completed\",\r\n    \"configuredMaxOutputTokens\": 8192,\r\n    \"providerReportedMaxOutputTokens\": 8192,\r\n    \"incompleteDetails\": {\r\n      \"present\": false,\r\n      \"reason\": null,\r\n      \"reasonValuePresentButNotRetained\": false\r\n    },\r\n    \"providerError\": {\r\n      \"present\": false,\r\n      \"code\": null,\r\n      \"type\": null\r\n    },\r\n    \"usage\": {\r\n      \"inputTokens\": 537,\r\n      \"outputTokens\": 2268,\r\n      \"totalTokens\": 2805,\r\n      \"cachedInputTokens\": 0,\r\n      \"reasoningTokens\": 2027,\r\n      \"nonReasoningOutputTokens\": 241,\r\n      \"outputAllowanceExhausted\": false\r\n    },\r\n    \"outputSummary\": {\r\n      \"totalItems\": 2,\r\n      \"itemTypes\": {\r\n        \"reasoning\": 1,\r\n        \"message\": 1\r\n      },\r\n      \"itemStatuses\": {\r\n        \"completed\": 2\r\n      },\r\n      \"visibleTextItems\": 1,\r\n      \"visibleTextCharacters\": 953,\r\n      \"refusalItems\": 0\r\n    },\r\n    \"classification\": \"response-awaiting-validation\",\r\n    \"warnings\": [],\r\n    \"validationBoundary\": \"Provider diagnostics describe execution, not semantic accuracy. Missing diagnostic fields remain unknown.\"\r\n  }\r\n}\r\n",
  "packetMarkdown": "# Handoff Auditor — Continuation Packet\n\nProject: Synthetic acceptance contradiction (demo-semantic)\nReview: **DRAFT**\nReviewer: Not recorded\n\n> META MODEL PROPOSALS — HUMAN REVIEW REQUIRED\n\nMeta output contains untrusted proposals, not verified facts. Structured claim checks evaluate supplied declarations only. Exact quotes and valid source IDs do not prove semantic entailment, authenticity, freshness or permission. Human review never establishes production acceptance. All original claims, evidence gaps and decisions remain visible.\n\n## Original handoff claims\n\n- C-01 — The owner has accepted this project for live use\\. | Claimed: accepted | Check: matching-record\n  - A matching declared record is present; its authenticity and truth have not been independently verified\\.\n\n## Findings and human review\n\n### M-01: Claimed live acceptance contradicted by evidence prose\nDisposition: **open**\n\nClaim C-01 asserts live owner acceptance, but E-01 prose contradicts it\\. Quote 'Owner approval is still pending\\.' shows approval has not been given\\. Quote 'live acceptance has not occurred\\.' directly denies the claimed live use acceptance\\. The record kind 'acceptance' does not override the prose\\.\n\nNext: Have a human verify actual owner acceptance status and obtain a corrected acceptance record if needed; do not treat the kind label or reviewer name as proof of acceptance\\.\n\nSource: [E-01](#source-1)\n> Owner approval is still pending\\.\n\nSource: [E-01](#source-1)\n> live acceptance has not occurred\\.\n\n## Source register\n\n### Source 1\n**E-01 — Mislabelled acceptance record**\nKind: acceptance | Project: demo-semantic\n\n> Owner approval is still pending\\. The local checks passed, but live acceptance has not occurred\\.\n\n## Decision register\n\n\n## Continue from here\n\nReview unresolved findings and rejected citations before relying on this packet.\n\nThis tool does not assert release readiness or production acceptance.\n\n## Integration record\n\nConfigured model: muse-spark-1.3\nResponse processing: completed\nResponse provenance: provider-response\nModel requests attempted: 1\nInput SHA-256: 5a0e316be11b63ae3611e7340e43b24cc8749e4c8bd1a20b51ba25001f513122\nPrompt: handoff-auditor-v1\n\nFinding origins:\n- M-01: meta-model-proposal\n\n\n## Execution diagnostics\n\nProvider status: completed\nClassification: response-awaiting-validation\nProvider stop reason: Not reported\nConfigured output allowance: 8192\nReported input / output tokens: 537 / 2268\nReported reasoning tokens: 2027\nOther output tokens: 241 (not a count of visible text alone)\nVisible answer characters: 953\n\nProvider diagnostics describe execution, not semantic accuracy. Missing diagnostic fields remain unknown.\n",
  "receipt": {
    "revision": 2,
    "authorizationId": "redacted-for-public-review",
    "startedAtUtc": "2026-11-02T22:26:17.545Z",
    "finishedAtUtc": "2026-11-02T22:26:38.845Z",
    "state": "attempt-complete-no-retries",
    "modelRequestsAttempted": 1,
    "retries": 0,
    "requestSha256": "72cfcb474692f9f88106b3945d8dd70055880062d38ecf124567bd5b12344755",
    "inputSha256": "5a0e316be11b63ae3611e7340e43b24cc8749e4c8bd1a20b51ba25001f513122",
    "transport": {
      "requestAttempted": true,
      "httpStatus": 200,
      "requestId": "redacted-for-public-review",
      "timeoutMs": 60000,
      "elapsedMs": 21291,
      "responseBytes": 25545,
      "failureCode": null,
      "providerErrorCode": null,
      "providerErrorType": null
    },
    "diagnostics": {
      "schemaVersion": 1,
      "responseReceived": true,
      "responseId": "redacted-for-public-review",
      "modelReported": "muse-spark-1.3",
      "responseStatus": "completed",
      "configuredMaxOutputTokens": 8192,
      "providerReportedMaxOutputTokens": 8192,
      "incompleteDetails": {
        "present": false,
        "reason": null,
        "reasonValuePresentButNotRetained": false
      },
      "providerError": {
        "present": false,
        "code": null,
        "type": null
      },
      "usage": {
        "inputTokens": 537,
        "outputTokens": 2268,
        "totalTokens": 2805,
        "cachedInputTokens": 0,
        "reasoningTokens": 2027,
        "nonReasoningOutputTokens": 241,
        "outputAllowanceExhausted": false
      },
      "outputSummary": {
        "totalItems": 2,
        "itemTypes": {
          "reasoning": 1,
          "message": 1
        },
        "itemStatuses": {
          "completed": 2
        },
        "visibleTextItems": 1,
        "visibleTextCharacters": 953,
        "refusalItems": 0
      },
      "classification": "response-awaiting-validation",
      "warnings": [],
      "validationBoundary": "Provider diagnostics describe execution, not semantic accuracy. Missing diagnostic fields remain unknown."
    },
    "modelProcessingStatus": "completed",
    "modelStepError": null,
    "validationErrors": [],
    "acceptedFindings": 1,
    "packetReviewStatus": "draft",
    "usageCostUsdAtUncachedRates": 0.01031025,
    "approvedMaxSpendUsd": 0.1,
    "billingCheck": "within-token-cost-ceiling",
    "costNote": "Based on provider-reported token totals at the separately verified rates; not a final billing receipt. Reasoning tokens are a subset of output and are not added twice.",
    "nextAction": "Review this result. Keep the one-attempt lock. Do not retry without another specific authorization."
  },
  "responseEvidence": {
    "transport": {
      "requestAttempted": true,
      "httpStatus": 200,
      "requestId": "redacted-for-public-review",
      "timeoutMs": 60000,
      "elapsedMs": 21291,
      "responseBytes": 25545,
      "failureCode": null,
      "providerErrorCode": null,
      "providerErrorType": null
    },
    "diagnostics": {
      "schemaVersion": 1,
      "responseReceived": true,
      "responseId": "redacted-for-public-review",
      "modelReported": "muse-spark-1.3",
      "responseStatus": "completed",
      "configuredMaxOutputTokens": 8192,
      "providerReportedMaxOutputTokens": 8192,
      "incompleteDetails": {
        "present": false,
        "reason": null,
        "reasonValuePresentButNotRetained": false
      },
      "providerError": {
        "present": false,
        "code": null,
        "type": null
      },
      "usage": {
        "inputTokens": 537,
        "outputTokens": 2268,
        "totalTokens": 2805,
        "cachedInputTokens": 0,
        "reasoningTokens": 2027,
        "nonReasoningOutputTokens": 241,
        "outputAllowanceExhausted": false
      },
      "outputSummary": {
        "totalItems": 2,
        "itemTypes": {
          "reasoning": 1,
          "message": 1
        },
        "itemStatuses": {
          "completed": 2
        },
        "visibleTextItems": 1,
        "visibleTextCharacters": 953,
        "refusalItems": 0
      },
      "classification": "response-awaiting-validation",
      "warnings": [],
      "validationBoundary": "Provider diagnostics describe execution, not semantic accuracy. Missing diagnostic fields remain unknown."
    },
    "visibleOutput": [
      {
        "type": "message",
        "role": "assistant",
        "status": "completed",
        "content": [
          {
            "type": "output_text",
            "text": "{\"schemaVersion\":1,\"projectId\":\"demo-semantic\",\"inputSha256\":\"5a0e316be11b63ae3611e7340e43b24cc8749e4c8bd1a20b51ba25001f513122\",\"findings\":[{\"id\":\"M-01\",\"type\":\"semantic-contradiction\",\"severity\":\"high\",\"title\":\"Claimed live acceptance contradicted by evidence prose\",\"summary\":\"Claim C-01 asserts live owner acceptance, but E-01 prose contradicts it. Quote 'Owner approval is still pending.' shows approval has not been given. Quote 'live acceptance has not occurred.' directly denies the claimed live use acceptance. The record kind 'acceptance' does not override the prose.\",\"recommendation\":\"Have a human verify actual owner acceptance status and obtain a corrected acceptance record if needed; do not treat the kind label or reviewer name as proof of acceptance.\",\"claimIds\":[\"C-01\"],\"decisionIds\":[],\"citations\":[{\"evidenceId\":\"E-01\",\"quote\":\"Owner approval is still pending.\"},{\"evidenceId\":\"E-01\",\"quote\":\"live acceptance has not occurred.\"}]}]}"
          }
        ]
      }
    ]
  },
  "sourceHashes": {
    "continuation-packet.json": "34ed0ea5d90e68d57bb0bab5f026e949e488cbecd84e98399e40a52f963ed235",
    "continuation-packet.md": "b92aa132a4a5505f51c02fb7c629b205b0dc60f31ec11df521fa767ecb7f6db2",
    "preflight.json": "bacb989d810411216e92cbcdacd643b0bbb06723bed87bba0ea84c89aecc7822",
    "response-evidence.json": "7b52df2ea034a03d82ee6b4a5e45c58443cbeaf83f02f8a2a660cf4617d82cf7",
    "result-receipt.json": "1ce63f30f0933c42ece7cb3e6f84b9e65a478bd218da295ed4f761711f3cd357"
  }
};
