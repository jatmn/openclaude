import type { Command } from '../../commands.js'

const websearch = {
  type: 'local-jsx',
  name: 'websearch',
  aliases: ['search'],
  description: 'Search the web or configure search providers',
  argumentHint: '[query | status | provider <name>]',
  load: () => import('./websearch.js'),
} satisfies Command

export default websearch
