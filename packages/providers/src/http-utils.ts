export const ensureSafeBaseUrl = (value: string): string => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('O endpoint deve usar HTTP ou HTTPS.');
  return url.toString().replace(/\/$/, '');
};

export async function* streamSse(response: Response): AsyncIterable<string> {
  if (!response.body) throw new Error('O provider não retornou um stream legível.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';
      for (const event of events) {
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('\n');
        if (data) yield data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const friendlyHttpError = async (response: Response): Promise<Error> => {
  let detail = '';
  try {
    const body = (await response.json()) as {
      error?: { message?: string } | string;
      message?: string;
    };
    detail =
      typeof body.error === 'string' ? body.error : (body.error?.message ?? body.message ?? '');
  } catch {
    detail = '';
  }
  return new Error(
    detail
      ? `O provider recusou a solicitação (${response.status}): ${detail}`
      : `O provider recusou a solicitação (${response.status}).`,
  );
};
