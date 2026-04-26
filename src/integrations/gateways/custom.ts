import { defineGateway } from '../define.js'

export default defineGateway({
  id: 'custom',
  label: 'Custom OpenAI-compatible',
  category: 'hosted',
  defaultModel: 'llama3.1:8b',
  supportsModelRouting: true,
  setup: {
    requiresAuth: false,
    authMode: 'api-key',
  },
  transportConfig: {
    kind: 'openai-compatible',
    openaiShim: {
      supportsUserCustomHeaders: true,
    },
  },
  catalog: {
    source: 'static',
    models: [],
  },
  usage: { supported: false },
})
