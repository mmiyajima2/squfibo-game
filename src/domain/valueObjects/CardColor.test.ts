import { describe, it, expect } from 'vitest';
import { CardColor } from './CardColor';

describe('CardColor', () => {
  it('should have RED and BLUE values', () => {
    expect(CardColor.RED).toBe('RED');
    expect(CardColor.BLUE).toBe('BLUE');
  });

  it('should be usable in comparisons', () => {
    const color1 = CardColor.RED;
    const color2 = CardColor.RED;
    const color3 = CardColor.BLUE;

    expect(color1 === color2).toBe(true);
    expect(color1 === color3).toBe(false);
  });
});
