import { describe, expect, test } from 'bun:test'

import {
  buildMiniMaxUsageRows,
  getMiniMaxUsageUrls,
  normalizeMiniMaxUsagePayload,
} from './minimaxUsage.js'

describe('normalizeMiniMaxUsagePayload', () => {
  test('normalizes interval and weekly quota payloads', () => {
    const usage = normalizeMiniMaxUsagePayload({
      plan_type: 'plus_highspeed',
      data: {
        'MiniMax-M2.7-highspeed': {
          current_interval_usage_count: 4200,
          max_interval_usage_count: 4500,
          current_weekly_usage_count: 43000,
          max_weekly_usage_count: 45000,
        },
      },
    })

    expect(usage).toMatchObject({
      availability: 'available',
      planType: 'Plus Highspeed',
      snapshots: [
        {
          limitName: 'MiniMax-M2.7-highspeed',
          windows: [
            {
              label: '5h limit',
              usedPercent: 93,
              remaining: 300,
              total: 4500,
            },
            {
              label: 'Weekly limit',
              usedPercent: 96,
              remaining: 2000,
              total: 45000,
            },
          ],
        },
      ],
    })
  })

  test('normalizes daily quota payloads from generic usage records', () => {
    const usage = normalizeMiniMaxUsagePayload({
      models: {
        image_01: {
          daily_remaining: 12,
          daily_quota: 50,
        },
      },
    })

    expect(usage).toMatchObject({
      availability: 'available',
      snapshots: [
        {
          limitName: 'image_01',
          windows: [
            {
              label: 'Daily limit',
              usedPercent: 76,
              remaining: 12,
              total: 50,
            },
          ],
        },
      ],
    })
  })

  test('normalizes MiniMax model_remains subscription payloads', () => {
    const usage = normalizeMiniMaxUsagePayload({
      model_remains: [
        {
          start_time: 1771588800000,
          end_time: 1771603200000,
          remains_time: 5925660,
          current_interval_total_count: 1500,
          current_interval_usage_count: 1437,
          model_name: 'MiniMax-M2.7',
        },
      ],
      base_resp: {
        status_code: 0,
        status_msg: 'success',
      },
    })

    expect(usage).toMatchObject({
      availability: 'available',
      snapshots: [
        {
          limitName: 'MiniMax-M2.7',
          windows: [
            {
              label: '5h limit',
              usedPercent: 96,
              remaining: 63,
              total: 1500,
              resetsAt: '2026-02-20T16:00:00.000Z',
            },
          ],
        },
      ],
    })
  })

  test('treats current_interval_usage_count as used count for MiniMax subscription payloads', () => {
    const usage = normalizeMiniMaxUsagePayload({
      model_remains: [
        {
          current_interval_total_count: 1500,
          current_interval_usage_count: 1,
          model_name: 'MiniMax-M2.7',
        },
      ],
    })

    expect(usage).toMatchObject({
      availability: 'available',
      snapshots: [
        {
          limitName: 'MiniMax-M2.7',
          windows: [
            {
              label: '5h limit',
              usedPercent: 0,
              remaining: 1499,
              total: 1500,
            },
          ],
        },
      ],
    })
  })

  test('treats MiniMax usage_percent as remaining percentage', () => {
    const usage = normalizeMiniMaxUsagePayload({
      model_remains: [
        {
          model_name: 'MiniMax-M2.7-highspeed',
          usage_percent: 96,
        },
      ],
    })

    expect(usage).toMatchObject({
      availability: 'available',
      snapshots: [
        {
          limitName: 'MiniMax-M2.7-highspeed',
          windows: [
            {
              label: '5h limit',
              usedPercent: 4,
            },
          ],
        },
      ],
    })
  })

  test('returns unknown availability when no quota windows can be parsed', () => {
    const usage = normalizeMiniMaxUsagePayload({
      message: 'quota status unavailable',
      ok: true,
    })

    expect(usage).toEqual({
      availability: 'unknown',
      planType: undefined,
      snapshots: [],
      message:
        'Usage details are not available for this MiniMax account. This plan or MiniMax endpoint may not expose quota status.',
    })
  })
})

describe('buildMiniMaxUsageRows', () => {
  test('builds provider-prefixed labels and remaining subtext', () => {
    const rows = buildMiniMaxUsageRows([
      {
        limitName: 'MiniMax-M2.7',
        windows: [
          {
            label: '5h limit',
            usedPercent: 20,
            remaining: 1200,
            total: 1500,
          },
          {
            label: 'Weekly limit',
            usedPercent: 10,
            remaining: 13500,
            total: 15000,
          },
        ],
      },
      {
        limitName: 'image_01',
        windows: [
          {
            label: 'Daily limit',
            usedPercent: 76,
            remaining: 12,
            total: 50,
          },
        ],
      },
    ])

    expect(rows).toEqual([
      {
        kind: 'text',
        label: 'MiniMax-M2.7 quota',
        value: '',
      },
      {
        kind: 'window',
        label: '5h limit',
        usedPercent: 20,
        resetsAt: undefined,
        extraSubtext: '1200/1500 remaining',
      },
      {
        kind: 'window',
        label: 'Weekly limit',
        usedPercent: 10,
        resetsAt: undefined,
        extraSubtext: '13500/15000 remaining',
      },
      {
        kind: 'window',
        label: 'Image 01 Daily limit',
        usedPercent: 76,
        resetsAt: undefined,
        extraSubtext: '12/50 remaining',
      },
    ])
  })
})

describe('MiniMax usage helpers', () => {
  test('returns both documented and fallback usage endpoints', () => {
    expect(getMiniMaxUsageUrls('https://api.minimax.io/v1')).toEqual([
      'https://www.minimax.io/v1/token_plan/remains',
      'https://api.minimax.io/v1/token_plan/remains',
      'https://www.minimax.io/v1/api/openplatform/coding_plan/remains',
      'https://api.minimax.io/v1/api/openplatform/coding_plan/remains',
    ])
  })
})
