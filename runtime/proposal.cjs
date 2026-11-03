'use strict';
const M = require('./meta-contract.cjs');
const F = require('./fixtures.cjs');
const { DEFAULT_TIMEOUT_MS } = require('./meta-transport.cjs');

function proposal() {
  const prepared = M.prepareRequest(F.semanticPack());
  const rates = { inputUsdPerMillion: 1.25, outputUsdPerMillion: 4.25, lastVerifiedAtUtc: '2026-11-02T21:40:21.594Z', source: 'https://dev.meta.ai/docs/pricing-rate-limits', status: 'historical-reference-not-rechecked-in-this-local-revision' };
  const inputTokenAllowance = 8192;
  return {
    revision: 2, authorizationStatus: 'not-authorized-for-live-use', authorizedModelRequests: 0,
    // Retain only SHA-256 fingerprints of both consumed local authorizations.
    consumedAuthorizationIdSha256: [
      '913791e7313139dec69ff73606a99bcbed903f3eae85965438a250f361f09b35',
      'e02481f50c319f835e34bf79783e39b4bceeb8b7ced4fcf36b17effe5b810e34',
    ], priorAuthorizationConsumed: true,
    endpoint: prepared.endpoint, model: M.MODEL, maxOutputTokens: M.MAX_OUTPUT_TOKENS,
    timeoutMs: DEFAULT_TIMEOUT_MS, retries: 0, inputTokenAllowance,
    planningCostUsdAtHistoricalRates: (inputTokenAllowance * rates.inputUsdPerMillion + M.MAX_OUTPUT_TOKENS * rates.outputUsdPerMillion) / 1000000,
    pricing: rates, futurePricingVerificationRequired: true,
    requestBodyBytes: Buffer.byteLength(JSON.stringify(prepared.body)), inputSha256: prepared.inputSha256, requestSha256: prepared.requestSha256,
    explanation: 'The original synthetic input and prompt are unchanged. Only the request output allowance changes. The client wait increases to accommodate that allowance. This proposal is not a renewed spending authorization.'
  };
}

module.exports = { proposal };
