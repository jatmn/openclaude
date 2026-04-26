import { defineGateway } from '../define.js'

export default defineGateway({
  id: 'azure-openai',
  label: 'Azure OpenAI',
  category: 'hosted',
  defaultBaseUrl: 'https://YOUR-RESOURCE-NAME.openai.azure.com/openai/v1',
  supportsModelRouting: false,
  setup: {
    requiresAuth: true,
    authMode: 'api-key',
    credentialEnvVars: ['AZURE_OPENAI_API_KEY'],
  },
  transportConfig: {
    kind: 'openai-compatible',
    openaiShim: {
      supportsUserCustomHeaders: true,
    },
  },
  preset: {
    id: 'azure-openai',
    description: 'Azure OpenAI endpoint (model=deployment name)',
    apiKeyEnvVars: ['AZURE_OPENAI_API_KEY'],
    vendorId: 'openai',
  },
  catalog: {
    source: 'static',
    models: [
      { id: 'azure-deployment', apiName: 'YOUR-DEPLOYMENT-NAME', label: 'Azure Deployment', default: true },
    ],
  },
  usage: { supported: false },
})
