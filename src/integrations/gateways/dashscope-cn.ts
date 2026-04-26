import { defineGateway } from '../define.js'

export default defineGateway({
  id: 'dashscope-cn',
  label: 'Alibaba Coding Plan (China)',
  category: 'hosted',
  defaultBaseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
  supportsModelRouting: true,
  setup: {
    requiresAuth: true,
    authMode: 'api-key',
    credentialEnvVars: ['DASHSCOPE_API_KEY'],
  },
  transportConfig: {
    kind: 'openai-compatible',
    openaiShim: {
      supportsUserCustomHeaders: true,
    },
  },
  preset: {
    id: 'dashscope-cn',
    description: 'Alibaba DashScope China endpoint',
    apiKeyEnvVars: ['DASHSCOPE_API_KEY'],
    vendorId: 'openai',
  },
  catalog: {
    source: 'static',
    models: [
      { id: 'qwen-cn-3.6-plus', apiName: 'qwen3.6-plus', label: 'Qwen 3.6 Plus', default: true },
    ],
  },
  usage: { supported: false },
})
