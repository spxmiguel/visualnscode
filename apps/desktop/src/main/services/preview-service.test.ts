// @vitest-environment node
import { createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { PreviewService, isLocalUrl } from './preview-service';

describe('PreviewService', () => {
  const preview = new PreviewService();
  let source: ReturnType<typeof createServer> | null = null;

  afterEach(async () => {
    await preview.stop();
    await new Promise<void>((resolve) => source?.close(() => resolve()) ?? resolve());
    source = null;
  });

  it('proxies local HTML and injects the isolated inspector bridge', async () => {
    source = createServer((_request, response) =>
      response.end('<html><head></head><body><button>Save</button></body></html>'),
    );
    await new Promise<void>((resolve) => source!.listen(0, '127.0.0.1', resolve));
    const address = source.address();
    if (!address || typeof address === 'string') throw new Error('missing port');

    const proxyUrl = await preview.connect(`http://127.0.0.1:${address.port}`);
    const html = await fetch(proxyUrl).then((response) => response.text());

    expect(html).toContain('data-visualnscode-preview');
    expect(html).toContain("source:'visualnscode-preview'");
    expect(html).toContain('<button>Save</button>');
  });

  it('refuses non-local preview targets', () => {
    expect(() => isLocalUrl('https://example.com')).toThrow(/servidores locais/i);
  });
});
