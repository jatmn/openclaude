import type { ProviderMode } from '../../../tools/WebSearchTool/providers/index.js'

export type SearchProviderOption = {
  value: ProviderMode
  label: string
  envKey?: string
}

export const SEARCH_PROVIDER_OPTIONS: SearchProviderOption[] = [
  { value: 'auto', label: 'Auto (try all configured in priority order)' },
  { value: 'firecrawl', label: 'Firecrawl', envKey: 'FIRECRAWL_API_KEY' },
  { value: 'tavily', label: 'Tavily', envKey: 'TAVILY_API_KEY' },
  { value: 'exa', label: 'Exa', envKey: 'EXA_API_KEY' },
  { value: 'you', label: 'You.com', envKey: 'YOU_API_KEY' },
  { value: 'jina', label: 'Jina', envKey: 'JINA_API_KEY' },
  { value: 'brave', label: 'Brave', envKey: 'BRAVE_API_KEY' },
  { value: 'bing', label: 'Bing', envKey: 'BING_API_KEY' },
  { value: 'mojeek', label: 'Mojeek', envKey: 'MOJEEK_API_KEY' },
  { value: 'linkup', label: 'Linkup', envKey: 'LINKUP_API_KEY' },
  { value: 'ddg', label: 'DuckDuckGo (scraping, often rate-limited)' },
  { value: 'custom', label: 'Custom API', envKey: 'WEB_SEARCH_API' },
  { value: 'native', label: 'Native (Anthropic/Codex server-side)' },
]

export const KEYABLE_SEARCH_PROVIDERS = SEARCH_PROVIDER_OPTIONS.filter(
  opt => opt.envKey && opt.value !== 'auto' && opt.value !== 'native',
)
