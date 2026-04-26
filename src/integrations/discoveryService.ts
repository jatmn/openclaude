import {
  getCachedModels,
  parseDurationString,
  recordDiscoveryError,
  setCachedModels,
  type DiscoveryCacheError,
} from './discoveryCache.js'
import type {
  GatewayDescriptor,
  ModelCatalogConfig,
  ModelCatalogEntry,
  ReadinessProbeKind,
  VendorDescriptor,
} from './descriptors.js'
import {
  ensureIntegrationsLoaded,
  getAllGateways,
  getAllVendors,
  getGateway,
  getVendor,
} from './index.js'
import type {
  AtomicChatReadiness,
  OllamaGenerationReadiness,
} from '../utils/providerDiscovery.js'
import {
  getLocalOpenAICompatibleProviderLabel,
  listOpenAICompatibleModels,
  probeOllamaModelCatalog,
  probeAtomicChatReadiness,
  probeOllamaGenerationReadiness,
} from '../utils/providerDiscovery.js'

export type RouteDiscoveryResult = {
  routeId: string
  models: ModelCatalogEntry[]
  stale: boolean
  error: DiscoveryCacheError | null
  source: 'network' | 'cache' | 'stale-cache' | 'static' | 'error'
}

export type OpenAICompatibleReadiness =
  | { state: 'unreachable' }
  | { state: 'no_models' }
  | { state: 'ready'; models: string[] }

export type RouteReadinessResult =
  | OllamaGenerationReadiness
  | AtomicChatReadiness
  | OpenAICompatibleReadiness

type RouteDescriptor =
  | { kind: 'vendor'; descriptor: VendorDescriptor }
  | { kind: 'gateway'; descriptor: GatewayDescriptor }

function normalizeComparableBaseUrl(
  baseUrl?: string,
): string | null {
  if (!baseUrl?.trim()) {
    return null
  }

  try {
    const parsed = new URL(baseUrl)
    parsed.hash = ''
    return parsed.toString().replace(/\/+$/, '').toLowerCase()
  } catch {
    return baseUrl.trim().replace(/\/+$/, '').toLowerCase() || null
  }
}

function getRouteDescriptor(routeId: string): RouteDescriptor | null {
  ensureIntegrationsLoaded()

  const gateway = getGateway(routeId)
  if (gateway) {
    return { kind: 'gateway', descriptor: gateway }
  }

  const vendor = getVendor(routeId)
  if (vendor) {
    return { kind: 'vendor', descriptor: vendor }
  }

  return null
}

function getRouteCatalog(routeId: string): ModelCatalogConfig | null {
  return getRouteDescriptor(routeId)?.descriptor.catalog ?? null
}

export function resolveDiscoveryRouteIdFromBaseUrl(
  baseUrl?: string,
): string | null {
  const normalizedBaseUrl = normalizeComparableBaseUrl(baseUrl)
  if (!normalizedBaseUrl) {
    return null
  }

  ensureIntegrationsLoaded()

  const descriptorBackedRoutes = [
    ...getAllGateways(),
    ...getAllVendors(),
  ].filter(route => route.catalog?.discovery)

  for (const route of descriptorBackedRoutes) {
    const normalizedDefaultBaseUrl = normalizeComparableBaseUrl(
      route.defaultBaseUrl,
    )
    if (normalizedDefaultBaseUrl === normalizedBaseUrl) {
      return route.id
    }
  }

  const providerLabel = getLocalOpenAICompatibleProviderLabel(baseUrl)
  if (providerLabel === 'Ollama') {
    return 'ollama'
  }
  if (providerLabel === 'LM Studio') {
    return 'lmstudio'
  }

  return null
}

function getCatalogEntries(
  routeId: string,
): ModelCatalogEntry[] {
  return getRouteCatalog(routeId)?.models ?? []
}

function getDiscoveryCacheTtlMs(
  routeId: string,
): number {
  const ttl = getRouteCatalog(routeId)?.discoveryCacheTtl ?? 0
  return typeof ttl === 'string' || typeof ttl === 'number'
    ? parseDurationString(ttl)
    : 0
}

function getRouteBaseUrl(
  routeId: string,
  options?: { baseUrl?: string },
): string | undefined {
  return options?.baseUrl ?? getRouteDescriptor(routeId)?.descriptor.defaultBaseUrl
}

function getRouteDiscoveryApiKey(
  routeId: string,
  options?: { apiKey?: string },
): string | undefined {
  if (options?.apiKey?.trim()) {
    return options.apiKey.trim()
  }

  const descriptor = getRouteDescriptor(routeId)?.descriptor
  const envVars = descriptor?.setup.credentialEnvVars ?? []
  for (const envVar of envVars) {
    const value = process.env[envVar]?.trim()
    if (value) {
      return value
    }
  }

  return undefined
}

function toDiscoveredModelEntry(modelId: string): ModelCatalogEntry {
  return {
    id: modelId,
    apiName: modelId,
    label: modelId,
  }
}

function toOllamaModelEntry(model: { name: string }): ModelCatalogEntry {
  return {
    id: model.name,
    apiName: model.name,
    label: model.name,
  }
}

function mergeCatalogEntries(
  staticEntries: ModelCatalogEntry[],
  discoveredEntries: ModelCatalogEntry[],
): ModelCatalogEntry[] {
  const merged = [...staticEntries]
  const existingApiNames = new Set(
    staticEntries.map(entry => entry.apiName.toLowerCase()),
  )

  for (const entry of discoveredEntries) {
    if (existingApiNames.has(entry.apiName.toLowerCase())) {
      continue
    }
    existingApiNames.add(entry.apiName.toLowerCase())
    merged.push(entry)
  }

  return merged
}

async function runDiscovery(
  routeId: string,
  options?: {
    baseUrl?: string
    apiKey?: string
  },
): Promise<ModelCatalogEntry[] | null> {
  const catalog = getRouteCatalog(routeId)
  const discovery = catalog?.discovery
  if (!catalog || !discovery) {
    return null
  }

  switch (discovery.kind) {
    case 'ollama': {
      const result = await probeOllamaModelCatalog({
        baseUrl: getRouteBaseUrl(routeId, options),
      })
      if (!result.reachable) {
        return null
      }
      return result.models.map(model => toOllamaModelEntry(model))
    }

    case 'openai-compatible': {
      const models = await listOpenAICompatibleModels({
        baseUrl: getRouteBaseUrl(routeId, options),
        apiKey: getRouteDiscoveryApiKey(routeId, options),
      })
      return models?.map(model => toDiscoveredModelEntry(model)) ?? null
    }

    case 'custom':
      return null
  }
}

export async function discoverModelsForRoute(
  routeId: string,
  options?: {
    baseUrl?: string
    apiKey?: string
    forceRefresh?: boolean
  },
): Promise<RouteDiscoveryResult | null> {
  const catalog = getRouteCatalog(routeId)
  if (!catalog) {
    return null
  }

  const staticEntries = getCatalogEntries(routeId)
  if (!catalog.discovery) {
    return {
      routeId,
      models: staticEntries,
      stale: false,
      error: null,
      source: 'static',
    }
  }

  const ttlMs = getDiscoveryCacheTtlMs(routeId)
  if (!options?.forceRefresh && ttlMs > 0) {
    const cached = await getCachedModels(routeId, ttlMs)
    if (cached) {
      return {
        routeId,
        models: mergeCatalogEntries(staticEntries, cached.models),
        stale: false,
        error: cached.error,
        source: 'cache',
      }
    }
  }

  try {
    const discovered = await runDiscovery(routeId, options)
    if (discovered === null) {
      throw new Error(`Discovery failed for route ${routeId}`)
    }

    await setCachedModels(routeId, { models: discovered })
    return {
      routeId,
      models: mergeCatalogEntries(staticEntries, discovered),
      stale: false,
      error: null,
      source: 'network',
    }
  } catch (error) {
    await recordDiscoveryError(routeId, error)

    const staleEntry = await getCachedModels(routeId, ttlMs, {
      includeStale: true,
    })

    if (staleEntry) {
      return {
        routeId,
        models: mergeCatalogEntries(staticEntries, staleEntry.models),
        stale: true,
        error: staleEntry.error,
        source: 'stale-cache',
      }
    }

    return {
      routeId,
      models: staticEntries,
      stale: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        recordedAt: Date.now(),
      },
      source: 'error',
    }
  }
}

function getReadinessProbeKind(routeId: string): ReadinessProbeKind | null {
  return getRouteDescriptor(routeId)?.descriptor.startup?.probeReadiness ?? null
}

export function probeRouteReadiness(
  routeId: 'ollama',
  options?: {
    baseUrl?: string
    model?: string
    timeoutMs?: number
    apiKey?: string
  },
): Promise<OllamaGenerationReadiness | null>
export function probeRouteReadiness(
  routeId: 'atomic-chat',
  options?: {
    baseUrl?: string
    model?: string
    timeoutMs?: number
    apiKey?: string
  },
): Promise<AtomicChatReadiness | null>
export function probeRouteReadiness(
  routeId: string,
  options?: {
    baseUrl?: string
    model?: string
    timeoutMs?: number
    apiKey?: string
  },
): Promise<RouteReadinessResult | null>
export async function probeRouteReadiness(
  routeId: string,
  options?: {
    baseUrl?: string
    model?: string
    timeoutMs?: number
    apiKey?: string
  },
): Promise<RouteReadinessResult | null> {
  const readinessKind = getReadinessProbeKind(routeId)
  if (!readinessKind) {
    return null
  }

  switch (readinessKind) {
    case 'ollama-generation':
      return probeOllamaGenerationReadiness({
        baseUrl: getRouteBaseUrl(routeId, options),
        model: options?.model,
        timeoutMs: options?.timeoutMs,
      })

    case 'openai-compatible-models': {
      if (routeId === 'atomic-chat') {
        return probeAtomicChatReadiness({
          baseUrl: getRouteBaseUrl(routeId, options),
        })
      }

      const discovered = await runDiscovery(routeId, options)
      if (discovered === null) {
        return { state: 'unreachable' }
      }

      if (discovered.length === 0) {
        return { state: 'no_models' }
      }

      return {
        state: 'ready',
        models: discovered.map(entry => entry.apiName),
      }
    }
  }
}
