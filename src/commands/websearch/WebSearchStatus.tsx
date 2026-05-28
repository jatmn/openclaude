import React from 'react'
import { Box, Text } from '../../ink.js'
import { Pane } from '../../components/design-system/Pane.js'
import {
  getProviderMode,
  getAvailableProviders,
} from '../../tools/WebSearchTool/providers/index.js'
import { SEARCH_PROVIDER_OPTIONS } from './providerOptions.js'

export function WebSearchStatus() {
  const mode = getProviderMode()
  const available = getAvailableProviders()
  const availableNames = new Set(available.map(p => p.name))

  return (
    <Pane color="permission">
      <Box flexDirection="column" gap={1}>
        <Text bold>Web Search Provider Status</Text>

        <Box flexDirection="column" gap={0}>
          <Text>
            Active mode: <Text bold color="success">{mode}</Text>
          </Text>
          {mode !== 'auto' && mode !== 'native' && (
            <Text>
              Provider configured:{' '}
              {availableNames.has(mode) ? (
                <Text color="success">Yes</Text>
              ) : (
                <Text color="error">No — set {SEARCH_PROVIDER_OPTIONS.find(m => m.value === mode)?.envKey ?? 'the required env var'}</Text>
              )}
            </Text>
          )}
        </Box>

        <Box flexDirection="column" gap={0}>
          <Text bold>Configured Providers:</Text>
          {SEARCH_PROVIDER_OPTIONS.filter(m => m.value !== 'auto' && m.value !== 'native').map(m => {
            if (m.value === 'ddg') {
              return (
                <Text key={m.value}>
                  <Text color="warning">  ~ {m.label}</Text>
                </Text>
              )
            }
            const isConfigured = availableNames.has(m.value)
            return (
              <Text key={m.value}>
                {isConfigured ? (
                  <Text color="success">  ✓ {m.label}</Text>
                ) : (
                  <Text color="dim">  ✗ {m.label} {m.envKey ? `(${m.envKey})` : ''}</Text>
                )}
              </Text>
            )
          })}
        </Box>

        {mode === 'auto' && (
          <Box flexDirection="column" gap={0}>
            <Text bold>Auto-chain priority:</Text>
            <Text color="dim">
              {available.map(p => p.name).join(' → ')} → <Text color="warning">ddg (unreliable)</Text>
            </Text>
          </Box>
        )}

        <Box flexDirection="column" gap={0}>
          <Text bold>Native paths:</Text>
          <Text color="dim">  Anthropic (firstParty/vertex/foundry) and Codex/OpenAI use server-side search</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="dim">
            Use /websearch to switch providers, set API keys, or /websearch {'<query>'} to search directly.
          </Text>
        </Box>
      </Box>
    </Pane>
  )
}
