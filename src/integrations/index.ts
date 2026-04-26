// src/integrations/index.ts
// Single loader entrypoint for descriptor modules.
// Runtime and tests must import this file before reading registry state.
//
// Loader strategy:
//   Phase 1 bootstrap: manual imports from known descriptor folders.
//   End state: constrained directory discovery (e.g., import.meta.glob) or a
//   generated loader script so adding a gateway does not require hand-editing
//   this file.

import {
  getBrand,
  getGateway,
  getModel,
  getVendor,
  registerBrand,
  registerGateway,
  registerModel,
  registerVendor,
} from './registry.js'

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

import anthropic from './vendors/anthropic.js'
import openai from './vendors/openai.js'
import gemini from './vendors/gemini.js'
import moonshot from './vendors/moonshot.js'
import deepseek from './vendors/deepseek.js'
import minimax from './vendors/minimax.js'
import bankr from './vendors/bankr.js'

// ---------------------------------------------------------------------------
// Gateways
// ---------------------------------------------------------------------------

import ollama from './gateways/ollama.js'
import lmstudio from './gateways/lmstudio.js'
import atomicChat from './gateways/atomic-chat.js'
import openrouter from './gateways/openrouter.js'
import together from './gateways/together.js'
import groq from './gateways/groq.js'
import azureOpenai from './gateways/azure-openai.js'
import dashscopeCn from './gateways/dashscope-cn.js'
import dashscopeIntl from './gateways/dashscope-intl.js'
import nvidiaNim from './gateways/nvidia-nim.js'
import custom from './gateways/custom.js'
import kimiCode from './gateways/kimi-code.js'
import github from './gateways/github.js'
import bedrock from './gateways/bedrock.js'
import vertex from './gateways/vertex.js'
import mistral from './gateways/mistral.js'

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

import claudeBrand from './brands/claude.js'
import deepseekBrand from './brands/deepseek.js'
import gptBrand from './brands/gpt.js'
import kimiBrand from './brands/kimi.js'
import llamaBrand from './brands/llama.js'
import qwenBrand from './brands/qwen.js'

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

import claudeModels from './models/claude.js'
import gptModels from './models/gpt.js'
import kimiModels from './models/kimi.js'
import deepseekModels from './models/deepseek.js'
import llamaModels from './models/llama.js'
import qwenModels from './models/qwen.js'

export function ensureIntegrationsLoaded(): void {
  if (!getVendor(anthropic.id)) registerVendor(anthropic)
  if (!getVendor(openai.id)) registerVendor(openai)
  if (!getVendor(gemini.id)) registerVendor(gemini)
  if (!getVendor(moonshot.id)) registerVendor(moonshot)
  if (!getVendor(deepseek.id)) registerVendor(deepseek)
  if (!getVendor(minimax.id)) registerVendor(minimax)
  if (!getVendor(bankr.id)) registerVendor(bankr)

  if (!getGateway(ollama.id)) registerGateway(ollama)
  if (!getGateway(lmstudio.id)) registerGateway(lmstudio)
  if (!getGateway(atomicChat.id)) registerGateway(atomicChat)
  if (!getGateway(openrouter.id)) registerGateway(openrouter)
  if (!getGateway(together.id)) registerGateway(together)
  if (!getGateway(groq.id)) registerGateway(groq)
  if (!getGateway(azureOpenai.id)) registerGateway(azureOpenai)
  if (!getGateway(dashscopeCn.id)) registerGateway(dashscopeCn)
  if (!getGateway(dashscopeIntl.id)) registerGateway(dashscopeIntl)
  if (!getGateway(nvidiaNim.id)) registerGateway(nvidiaNim)
  if (!getGateway(custom.id)) registerGateway(custom)
  if (!getGateway(kimiCode.id)) registerGateway(kimiCode)
  if (!getGateway(github.id)) registerGateway(github)
  if (!getGateway(bedrock.id)) registerGateway(bedrock)
  if (!getGateway(vertex.id)) registerGateway(vertex)
  if (!getGateway(mistral.id)) registerGateway(mistral)

  if (!getBrand(claudeBrand.id)) registerBrand(claudeBrand)
  if (!getBrand(deepseekBrand.id)) registerBrand(deepseekBrand)
  if (!getBrand(gptBrand.id)) registerBrand(gptBrand)
  if (!getBrand(kimiBrand.id)) registerBrand(kimiBrand)
  if (!getBrand(llamaBrand.id)) registerBrand(llamaBrand)
  if (!getBrand(qwenBrand.id)) registerBrand(qwenBrand)

  for (const model of claudeModels) {
    if (!getModel(model.id)) registerModel(model)
  }
  for (const model of gptModels) {
    if (!getModel(model.id)) registerModel(model)
  }
  for (const model of kimiModels) {
    if (!getModel(model.id)) registerModel(model)
  }
  for (const model of deepseekModels) {
    if (!getModel(model.id)) registerModel(model)
  }
  for (const model of llamaModels) {
    if (!getModel(model.id)) registerModel(model)
  }
  for (const model of qwenModels) {
    if (!getModel(model.id)) registerModel(model)
  }
}

ensureIntegrationsLoaded()

// ---------------------------------------------------------------------------
// Anthropic Proxies (placeholder — future)
// ---------------------------------------------------------------------------

// TODO: Import and register anthropic proxy descriptors when needed.

export {
  registerBrand,
  registerVendor,
  registerGateway,
  registerAnthropicProxy,
  registerModel,
  getBrand,
  getVendor,
  getGateway,
  getAnthropicProxy,
  getModel,
  getAllBrands,
  getAllVendors,
  getAllGateways,
  getAllAnthropicProxies,
  getAllModels,
  getCatalogForGateway,
  getCatalogForVendor,
  getCatalogEntriesForRoute,
  getModelsForBrand,
  getModelsForGateway,
  getModelsForVendor,
  getBrandsForVendor,
  validateIntegrationRegistry,
  _clearRegistryForTesting,
} from './registry.js'

export { routeForPreset, vendorIdForPreset, gatewayIdForPreset } from './compatibility.js'
export { resolveProfileRoute } from './profileResolver.js'
export type { ResolvedProfileRoute } from './profileResolver.js'
export {
  getRouteDefaultBaseUrl,
  getRouteDefaultModel,
  getRouteDescriptor,
  getRouteLabel,
  getRouteProviderTypeLabel,
  getTransportKindForRoute,
  resolveActiveRouteIdFromEnv,
  resolveRouteIdFromBaseUrl,
  routeSupportsCustomHeaders,
} from './routeMetadata.js'
export {
  getProviderPresetUiMetadata,
  ORDERED_PROVIDER_PRESETS,
} from './providerUiMetadata.js'
