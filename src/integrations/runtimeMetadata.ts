import type {
  ModelCatalogEntry,
  OpenAIShimTransportConfig,
} from './descriptors.js'
import { ensureIntegrationsLoaded } from './index.js'
import { getCatalogEntriesForRoute, getModel } from './registry.js'
import {
  getRouteDescriptor,
  resolveActiveRouteIdFromEnv,
  resolveRouteIdFromBaseUrl,
  type RouteDescriptor,
} from './routeMetadata.js'

function normalizeModelApiName(
  value: string | undefined,
): string | null {
  const trimmed = value?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

function matchesCatalogEntryModel(
  routeId: string,
  entry: ModelCatalogEntry,
  modelApiName: string,
): boolean {
  if (entry.apiName.trim().toLowerCase() === modelApiName) {
    return true
  }

  if (!entry.modelDescriptorId) {
    return false
  }

  const modelDescriptor = getModel(entry.modelDescriptorId)
  if (!modelDescriptor) {
    return false
  }

  if (modelDescriptor.defaultModel.trim().toLowerCase() === modelApiName) {
    return true
  }

  const providerMappedModel = modelDescriptor.providerModelMap?.[routeId]
  return providerMappedModel?.trim().toLowerCase() === modelApiName
}

function getCatalogEntryForModel(
  routeId: string,
  modelApiName: string | undefined,
): ModelCatalogEntry | null {
  const normalizedModel = normalizeModelApiName(modelApiName)
  if (!normalizedModel) {
    return null
  }

  ensureIntegrationsLoaded()
  const entries = getCatalogEntriesForRoute(routeId)
  return (
    entries.find(entry =>
      matchesCatalogEntryModel(routeId, entry, normalizedModel),
    ) ?? null
  )
}

function mergeRemoveBodyFields(
  ...sources: Array<string[] | undefined>
): string[] | undefined {
  const merged = new Set<string>()

  for (const source of sources) {
    for (const field of source ?? []) {
      const normalized = field.trim()
      if (normalized) {
        merged.add(normalized)
      }
    }
  }

  return merged.size > 0 ? [...merged] : undefined
}

function mergeOpenAIShimConfig(
  baseConfig: OpenAIShimTransportConfig | undefined,
  entryConfig: Partial<OpenAIShimTransportConfig> | undefined,
  inferredConfig: Partial<OpenAIShimTransportConfig> | undefined,
): OpenAIShimTransportConfig {
  return {
    ...baseConfig,
    ...entryConfig,
    ...inferredConfig,
    removeBodyFields: mergeRemoveBodyFields(
      baseConfig?.removeBodyFields,
      entryConfig?.removeBodyFields,
      inferredConfig?.removeBodyFields,
    ),
  }
}

function inferRemoteModelOpenAIShimConfig(
  modelApiName: string | undefined,
): Partial<OpenAIShimTransportConfig> | undefined {
  const normalizedModel = normalizeModelApiName(modelApiName)
  if (!normalizedModel) {
    return undefined
  }

  if (normalizedModel.includes('deepseek')) {
    return {
      preserveReasoningContent: true,
      requireReasoningContentOnAssistantMessages: true,
      reasoningContentFallback: '',
      thinkingRequestFormat: 'deepseek-compatible',
      maxTokensField: 'max_tokens',
      removeBodyFields: ['store'],
    }
  }

  if (normalizedModel.includes('kimi') || normalizedModel.includes('moonshot')) {
    return {
      preserveReasoningContent: true,
      requireReasoningContentOnAssistantMessages: true,
      reasoningContentFallback: '',
      maxTokensField: 'max_tokens',
      removeBodyFields: ['store'],
    }
  }

  return undefined
}

export type OpenAIShimRuntimeContext = {
  routeId: string | null
  descriptor: RouteDescriptor | null
  catalogEntry: ModelCatalogEntry | null
  openaiShimConfig: OpenAIShimTransportConfig
}

export function resolveOpenAIShimRuntimeContext(options?: {
  processEnv?: NodeJS.ProcessEnv
  baseUrl?: string
  model?: string
  activeProfileProvider?: string
  treatAsLocal?: boolean
}): OpenAIShimRuntimeContext {
  const processEnv = options?.processEnv ?? process.env
  const runtimeEnv: NodeJS.ProcessEnv = {
    ...processEnv,
  }

  if (options?.baseUrl !== undefined) {
    runtimeEnv.OPENAI_BASE_URL = options.baseUrl
  }

  if (options?.model !== undefined) {
    runtimeEnv.OPENAI_MODEL = options.model
  }

  const activeRouteId = resolveActiveRouteIdFromEnv(runtimeEnv, {
    activeProfileProvider: options?.activeProfileProvider,
  })
  const baseUrlRouteId = resolveRouteIdFromBaseUrl(options?.baseUrl)
  const routeId =
    baseUrlRouteId &&
    (!activeRouteId || activeRouteId === 'anthropic' || activeRouteId === 'openai')
      ? baseUrlRouteId
      : activeRouteId
  const descriptor =
    routeId && routeId !== 'anthropic'
      ? getRouteDescriptor(routeId)
      : null
  const catalogEntry =
    descriptor && routeId
      ? getCatalogEntryForModel(routeId, options?.model)
      : null
  const inferredConfig =
    options?.treatAsLocal === true
      ? {
          maxTokensField: 'max_tokens' as const,
        }
      : inferRemoteModelOpenAIShimConfig(options?.model)

  return {
    routeId,
    descriptor,
    catalogEntry,
    openaiShimConfig: mergeOpenAIShimConfig(
      descriptor?.transportConfig.openaiShim,
      catalogEntry?.transportOverrides?.openaiShim,
      inferredConfig,
    ),
  }
}

export function usesAnthropicNativeMessageFormat(options?: {
  processEnv?: NodeJS.ProcessEnv
  model?: string
  activeProfileProvider?: string
}): boolean {
  const processEnv = options?.processEnv ?? process.env
  const routeId = resolveActiveRouteIdFromEnv(processEnv, {
    activeProfileProvider: options?.activeProfileProvider,
  })

  if (
    routeId === 'anthropic' ||
    routeId === 'bedrock' ||
    routeId === 'vertex'
  ) {
    return true
  }

  if (routeId !== 'github') {
    return false
  }

  const model = options?.model?.trim() || processEnv.OPENAI_MODEL?.trim() || ''
  return model.toLowerCase().includes('claude-')
}
