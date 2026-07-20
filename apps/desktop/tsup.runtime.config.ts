import type { Options } from 'tsup';
import baseConfig from './tsup.config';

const config = baseConfig as Options;

export default {
  ...config,
  noExternal: [...(config.noExternal ?? []), /@visualnscode\//],
} satisfies Options;
