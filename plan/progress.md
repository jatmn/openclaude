# OpenClaude Descriptor Migration — Phase 1 Progress Tracker

**Master Plan**: [`plan/cheeky-cooking-moon.md`](./cheeky-cooking-moon.md)
**Phase**: Phase 1 — Foundation and Parity
**Goal**: Establish the descriptor system without regressing current behavior. Get all metadata into one place before deeper runtime migration starts.
**Last Updated**: 2026-04-25

---

## Phase 1 Exit Criteria

- [ ] Registry exists and loads
- [ ] Every currently supported integration has descriptor coverage
- [ ] Preset defaults and `/usage` can read from descriptors
- [ ] Existing saved profiles still deserialize and activate

---

## Phase 1A: Registry Skeleton

**Status**: `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `COMPLETE`

- [ ] Create `src/integrations/descriptors.ts` — all core types from master plan section "Core Descriptor Types"
- [ ] Create `src/integrations/define.ts` — `defineVendor`, `defineGateway`, `defineAnthropicProxy`, `defineBrand`, `defineModel`, `defineCatalog`
- [ ] Create `src/integrations/registry.ts` — Maps, register/get/list APIs, catalog helpers, `validateIntegrationRegistry`
- [ ] Create `src/integrations/index.ts` — loader entrypoint that imports and registers all descriptor modules
- [ ] Create `src/integrations/compatibility.ts` — `PRESET_VENDOR_MAP`, `vendorIdForPreset`, `gatewayIdForPreset`, `routeForPreset`
- [ ] Create `src/integrations/registry.test.ts` — register/retrieve, duplicate ids, missing refs, transport validation, usage delegates, enrichment
- [ ] Run registry tests — all pass
- [ ] Run `tsc --noEmit` on new files — zero errors

---

## Phase 1B: Descriptor Inventory for Vendors and Gateways

**Status**: `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `COMPLETE`

### Vendors (first-party and direct)
- [ ] `src/integrations/vendors/anthropic.ts` — native, usage supported
- [ ] `src/integrations/vendors/openai.ts` — openai-compatible, static/hybrid catalog
- [ ] `src/integrations/vendors/gemini.ts` — gemini-native
- [ ] `src/integrations/vendors/moonshot.ts` — openai-compatible
- [ ] `src/integrations/vendors/deepseek.ts` — openai-compatible, static/hybrid catalog
- [ ] `src/integrations/vendors/minimax.ts` — usage supported
- [ ] `src/integrations/vendors/bankr.ts` — openai-compatible
- [ ] `src/integrations/vendors/zai.ts` — only if PR #896 landed

### Gateways (hosted and local)
- [ ] `src/integrations/gateways/ollama.ts` — local, dynamic discovery
- [ ] `src/integrations/gateways/lmstudio.ts` — local, dynamic discovery
- [ ] `src/integrations/gateways/atomic-chat.ts` — local, dynamic discovery
- [ ] `src/integrations/gateways/openrouter.ts` — aggregating, dynamic/hybrid
- [ ] `src/integrations/gateways/together.ts` — aggregating
- [ ] `src/integrations/gateways/groq.ts` — aggregating
- [ ] `src/integrations/gateways/azure-openai.ts` — hosted
- [ ] `src/integrations/gateways/dashscope-cn.ts` — hosted
- [ ] `src/integrations/gateways/dashscope-intl.ts` — hosted
- [ ] `src/integrations/gateways/nvidia-nim.ts` — hosted
- [ ] `src/integrations/gateways/custom.ts` — hosted, empty static catalog

### Special-case surfaces (document unresolved nuances inline)
- [ ] `src/integrations/gateways/github.ts` — special native-Claude path
- [ ] `src/integrations/gateways/bedrock.ts` — bedrock transport
- [ ] `src/integrations/gateways/vertex.ts` — vertex transport
- [ ] `src/integrations/gateways/mistral.ts` — dedicated runtime, not generic openai-compatible

### Verification
- [ ] Cross-check migration inventory table — every preset has a descriptor file
- [ ] `validateIntegrationRegistry()` returns zero errors
- [ ] Every route has `transportConfig.kind` assigned
- [ ] Every gateway/direct vendor has catalog strategy declared

---

## Phase 1C: Shared Brand and Model Index Seeding

**Status**: `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `COMPLETE`

### Brand descriptors
- [ ] `src/integrations/brands/claude.ts`
- [ ] `src/integrations/brands/gpt.ts`
- [ ] `src/integrations/brands/kimi.ts`
- [ ] `src/integrations/brands/deepseek.ts`
- [ ] `src/integrations/brands/llama.ts`
- [ ] `src/integrations/brands/qwen.ts`

### Shared model index
- [ ] `src/integrations/models/claude.ts` — sonnet, opus, haiku variants
- [ ] `src/integrations/models/gpt.ts` — gpt-4o, gpt-4o-mini, etc.
- [ ] `src/integrations/models/kimi.ts`
- [ ] `src/integrations/models/deepseek.ts` — chat + reasoner variants
- [ ] `src/integrations/models/llama.ts`
- [ ] `src/integrations/models/qwen.ts`

### Documentation
- [ ] Inline comments note fallback to `openaiContextWindows.ts`
- [ ] Inline comments note gateway onboarding does not require editing model index files

---

## Phase 1D: Config and Preset Compatibility

**Status**: `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `COMPLETE`

- [ ] Widen `Providers` from closed union to `string` in `src/utils/config.ts`
- [ ] Stop normalizing unknown stored providers back to `'openai'` in `src/utils/providerProfiles.ts`
- [ ] Add `resolveProfileRoute(provider)` helper returning `{ vendorId, gatewayId?, routeId }`
- [ ] Update `applyProviderProfileToProcessEnv()` to use route-resolution helper with explicit fallback
- [ ] Add/update `providerProfiles.test.ts` — unknown providers preserved, route resolution correct for all presets

---

## Phase 1E: CLI Flag and Usage Surface Migration

**Status**: `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `COMPLETE`

- [ ] Derive valid provider names from descriptors/compatibility in `src/utils/providerFlag.ts`
- [ ] Preserve `--provider ollama`, `--provider minimax` semantics
- [ ] Implement `getUsageDescriptor(activeId)` in `src/commands/usage/index.ts`
- [ ] Anthropic usage supported, MiniMax preserved, unsupported shows neutral fallback
- [ ] Add usage routing tests — supported, unsupported, gateway delegation

---

## Phase 1F: Phase-1 Verification and Merge Pass

**Status**: `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `COMPLETE`

- [ ] Registry unit and validation tests pass
- [ ] Compatibility mapping tests — every preset has valid descriptor mapping
- [ ] Saved-profile compatibility tests — old profiles deserialize, unknown providers preserved
- [ ] Run `src/utils/*provider*.test.ts` — all green
- [ ] Run `src/utils/model/*.test.ts` — all green
- [ ] Run profile startup/env tests — all green
- [ ] `tsc --noEmit` across project — zero errors
- [ ] Cross-check: no provider from migration inventory is missing a descriptor file

---

## Phase 1 Merge Checkpoints

- [ ] **1A merged** — registry skeleton + tests in main
- [ ] **1B+1C merged** — all descriptor files + brand/model index in main
- [ ] **1D+1E merged** — config compatibility + CLI/usage surfaces in main
- [ ] **1F complete** — all tests green, exit criteria met, ready for Phase 2

---

## Quick Reference: Files Created in Phase 1

```
src/integrations/
  descriptors.ts
  define.ts
  registry.ts
  index.ts
  compatibility.ts
  registry.test.ts
  discoveryCache.ts         (Phase 2A.5)
  discoveryCache.test.ts    (Phase 2A.5)
  brands/
    claude.ts
    deepseek.ts
    gpt.ts
    kimi.ts
    llama.ts
    qwen.ts
  vendors/
    anthropic.ts
    openai.ts
    (optional) openai.models.ts
    gemini.ts
    moonshot.ts
    deepseek.ts
    (optional) deepseek.models.ts
    minimax.ts
    bankr.ts
    zai.ts (if PR #896)
  gateways/
    ollama.ts
    (optional) ollama.models.ts
    lmstudio.ts
    atomic-chat.ts
    openrouter.ts
    together.ts
    groq.ts
    mistral.ts
    azure-openai.ts
    github.ts
    bedrock.ts
    vertex.ts
    dashscope-cn.ts
    dashscope-intl.ts
    nvidia-nim.ts
    custom.ts
  models/
    claude.ts
    gpt.ts
    kimi.ts
    deepseek.ts
    llama.ts
    qwen.ts
```

---

## How to Update This File

Check boxes as tasks complete. When a whole phase (1A–1F) is done, update its **Status** and check the corresponding merge checkpoint. When all merge checkpoints are done, the Phase 1 exit criteria should all be checked too.
