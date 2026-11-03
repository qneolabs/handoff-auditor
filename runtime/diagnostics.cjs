'use strict';
const M = require('./meta-contract.cjs');
const count = n => Number.isSafeInteger(n) && n >= 0 ? n : null;
const token = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(value) ? value : null;
const known = (value, values) => values.includes(value) ? value : value == null ? null : 'unrecognized';
function scrub(value, secret) {
  if (typeof value === 'string') return typeof secret === 'string' && secret.length ? value.split(secret).join('[REDACTED]') : value;
  if (Array.isArray(value)) return value.map(v => scrub(v, secret));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v, secret)]));
  return value;
}

function responseDiagnostics(response, { configuredOutputTokens = M.MAX_OUTPUT_TOKENS, transport = null, secret = null } = {}) {
  const rawUsage = response?.usage;
  const input = count(rawUsage?.input_tokens), output = count(rawUsage?.output_tokens), reasoning = count(rawUsage?.output_tokens_details?.reasoning_tokens);
  const cached = count(rawUsage?.input_tokens_details?.cached_tokens), total = count(rawUsage?.total_tokens);
  const warnings = [];
  if (reasoning === null) warnings.push('Reasoning-token breakdown was not reported or retained; do not infer it from missing visible output.');
  if (output !== null && reasoning !== null && reasoning > output) warnings.push('Reported reasoning tokens exceed total output tokens.');
  if (input !== null && cached !== null && cached > input) warnings.push('Reported cached tokens exceed input tokens.');
  if (input !== null && output !== null && total !== null && input + output !== total) warnings.push('Reported total tokens do not equal input plus output.');
  if (output !== null && output > configuredOutputTokens) warnings.push('Provider output usage exceeds the configured allowance; stop and inspect billing before any further request.');
  const statuses = ['completed', 'incomplete', 'failed', 'cancelled', 'in_progress', 'queued'];
  const status = known(response?.status, statuses);
  const detailsPresent = response != null && Object.hasOwn(response, 'incomplete_details') && response.incomplete_details !== null;
  const reason = token(response?.incomplete_details?.reason);
  if (status === 'incomplete' && !reason) warnings.push('The provider stop reason was not reported or retained.');
  const outputItems = Array.isArray(response?.output) ? response.output : [];
  const itemTypes = {}, itemStatuses = {};
  let visibleCharacters = 0, visibleTextItems = 0, refusalItems = 0;
  for (const item of outputItems) {
    const type = known(item?.type, ['message', 'reasoning', 'function_call', 'web_search_call', 'image_generation_call']) || 'unrecognized';
    itemTypes[type] = (itemTypes[type] || 0) + 1;
    const itemStatus = known(item?.status, statuses) || 'not-reported';
    itemStatuses[itemStatus] = (itemStatuses[itemStatus] || 0) + 1;
    if (type !== 'message' || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content?.type === 'output_text' && typeof content.text === 'string') { visibleCharacters += content.text.length; visibleTextItems++; }
      if (content?.type === 'refusal') refusalItems++;
    }
  }
  const exhausted = output === null ? null : output >= configuredOutputTokens;
  let category = 'response-awaiting-validation';
  if (transport?.failureCode) category = transport.failureCode;
  else if (!response) category = 'no-provider-response';
  else if (status === 'incomplete' && reason === 'max_output_tokens') category = 'provider-confirmed-output-limit';
  else if (status === 'incomplete' && exhausted && !reason) category = 'output-limit-consistent-but-stop-reason-unknown';
  else if (status === 'incomplete') category = 'provider-incomplete';
  else if (status === 'failed' || response.error) category = 'provider-failed';
  else if (refusalItems) category = 'provider-refusal';
  else if (status === 'completed' && visibleCharacters === 0) category = 'completed-without-visible-answer';
  const result = {
    schemaVersion: 1,
    responseReceived: response != null,
    responseId: token(response?.id), modelReported: token(response?.model), responseStatus: status,
    configuredMaxOutputTokens: configuredOutputTokens, providerReportedMaxOutputTokens: count(response?.max_output_tokens),
    incompleteDetails: { present: detailsPresent, reason, reasonValuePresentButNotRetained: detailsPresent && response.incomplete_details?.reason != null && !reason },
    providerError: { present: !!response?.error, code: token(response?.error?.code), type: token(response?.error?.type) },
    usage: {
      inputTokens: input, outputTokens: output, totalTokens: total, cachedInputTokens: cached, reasoningTokens: reasoning,
      nonReasoningOutputTokens: output !== null && reasoning !== null && reasoning <= output ? output - reasoning : null,
      outputAllowanceExhausted: exhausted
    },
    outputSummary: { totalItems: outputItems.length, itemTypes, itemStatuses, visibleTextItems, visibleTextCharacters: visibleCharacters, refusalItems },
    classification: category,
    warnings,
    validationBoundary: 'Provider diagnostics describe execution, not semantic accuracy. Missing diagnostic fields remain unknown.'
  };
  return scrub(result, secret);
}

function responseEvidence(response, options = {}) {
  const visibleOutput = [];
  for (const item of Array.isArray(response?.output) ? response.output : []) {
    if (item?.type !== 'message') continue;
    const content = [];
    for (const c of Array.isArray(item.content) ? item.content : []) {
      // Explicit field copying excludes annotations, embedded credentials and opaque reasoning.
      if (c?.type === 'output_text' && typeof c.text === 'string') content.push({ type: 'output_text', text: c.text });
      if (c?.type === 'refusal' && typeof c.refusal === 'string') content.push({ type: 'refusal', refusal: c.refusal });
    }
    visibleOutput.push({ type: 'message', role: known(item.role, ['assistant']), status: known(item.status, ['completed', 'incomplete', 'failed']), content });
  }
  return scrub({ diagnostics: responseDiagnostics(response, options), visibleOutput }, options.secret);
}

function diagnosticMarkdown(d) {
  const n = value => value === null || value === undefined ? 'Not reported' : String(value);
  return [
    '## Execution diagnostics', '',
    `Provider status: ${n(d.responseStatus)}`,
    `Classification: ${d.classification}`,
    `Provider stop reason: ${n(d.incompleteDetails.reason)}`,
    `Configured output allowance: ${d.configuredMaxOutputTokens}`,
    `Reported input / output tokens: ${n(d.usage.inputTokens)} / ${n(d.usage.outputTokens)}`,
    `Reported reasoning tokens: ${n(d.usage.reasoningTokens)}`,
    `Other output tokens: ${n(d.usage.nonReasoningOutputTokens)} (not a count of visible text alone)`,
    `Visible answer characters: ${d.outputSummary.visibleTextCharacters}`,
    ...d.warnings.map(w => `- ${w}`), '', d.validationBoundary, ''
  ].join('\n');
}

module.exports = { count, token, scrub, responseDiagnostics, responseEvidence, diagnosticMarkdown };
