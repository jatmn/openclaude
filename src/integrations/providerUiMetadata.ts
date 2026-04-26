import type { AuthMode } from './descriptors.js'
import { routeForPreset } from './compatibility.js'
import {
  getRouteDefaultBaseUrl,
  getRouteDefaultModel,
  getRouteDescriptor,
  getRouteLabel,
  routeSupportsCustomHeaders,
} from './routeMetadata.js'
import type { ProviderPreset } from '../utils/providerProfiles.js'

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434/v1'
const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b'

export const ORDERED_PROVIDER_PRESETS: ProviderPreset[] = [
  'dashscope-intl',
  'dashscope-cn',
  'anthropic',
  'atomic-chat',
  'azure-openai',
  'bankr',
  'deepseek',
  'gemini',
  'groq',
  'lmstudio',
  'minimax',
  'mistral',
  'moonshotai',
  'kimi-code',
  'nvidia-nim',
  'ollama',
  'openai',
  'openrouter',
  'together',
  'zai',
  'custom',
]

type PresetUiOverride = {
  apiKeyEnvVars?: string[]
  baseUrlEnvVars?: string[]
  description: string
  fallbackBaseUrl?: string
  fallbackModel?: string
  label?: string
  modelEnvVars?: string[]
  name?: string
}

const PRESET_UI_OVERRIDES: Record<ProviderPreset, PresetUiOverride> = {
  anthropic: {
    apiKeyEnvVars: ['ANTHROPIC_API_KEY'],
    baseUrlEnvVars: ['ANTHROPIC_BASE_URL'],
    description: 'Native Claude API (x-api-key auth)',
    modelEnvVars: ['ANTHROPIC_MODEL'],
  },
  ollama: {
    description: 'Local or remote Ollama endpoint',
    fallbackBaseUrl: DEFAULT_OLLAMA_BASE_URL,
    fallbackModel: DEFAULT_OLLAMA_MODEL,
    modelEnvVars: ['OPENAI_MODEL'],
  },
  openai: {
    apiKeyEnvVars: ['OPENAI_API_KEY'],
    description: 'OpenAI API with API key',
  },
  'kimi-code': {
    apiKeyEnvVars: ['KIMI_API_KEY'],
    description: 'Moonshot AI - Kimi Code Subscription endpoint',
  },
  moonshotai: {
    apiKeyEnvVars: ['MOONSHOT_API_KEY'],
    description: 'Moonshot AI - API endpoint',
    label: 'Moonshot AI - API',
    name: 'Moonshot AI - API',
  },
  deepseek: {
    apiKeyEnvVars: ['DEEPSEEK_API_KEY'],
    description: 'DeepSeek OpenAI-compatible endpoint',
  },
  gemini: {
    apiKeyEnvVars: ['GEMINI_API_KEY'],
    description: 'Gemini OpenAI-compatible endpoint',
  },
  mistral: {
    apiKeyEnvVars: ['MISTRAL_API_KEY'],
    description: 'Mistral OpenAI-compatible endpoint',
  },
  together: {
    apiKeyEnvVars: ['TOGETHER_API_KEY'],
    description: 'Together chat/completions endpoint',
  },
  groq: {
    apiKeyEnvVars: ['GROQ_API_KEY'],
    description: 'Groq OpenAI-compatible endpoint',
  },
  'azure-openai': {
    apiKeyEnvVars: ['AZURE_OPENAI_API_KEY'],
    description: 'Azure OpenAI endpoint (model=deployment name)',
  },
  openrouter: {
    apiKeyEnvVars: ['OPENROUTER_API_KEY'],
    description: 'OpenRouter OpenAI-compatible endpoint',
  },
  lmstudio: {
    description: 'Local LM Studio endpoint',
    fallbackModel: 'local-model',
    modelEnvVars: ['OPENAI_MODEL'],
  },
  'dashscope-cn': {
    apiKeyEnvVars: ['DASHSCOPE_API_KEY'],
    description: 'Alibaba DashScope China endpoint',
  },
  'dashscope-intl': {
    apiKeyEnvVars: ['DASHSCOPE_API_KEY'],
    description: 'Alibaba DashScope International endpoint',
  },
  custom: {
    apiKeyEnvVars: ['OPENAI_API_KEY'],
    baseUrlEnvVars: ['OPENAI_BASE_URL', 'OPENAI_API_BASE'],
    description: 'Any OpenAI-compatible provider',
    fallbackBaseUrl: DEFAULT_OLLAMA_BASE_URL,
    fallbackModel: DEFAULT_OLLAMA_MODEL,
    label: 'Custom',
    modelEnvVars: ['OPENAI_MODEL'],
    name: 'Custom OpenAI-compatible',
  },
  'nvidia-nim': {
    apiKeyEnvVars: ['NVIDIA_API_KEY'],
    description: 'NVIDIA NIM endpoint',
  },
  minimax: {
    apiKeyEnvVars: ['MINIMAX_API_KEY'],
    description: 'MiniMax API endpoint',
  },
  bankr: {
    apiKeyEnvVars: ['BNKR_API_KEY'],
    description: 'Bankr LLM Gateway (OpenAI-compatible)',
    modelEnvVars: ['BANKR_MODEL', 'OPENAI_MODEL'],
  },
  zai: {
    apiKeyEnvVars: ['OPENAI_API_KEY'],
    description: 'Z.AI GLM coding subscription endpoint',
    label: 'Z.AI - GLM Coding Plan',
    modelEnvVars: ['OPENAI_MODEL'],
    name: 'Z.AI - GLM Coding Plan',
  },
  'atomic-chat': {
    description: 'Local Model Provider',
    fallbackModel: 'local-model',
    modelEnvVars: ['OPENAI_MODEL'],
  },
}

function readFirstEnvValue(
  processEnv: NodeJS.ProcessEnv,
  envVars?: string[],
): string {
  for (const envVar of envVars ?? []) {
    const value = processEnv[envVar]?.trim()
    if (value) {
      return value
    }
  }

  return ''
}

export type ProviderPresetUiMetadata = {
  apiKey: string
  authMode: AuthMode
  baseUrl: string
  credentialEnvVars: string[]
  description: string
  label: string
  model: string
  name: string
  preset: ProviderPreset
  provider: string
  requiresApiKey: boolean
  routeId: string
  supportsCustomHeaders: boolean
}

export function getProviderPresetUiMetadata(
  preset: ProviderPreset,
  processEnv: NodeJS.ProcessEnv = process.env,
): ProviderPresetUiMetadata {
  const route = routeForPreset(preset)
  const descriptor = getRouteDescriptor(route.routeId)
  const override = PRESET_UI_OVERRIDES[preset]
  const credentialEnvVars =
    override.apiKeyEnvVars ?? descriptor?.setup.credentialEnvVars ?? []
  const baseUrl =
    readFirstEnvValue(processEnv, override.baseUrlEnvVars) ||
    getRouteDefaultBaseUrl(route.routeId) ||
    override.fallbackBaseUrl ||
    ''
  const model =
    readFirstEnvValue(processEnv, override.modelEnvVars) ||
    getRouteDefaultModel(route.routeId) ||
    override.fallbackModel ||
    ''
  const label =
    override.label ?? getRouteLabel(route.routeId) ?? route.routeId

  return {
    apiKey: readFirstEnvValue(processEnv, credentialEnvVars),
    authMode: descriptor?.setup.authMode ?? 'api-key',
    baseUrl,
    credentialEnvVars,
    description: override.description,
    label,
    model,
    name: override.name ?? label,
    preset,
    provider: route.routeId,
    requiresApiKey: descriptor?.setup.requiresAuth ?? false,
    routeId: route.routeId,
    supportsCustomHeaders: routeSupportsCustomHeaders(route.routeId),
  }
}
