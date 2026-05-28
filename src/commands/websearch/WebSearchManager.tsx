import React from 'react'
import { Box, Text } from '../../ink.js'
import { Pane } from '../../components/design-system/Pane.js'
import { Select, type OptionWithDescription } from '../../components/CustomSelect/index.js'
import TextInput from '../../components/TextInput.js'
import {
  getProviderMode,
  getAvailableProviders,
} from '../../tools/WebSearchTool/providers/index.js'
import type { ProviderMode } from '../../tools/WebSearchTool/providers/index.js'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import { updateSettingsForSource } from '../../utils/settings/settings.js'
import { SEARCH_PROVIDER_OPTIONS, KEYABLE_SEARCH_PROVIDERS } from './providerOptions.js'

type Step = 'menu' | 'select-provider' | 'select-key-provider' | 'enter-key'

export function WebSearchManager({ onDone }: { onDone: LocalJSXCommandOnDone }) {
  const [step, setStep] = React.useState<Step>('menu')
  const [selectedKeyProvider, setSelectedKeyProvider] = React.useState<string>('')
  const [keyValue, setKeyValue] = React.useState('')
  const [cursorOffset, setCursorOffset] = React.useState(0)
  const currentMode = getProviderMode()
  const available = getAvailableProviders()
  const availableNames = new Set(available.map(p => p.name))

  if (step === 'select-provider') {
    const options: OptionWithDescription<ProviderMode>[] = SEARCH_PROVIDER_OPTIONS.map(opt => ({
      value: opt.value,
      label: opt.label,
      description: opt.value === currentMode
        ? '(current)'
        : opt.envKey && !availableNames.has(opt.value) && opt.value !== 'ddg' && opt.value !== 'auto' && opt.value !== 'native'
          ? `(${opt.envKey} not set)`
          : undefined,
    }))

    return (
      <Pane color="permission">
        <Box flexDirection="column" gap={1}>
          <Text bold>Select Web Search Provider</Text>
          <Text color="dim">Current: {currentMode}</Text>
          <Select
            options={options}
            defaultValue={currentMode}
            onChange={(value) => {
              process.env.WEB_SEARCH_PROVIDER = value
              onDone(
                `Web search provider set to "${value}" for this session.`,
                { display: 'system' },
              )
            }}
            onCancel={() => setStep('menu')}
          />
        </Box>
      </Pane>
    )
  }

  if (step === 'select-key-provider') {
    const options: OptionWithDescription<string>[] = KEYABLE_SEARCH_PROVIDERS.map(opt => {
      const isConfigured = availableNames.has(opt.value)
      return {
        value: opt.envKey!,
        label: opt.label,
        description: isConfigured ? '(key set)' : `(${opt.envKey})`,
      }
    })

    return (
      <Pane color="permission">
        <Box flexDirection="column" gap={1}>
          <Text bold>Set Search Provider API Key</Text>
          <Text color="dim">Select a provider to configure:</Text>
          <Select
            options={options}
            onChange={(envKey) => {
              setSelectedKeyProvider(envKey)
              setKeyValue('')
              setCursorOffset(0)
              setStep('enter-key')
            }}
            onCancel={() => setStep('menu')}
          />
        </Box>
      </Pane>
    )
  }

  if (step === 'enter-key') {
    return (
      <Pane color="permission">
        <Box flexDirection="column" gap={1}>
          <Text bold>Enter API Key for {selectedKeyProvider}</Text>
          <Text color="dim">Key will be saved to user settings and set for this session.</Text>
          <Box flexDirection="row" gap={1}>
            <Text>{'>'} </Text>
            <TextInput
              value={keyValue}
              onChange={setKeyValue}
              cursorOffset={cursorOffset}
              onChangeCursorOffset={setCursorOffset}
              placeholder="Enter API key..."
              mask="*"
              onSubmit={(value) => {
                const key = value.trim()
                if (!key) {
                  setStep('menu')
                  return
                }
                // Set for current session
                process.env[selectedKeyProvider] = key
                // Persist to user settings
                const { error } = updateSettingsForSource('userSettings', {
                  env: { [selectedKeyProvider]: key },
                })
                if (error) {
                  onDone(`Failed to save key: ${error.message}`, { display: 'system' })
                } else {
                  onDone(
                    `API key for ${selectedKeyProvider} saved and activated.\n` +
                    `It will persist across sessions.`,
                    { display: 'system' },
                  )
                }
              }}
              onExit={() => setStep('menu')}
            />
          </Box>
        </Box>
      </Pane>
    )
  }

  const menuOptions: OptionWithDescription<string>[] = [
    { value: 'status', label: 'Show provider status' },
    { value: 'switch', label: `Switch provider (current: ${currentMode})` },
    { value: 'setkey', label: 'Set API key' },
    { value: 'done', label: 'Done' },
  ]

  return (
    <Pane color="permission">
      <Box flexDirection="column" gap={1}>
        <Text bold>Web Search Manager</Text>
        <Select
          options={menuOptions}
          onChange={(value) => {
            switch (value) {
              case 'status':
                onDone(buildStatusText(), { display: 'system' })
                break
              case 'switch':
                setStep('select-provider')
                break
              case 'setkey':
                setStep('select-key-provider')
                break
              case 'done':
                onDone('Web search manager closed.', { display: 'system' })
                break
            }
          }}
          onCancel={() => onDone('Web search manager closed.', { display: 'system' })}
        />
      </Box>
    </Pane>
  )
}

function buildStatusText(): string {
  const mode = getProviderMode()
  const available = getAvailableProviders()
  const availableNames = new Set(available.map(p => p.name))

  const lines: string[] = [
    `Web Search Provider Status`,
    `Active mode: ${mode}`,
    ``,
    `Configured providers:`,
  ]

  for (const opt of SEARCH_PROVIDER_OPTIONS) {
    if (opt.value === 'auto' || opt.value === 'native') continue
    if (opt.value === 'ddg') {
      lines.push(`  ~ ${opt.label}`)
      continue
    }
    const isConfigured = availableNames.has(opt.value)
    lines.push(`  ${isConfigured ? '✓' : '✗'} ${opt.label}${opt.envKey && !isConfigured ? ` (${opt.envKey})` : ''}`)
  }

  if (mode === 'auto') {
    const chain = available.map(p => p.name)
    lines.push('', `Auto-chain: ${chain.join(' → ')} → ddg (unreliable)`)
  }

  return lines.join('\n')
}
