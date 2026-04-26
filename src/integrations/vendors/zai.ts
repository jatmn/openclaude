import { defineVendor } from '../define.js'

export default defineVendor({
  id: 'zai',
  label: 'Z.AI',
  classification: 'openai-compatible',
  defaultBaseUrl: 'https://api.z.ai/api/coding/paas/v4',
  defaultModel: ['GLM-5.1', 'GLM-5-Turbo', 'GLM-4.7', 'GLM-4.5-Air'],
  requiredEnvVars: ['OPENAI_API_KEY'],
  setup: {
    requiresAuth: true,
    authMode: 'api-key',
    credentialEnvVars: ['OPENAI_API_KEY'],
  },
  transportConfig: {
    kind: 'openai-compatible',
    openaiShim: {
      preserveReasoningContent: true,
      requireReasoningContentOnAssistantMessages: true,
      reasoningContentFallback: '',
      thinkingRequestFormat: 'deepseek-compatible',
      maxTokensField: 'max_tokens',
      removeBodyFields: ['store'],
    },
  },
  validation: {
    kind: 'credential-env',
    routing: {
      matchDefaultBaseUrl: true,
      matchBaseUrlHosts: ['api.z.ai'],
    },
    credentialEnvVars: ['OPENAI_API_KEY'],
    missingCredentialMessage:
      'OPENAI_API_KEY is required for Z.AI GLM Coding Plan.',
  },
  catalog: {
    source: 'static',
    models: [
      { id: 'GLM-5.1', apiName: 'GLM-5.1', label: 'GLM-5.1', default: true },
      { id: 'GLM-5-Turbo', apiName: 'GLM-5-Turbo', label: 'GLM-5-Turbo' },
      { id: 'GLM-4.7', apiName: 'GLM-4.7', label: 'GLM-4.7' },
      { id: 'GLM-4.5-Air', apiName: 'GLM-4.5-Air', label: 'GLM-4.5-Air' },
    ],
  },
  usage: { supported: false },
})
