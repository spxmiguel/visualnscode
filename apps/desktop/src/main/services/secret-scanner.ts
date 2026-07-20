import path from 'node:path';

export type SecretType =
  | 'openai-key'
  | 'anthropic-key'
  | 'google-key'
  | 'aws-access-key'
  | 'github-token'
  | 'generic-token'
  | 'bearer-token'
  | 'private-key'
  | 'database-url'
  | 'sensitive-file';

export interface SecretMatch {
  readonly type: SecretType;
  readonly line: number;
  readonly redacted: string;
}

export interface ContextFileInput {
  readonly path: string;
  readonly content: string;
}

export interface RedactedContextFile extends ContextFileInput {
  readonly findings: readonly SecretMatch[];
  readonly omitted: boolean;
}

const PATTERNS: ReadonlyArray<readonly [SecretType, RegExp]> = [
  ['anthropic-key', /sk-ant-[A-Za-z0-9_-]{20,}/g],
  ['openai-key', /sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}/g],
  ['google-key', /AIza[0-9A-Za-z_-]{30,}/g],
  ['aws-access-key', /AKIA[0-9A-Z]{16}/g],
  ['github-token', /gh[opusr]_[A-Za-z0-9_]{20,}/g],
  ['bearer-token', /Bearer\s+[A-Za-z0-9._~+/=-]{16,}/gi],
  [
    'generic-token',
    /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}["']?/gi,
  ],
  ['private-key', /-----BEGIN\s(?:RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/g],
  ['database-url', /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:@]+:[^\s@]+@/gi],
];

const SENSITIVE_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  '.netrc',
  '.npmrc',
  '.pypirc',
  'credentials.json',
  'service-account.json',
  'serviceaccount.json',
  'id_rsa',
  'id_dsa',
  'id_ecdsa',
  'id_ed25519',
]);

const SENSITIVE_EXTENSIONS = new Set([
  '.pem',
  '.key',
  '.p12',
  '.pfx',
  '.jks',
  '.keystore',
  '.crt',
  '.cer',
]);

const normalizeFilename = (filename: string): string =>
  filename.replaceAll('\\', '/').toLowerCase();

export function isSensitiveFile(filename: string): boolean {
  const normalized = normalizeFilename(filename);
  const basename = path.posix.basename(normalized);
  if (basename === '.env.example') return false;
  return (
    SENSITIVE_BASENAMES.has(basename) ||
    basename.startsWith('.env.') ||
    basename.startsWith('firebase-adminsdk') ||
    basename.startsWith('service-account') ||
    SENSITIVE_EXTENSIONS.has(path.posix.extname(basename)) ||
    normalized.includes('/.ssh/') ||
    normalized.startsWith('.ssh/')
  );
}

export function scanForSecrets(filename: string, content: string): SecretMatch[] {
  if (isSensitiveFile(filename)) {
    return [{ type: 'sensitive-file', line: 0, redacted: '[ENTIRE FILE REDACTED]' }];
  }
  const matches: SecretMatch[] = [];
  const lines = content.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    for (const [type, pattern] of PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        pattern.lastIndex = 0;
        matches.push({
          type,
          line: index + 1,
          redacted: line.replace(pattern, '[REDACTED]'),
        });
      }
    }
  }
  return matches;
}

export function redactContent(content: string): string {
  let output = content;
  for (const [, pattern] of PATTERNS) {
    pattern.lastIndex = 0;
    output = output.replace(pattern, '[REDACTED]');
  }
  return output;
}

export function prepareRemoteContext(files: readonly ContextFileInput[]): RedactedContextFile[] {
  return files.map((file) => {
    const findings = scanForSecrets(file.path, file.content);
    const omitted = findings.some(({ type }) => type === 'sensitive-file');
    return {
      path: file.path,
      content: omitted ? '[SENSITIVE FILE OMITTED]' : redactContent(file.content),
      findings,
      omitted,
    };
  });
}

export type CommandClassification = 'safe' | 'confirm' | 'dangerous' | 'blocked';

export interface CommandPolicy {
  readonly globallyAllowed: boolean;
  readonly yoloEnabled: boolean;
  readonly explicitAcknowledgement: boolean;
}

export interface CommandAssessment {
  readonly classification: CommandClassification;
  readonly allowed: boolean;
  readonly requiresConfirmation: boolean;
  readonly reason: string;
}

const BLOCKED_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\brm\s+(?:-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b/i, 'Exclusão recursiva forçada bloqueada.'],
  [/\bdel\s+\/(?:s|q(?:\s+\/s)?)\b/i, 'Exclusão recursiva do Windows bloqueada.'],
  [
    /\b(?:format(?:\.com)?\s+[a-z]:|diskpart|mkfs(?:\.[a-z0-9]+)?|shutdown)(?:\s|$)/i,
    'Comando destrutivo do sistema bloqueado.',
  ],
  [/\bdd\s+[^\n]*\b(?:of=\/dev\/|if=\/dev\/)/i, 'Acesso bruto a disco bloqueado.'],
  [/(?:^|[;&|]\s*)\s*:?>\s*\/dev\/(?:sd|disk|nvme)/i, 'Escrita direta em dispositivo bloqueada.'],
  [
    /\b(?:Remove-Item|rmdir)\b[^\n]*(?:-Recurse[^\n]*-Force|-Force[^\n]*-Recurse)/i,
    'Exclusão recursiva forçada bloqueada.',
  ],
];

const DANGEROUS_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:sudo|doas)\b|\bsu\s+-/i, 'Comando administrativo exige confirmação reforçada.'],
  [
    /\bchmod\s+(?:-R\s+)?777\b|\bchown\s+-R\b/i,
    'Alteração ampla de permissões exige confirmação reforçada.',
  ],
  [/\bgit\s+push\b[^\n]*(?:--force|-f\b)/i, 'Push forçado pode reescrever o histórico remoto.'],
  [/\b(?:npm|pnpm|yarn)\s+publish\b/i, 'Publicação de pacote exige confirmação reforçada.'],
  [
    /\b(?:curl|wget)\b[^\n]*(?:--upload-file|-T\s)|\b(?:scp|sftp)\b/i,
    'Envio de arquivos para serviço externo exige confirmação reforçada.',
  ],
  [
    /(?:^|\s)(?:>|>>)\s*(?:\/|~\/|[a-z]:[\\/])/i,
    'Escrita fora do workspace exige confirmação reforçada.',
  ],
];

const CONFIRM_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /\b(?:npm\s+(?:install|i)|pnpm\s+(?:install|add)|yarn\s+(?:install|add)|bun\s+(?:install|add))\b/i,
    'Instalação de dependências requer confirmação.',
  ],
  [
    /\bgit\s+(?:push|reset|clean|stash\s+drop|branch\s+-[dD])\b/i,
    'A operação Git pode alterar ou publicar estado.',
  ],
  [/\b(?:rm|del|rmdir|Remove-Item)\b/i, 'Exclusão requer confirmação.'],
  [/\b(?:curl|wget)\b/i, 'Acesso de rede requer confirmação.'],
];

const matchRule = (
  command: string,
  rules: ReadonlyArray<readonly [RegExp, string]>,
): string | null => {
  for (const [pattern, reason] of rules) {
    pattern.lastIndex = 0;
    if (pattern.test(command)) return reason;
  }
  return null;
};

export function classifyCommand(command: string): CommandClassification {
  if (!command.trim() || command.includes('\0') || command.length > 4_000) return 'blocked';
  if (matchRule(command, BLOCKED_PATTERNS)) return 'blocked';
  if (matchRule(command, DANGEROUS_PATTERNS)) return 'dangerous';
  if (matchRule(command, CONFIRM_PATTERNS)) return 'confirm';
  return 'safe';
}

export function assessCommand(command: string, policy: CommandPolicy): CommandAssessment {
  const blockedReason = matchRule(command, BLOCKED_PATTERNS);
  if (blockedReason || !command.trim() || command.includes('\0') || command.length > 4_000) {
    return {
      classification: 'blocked',
      allowed: false,
      requiresConfirmation: false,
      reason: blockedReason ?? 'Comando vazio ou inválido bloqueado.',
    };
  }

  const dangerousReason = matchRule(command, DANGEROUS_PATTERNS);
  if (dangerousReason) {
    return {
      classification: 'dangerous',
      allowed: true,
      requiresConfirmation: true,
      reason: dangerousReason,
    };
  }

  const confirmReason = matchRule(command, CONFIRM_PATTERNS);
  if (confirmReason) {
    const yoloActive =
      policy.globallyAllowed && policy.yoloEnabled && policy.explicitAcknowledgement;
    return {
      classification: 'confirm',
      allowed: true,
      requiresConfirmation: !yoloActive,
      reason: yoloActive ? 'Modo YOLO ativo para esta ação não destrutiva.' : confirmReason,
    };
  }

  return {
    classification: 'safe',
    allowed: true,
    requiresConfirmation: false,
    reason: 'Comando classificado como seguro dentro do workspace.',
  };
}
