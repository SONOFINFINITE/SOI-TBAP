import { describe, it, expect } from 'vitest'
import {
  COMMAND_TYPE_LABELS,
  COMMAND_TYPE_DESCRIPTIONS,
  TYPES_REQUIRING_VARIANTS,
} from '@/types/api'
import type { CommandType } from '@/types/api'

describe('API types', () => {
  const allTypes: CommandType[] = [
    'simple',
    'random_reply',
    'random_target',
    'random_target_action',
    'random_percent_target',
    'random_range',
  ]

  it('COMMAND_TYPE_LABELS covers all types', () => {
    allTypes.forEach((t) => {
      expect(COMMAND_TYPE_LABELS[t]).toBeDefined()
      expect(typeof COMMAND_TYPE_LABELS[t]).toBe('string')
      expect(COMMAND_TYPE_LABELS[t].length).toBeGreaterThan(0)
    })
  })

  it('COMMAND_TYPE_DESCRIPTIONS covers all types', () => {
    allTypes.forEach((t) => {
      expect(COMMAND_TYPE_DESCRIPTIONS[t]).toBeDefined()
      expect(typeof COMMAND_TYPE_DESCRIPTIONS[t]).toBe('string')
    })
  })

  it('TYPES_REQUIRING_VARIANTS contains correct types', () => {
    expect(TYPES_REQUIRING_VARIANTS).toContain('random_reply')
    expect(TYPES_REQUIRING_VARIANTS).toContain('random_target_action')
    expect(TYPES_REQUIRING_VARIANTS).toContain('random_range')
    expect(TYPES_REQUIRING_VARIANTS).not.toContain('simple')
    expect(TYPES_REQUIRING_VARIANTS).not.toContain('random_target')
    expect(TYPES_REQUIRING_VARIANTS).not.toContain('random_percent_target')
  })
})
