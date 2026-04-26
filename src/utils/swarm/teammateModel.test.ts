import { afterEach, expect, test } from 'bun:test'

import { getHardcodedTeammateModelFallback } from './teammateModel.js'

const ORIGINAL_ENV = { ...process.env }

function restoreEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key]
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

afterEach(() => {
  restoreEnv()
})

test('getHardcodedTeammateModelFallback returns a Mistral fallback in mistral mode', () => {
  process.env.CLAUDE_CODE_USE_MISTRAL = '1'

  expect(getHardcodedTeammateModelFallback()).toBe('devstral-latest')
})
