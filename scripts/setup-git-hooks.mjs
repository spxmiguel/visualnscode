import { execFileSync } from 'node:child_process';

try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'core.hooksPath', '.githooks']);
  console.log('Git hooks do VisualnsCode configurados.');
} catch {
  console.log('Git hooks não configurados: diretório sem repositório Git.');
}
