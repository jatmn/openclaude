import React from 'react'

import type { LocalJSXCommandCall, LocalJSXCommandOnDone } from '../../types/command.js'
import { COMMON_HELP_ARGS, COMMON_INFO_ARGS } from '../../constants/xml.js'
import { runSearch } from '../../tools/WebSearchTool/providers/index.js'
import { Box, Text } from '../../ink.js'
import { Pane } from '../../components/design-system/Pane.js'
import { LoadingState } from '../../components/design-system/LoadingState.js'
import { WebSearchStatus } from './WebSearchStatus.js'
import { WebSearchManager } from './WebSearchManager.js'

export const call: LocalJSXCommandCall = async (onDone, _context, args) => {
  const trimmedArgs = args?.trim() ?? ''

  // Help
  if (COMMON_HELP_ARGS.includes(trimmedArgs.toLowerCase())) {
    onDone(
      'Usage:\n' +
      '  /websearch <query>       Search the web directly\n' +
      '  /websearch status        Show configured providers and active mode\n' +
      '  /websearch provider <n>  Switch to a specific provider\n' +
      '  /websearch               Open interactive manager (set keys, switch provider)\n' +
      '\n' +
      'Aliases: /search\n' +
      '\n' +
      'Provider is controlled by WEB_SEARCH_PROVIDER env var.\n' +
      'Use /websearch to set API keys interactively, or set env vars directly\n' +
      '(e.g. TAVILY_API_KEY, BRAVE_API_KEY, EXA_API_KEY).',
      { display: 'system' },
    )
    return
  }

  // Status
  if (COMMON_INFO_ARGS.includes(trimmedArgs.toLowerCase())) {
    return <WebSearchStatus />
  }

  // Switch provider directly: /websearch provider <name>
  if (trimmedArgs.toLowerCase().startsWith('provider ')) {
    const providerName = trimmedArgs.slice('provider '.length).trim().toLowerCase()
    if (!providerName) {
      onDone('Usage: /websearch provider <name>\nValid: auto, firecrawl, tavily, exa, you, jina, brave, bing, mojeek, linkup, ddg, custom, native', { display: 'system' })
      return
    }
    const validModes = new Set(['auto', 'firecrawl', 'tavily', 'exa', 'you', 'jina', 'brave', 'bing', 'mojeek', 'linkup', 'ddg', 'custom', 'native'])
    if (!validModes.has(providerName)) {
      onDone(`Unknown provider "${providerName}". Valid: ${[...validModes].join(', ')}`, { display: 'system' })
      return
    }
    process.env.WEB_SEARCH_PROVIDER = providerName
    onDone(`Web search provider set to "${providerName}" for this session.`, { display: 'system' })
    return
  }

  // Direct search: /websearch <query>
  if (trimmedArgs) {
    return <WebSearchQuery query={trimmedArgs} onDone={onDone} />
  }

  // No args → interactive manager
  return <WebSearchManager onDone={onDone} />
}

function WebSearchQuery({ query, onDone }: { query: string; onDone: LocalJSXCommandOnDone }) {
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const output = await runSearch({ query })
        if (cancelled) return
        const lines: string[] = [
          `Search results for "${query}" (via ${output.providerName}, ${output.durationSeconds.toFixed(1)}s):`,
          '',
        ]
        for (const hit of output.hits) {
          lines.push(`  ${hit.title}`)
          lines.push(`  ${hit.url}`)
          if (hit.description) lines.push(`  ${hit.description}`)
          lines.push('')
        }
        if (output.hits.length === 0) {
          lines.push('  No results found.')
        }
        onDone(lines.join('\n'), { display: 'system' })
      } catch (err) {
        if (cancelled) return
        onDone(`Search failed: ${err instanceof Error ? err.message : String(err)}`, { display: 'system' })
      }
    })()
    return () => { cancelled = true }
  }, [query, onDone])

  return (
    <Pane color="permission">
      <LoadingState message={`Searching: ${query}`} />
    </Pane>
  )
}
