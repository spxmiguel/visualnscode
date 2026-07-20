import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const forbiddenNames = [
  /(^|\/)\.env(?:\..+)?$/,
  /(^|\/)(?:credentials|service-account|serviceAccount).*\.json$/i,
  /(^|\/)firebase-adminsdk.*\.json$/i,
  /\.(?:pem|key|p12|pfx|jks|keystore|crt|cer)$/i,
  /(^|\/)\.netrc$/,
];

const binaryExtensions = new Set([
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.lock',
  '.pdf',
  '.png',
  '.svg',
  '.webp',
]);

const privateKeyHeader = `-----BEGIN (RSA |EC |OPENSSH |DSA )?${'PRIVATE'} KEY-----`;

const secretPatterns = [
  ['chave privada', new RegExp(privateKeyHeader)],
  ['token GitHub', new RegExp(`gh[opusr]_[A-Za-z0-9_]{20,}`)],
  ['chave OpenAI', new RegExp(`sk-${'(?:proj-|svcacct-)?'}[A-Za-z0-9_-]{20,}`)],
  ['chave Anthropic', new RegExp(`sk-${'ant-'}[A-Za-z0-9_-]{20,}`)],
  ['chave Google', new RegExp(`${'AI'}za[0-9A-Za-z_-]{30,}`)],
  ['access key AWS', new RegExp(`${'AKIA'}[0-9A-Z]{16}`)],
];

const historyPattern = [
  privateKeyHeader,
  `gh[opusr]_[A-Za-z0-9_]{20,}`,
  `sk-${'(proj-|svcacct-)?'}[A-Za-z0-9_-]{20,}`,
  `sk-${'ant-'}[A-Za-z0-9_-]{20,}`,
  `${'AI'}za[0-9A-Za-z_-]{30,}`,
  `${'AKIA'}[0-9A-Z]{16}`,
].join('|');

const findings = [];

for (const file of trackedFiles) {
  if (file === '.env.example') continue;
  if (forbiddenNames.some((pattern) => pattern.test(file))) {
    findings.push(`${file}: nome de arquivo sensível`);
    continue;
  }
  if (binaryExtensions.has(extname(file))) continue;

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(content)) findings.push(`${file}: possível ${label}`);
  }
}

const revisions = execFileSync('git', ['rev-list', '--all'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

for (const revision of revisions) {
  const result = spawnSync(
    'git',
    [
      'grep',
      '-I',
      '-l',
      '-E',
      '-e',
      historyPattern,
      revision,
      '--',
      '.',
      ':(exclude)pnpm-lock.yaml',
    ],
    { encoding: 'utf8' },
  );
  if (result.status === 0) {
    for (const match of result.stdout.split('\n').filter(Boolean)) {
      findings.push(`${match.replace(`${revision}:`, '')}: possível segredo no histórico`);
    }
  } else if (result.status !== 1) {
    findings.push(`não foi possível auditar o commit ${revision.slice(0, 8)}`);
  }
}

if (findings.length > 0) {
  console.error('Auditoria de segurança bloqueou a operação:');
  for (const finding of findings) console.error(`- ${finding}`);
  console.error('Remova o segredo do arquivo e também do histórico Git antes de publicar.');
  process.exit(1);
}

console.log(
  `Auditoria concluída: ${trackedFiles.length} arquivos e ${revisions.length} commits sem segredos conhecidos.`,
);
