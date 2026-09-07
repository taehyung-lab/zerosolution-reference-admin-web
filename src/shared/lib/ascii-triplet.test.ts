import { describe, expect, it } from 'vitest';
import { hasRepeatedOrSequentialAsciiTriplet } from './ascii-triplet';

describe('ASCII triplet patterns', () => {
  it.each(['aBc', 'CbA', 'aAa', '012', '987', '777', '!xYz!'])('detects %s without case sensitivity', (value) => {
    expect(hasRepeatedOrSequentialAsciiTriplet(value)).toBe(true);
  });
  it.each(['', 'aa', 'a1a', 'a-b-c', '890', '가가가', '!!!', '135', 'abD'])('does not invent a pattern in %s', (value) => {
    expect(hasRepeatedOrSequentialAsciiTriplet(value)).toBe(false);
  });
});
