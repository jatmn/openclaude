import { defineVendor } from '../define.js'

export default defineVendor({
  id: 'anthropic',
  label: 'Anthropic',
  classification: 'anthropic',
  defaultBaseUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
  defaultModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
  requiredEnvVars: ['ANTHROPIC_API_KEY'],
  setup: {
    requiresAuth: true,
    authMode: 'api-key',
    credentialEnvVars: ['ANTHROPIC_API_KEY'],
  },
  transportConfig: {
    kind: 'anthropic-native',
  },
  preset: {
    id: 'anthropic',
    description: 'Native Claude API (x-api-key auth)',
    apiKeyEnvVars: ['ANTHROPIC_API_KEY'],
    baseUrlEnvVars: ['ANTHROPIC_BASE_URL'],
    modelEnvVars: ['ANTHROPIC_MODEL'],
  },
  isFirstParty: true,
  usage: { supported: true },
})
