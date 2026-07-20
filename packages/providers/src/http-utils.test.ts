import { describe, expect, it } from 'vitest';
import { ensureSafeBaseUrl } from './http-utils';

describe('ensureSafeBaseUrl', () => {
  it('requires transport encryption for remote providers', () => {
    expect(() => ensureSafeBaseUrl('http://api.example.com/v1', 'remote')).toThrow(
      'Providers remotos exigem HTTPS',
    );
    expect(ensureSafeBaseUrl('https://api.example.com/v1/', 'remote')).toBe(
      'https://api.example.com/v1',
    );
  });

  it('allows loopback HTTP and explicitly local providers', () => {
    expect(ensureSafeBaseUrl('http://127.0.0.1:11434/v1', 'remote')).toBe(
      'http://127.0.0.1:11434/v1',
    );
    expect(ensureSafeBaseUrl('http://192.168.1.20:11434/v1', 'local')).toBe(
      'http://192.168.1.20:11434/v1',
    );
  });

  it('rejects credentials embedded in endpoint URLs', () => {
    expect(() => ensureSafeBaseUrl('https://user:secret@api.example.com/v1')).toThrow(
      'não pode conter credenciais',
    );
  });
});
