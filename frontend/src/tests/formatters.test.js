import { describe, it, expect } from 'vitest';
import { formatINR, formatDate, INDIAN_DESTINATIONS } from '../utils/formatters';

describe('Formatters and Constants', () => {
  it('formats amounts in Indian Rupee format with commas', () => {
    const formatted = formatINR(125000);
    // Should contain ₹ and 1,25,000 (accounting for potential non-breaking spaces)
    expect(formatted).toContain('₹');
    expect(formatted.replace(/\s+/g, '')).toContain('1,25,000');
  });

  it('handles null, undefined or 0 gracefully', () => {
    expect(formatINR(0)).toContain('0');
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
  });

  it('includes key Indian destinations in autocomplete suggestions', () => {
    expect(INDIAN_DESTINATIONS).toContain('Indore');
    expect(INDIAN_DESTINATIONS).toContain('Bhopal');
    expect(INDIAN_DESTINATIONS).toContain('Jaipur');
    expect(INDIAN_DESTINATIONS).toContain('Goa');
    expect(INDIAN_DESTINATIONS).toContain('Varanasi');
  });
});
