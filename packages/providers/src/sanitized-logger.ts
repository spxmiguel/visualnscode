const sensitiveKey = /(?:api[-_]?key|authorization|credential|password|secret|token)/i;
const knownSecret = new RegExp(
  [`sk-${'[A-Za-z0-9_-]{12,}'}`, `${'AI'}za[0-9A-Za-z_-]{20,}`, `gh[opusr]_[A-Za-z0-9_]{20,}`].join(
    '|',
  ),
  'g',
);

export const sanitize = (value: unknown): unknown => {
  if (typeof value === 'string') return value.replace(knownSecret, '[REDACTED]');
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitiveKey.test(key) ? '[REDACTED]' : sanitize(entry),
      ]),
    );
  }
  return value;
};

export interface ProviderLogger {
  info(message: string, metadata?: unknown): void;
  error(message: string, metadata?: unknown): void;
}

export class SanitizedLogger implements ProviderLogger {
  constructor(private readonly sink: (entry: string) => void = console.info) {}

  info(message: string, metadata?: unknown): void {
    this.write('info', message, metadata);
  }

  error(message: string, metadata?: unknown): void {
    this.write('error', message, metadata);
  }

  private write(level: string, message: string, metadata?: unknown): void {
    const safe = sanitize(metadata);
    this.sink(
      JSON.stringify({ timestamp: new Date().toISOString(), level, message, metadata: safe }),
    );
  }
}
