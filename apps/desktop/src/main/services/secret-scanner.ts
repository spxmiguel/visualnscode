export type SecretType =
  | 'openai-key'
  | 'anthropic-key'
  | 'aws-access-key'
  | 'github-token'
  | 'bearer-token'
  | 'private-key'
  | 'database-url'
  | 'sensitive-file';

export interface SecretMatch {
  readonly type: SecretType;
  readonly line: number;
  readonly redacted: string;
}

const PATTERNS: ReadonlyArray<[SecretType, RegExp]> = [
  ['openai-key', /sk-[A-Za-z0-9]{20,}/g],
  ['anthropic-key', /sk-ant-[A-Za-z0-9\-_]{20,}/g],
  ['aws-access-key', /AKIA[0-9A-Z]{16}/g],
  ['github-token', /ghp_[A-Za-z0-9]{36}/g],
  ['bearer-token', /Bearer\s+[A-Za-z0-9\-_.]{20,}/gi],
  ['private-key', /-----BEGIN\s(?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g],
  ['database-url', /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/g],
];

const SENSITIVE_NAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  'credentials.json',
  'service-account.json',
  '.netrc',
  'id_rsa',
  'id_ed25519',
]);

export function isSensitiveFile(filename: string): boolean {
  return SENSITIVE_NAMES.has(filename) || filename.endsWith('.pem') || filename.endsWith('.key');
}

export function scanForSecrets(filename: string, content: string): SecretMatch[] {
  if (isSensitiveFile(filename)) {
    return [{ type: 'sensitive-file', line: 0, redacted: '[ENTIRE FILE REDACTED]' }];
  }
  const matches: SecretMatch[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    for (const [type, pattern] of PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        matches.push({
          type,
          line: i + 1,
          redacted: line.replace(pattern, '[REDACTED]'),
        });
      }
    }
  }
  return matches;
}

export function redactContent(content: string): string {
  let out = content;
  for (const [, pattern] of PATTERNS) {
    pattern.lastIndex = 0;
    out = out.replace(pattern, '[REDACTED]');
  }
  return out;
}

export type CommandClassification = 'safe' | 'confirm' | 'dangerous' | 'blocked';

const BLOCKED_PATTERNS = [
  /rm\s+-[A-Za-z]*r[A-Za-z]*f/,
  /del\s+\/[sS]/,
  /format\s+[a-zA-Z]:/,
  /diskpart/,
  /shutdown/,
  /mkfs\./,
  /dd\s+if=/,
  />\s*\/dev\//,
];

const DANGEROUS_PATTERNS = [
  /sudo\s/,
  /su\s+-/,
  /chmod\s+777/,
  /chown\s+-R/,
  /git\s+push\s+--force/,
  /npm\s+publish/,
  /pnpm\s+publish/,
];

const CONFIRM_PATTERNS = [
  /npm\s+install/,
  /pnpm\s+install/,
  /yarn\s+add/,
  /bun\s+add/,
  /git\s+push/,
  /git\s+reset/,
  /git\s+stash\s+drop/,
  /git\s+branch\s+-[dD]/,
  /rm\s+/,
  /del\s+/,
  /curl\s+/,
  /wget\s+/,
];

export function classifyCommand(command: string): CommandClassification {
  for (const p of BLOCKED_PATTERNS) {
    if (p.test(command)) return 'blocked';
  }
  for (const p of DANGEROUS_PATTERNS) {
    if (p.test(command)) return 'dangerous';
  }
  for (const p of CONFIRM_PATTERNS) {
    if (p.test(command)) return 'confirm';
  }
  return 'safe';
}
