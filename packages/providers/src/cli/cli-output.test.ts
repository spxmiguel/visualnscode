import { describe, expect, it } from 'vitest';
import { CliOutputDecoder } from './cli-output';

describe('CliOutputDecoder', () => {
  it('streams Claude text deltas without repeating the final result', () => {
    const decoder = new CliOutputDecoder('claude-cli');
    const first = decoder.push(
      `${JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Olá ' } },
      })}\n`,
    );
    const second = decoder.push(
      `${JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'mundo' } },
      })}\n${JSON.stringify({
        type: 'result',
        result: 'Olá mundo',
        usage: { input_tokens: 12, output_tokens: 3 },
      })}\n`,
    );

    expect([...first, ...second, ...decoder.flush()]).toEqual(['Olá ', 'mundo']);
    expect(decoder.usage()).toMatchObject({ inputTokens: 12, outputTokens: 3, estimated: false });
  });

  it('extracts the final Codex agent message and measured usage from JSONL', () => {
    const decoder = new CliOutputDecoder('codex-cli');
    const chunks = decoder.push(
      `${JSON.stringify({ type: 'thread.started', thread_id: 'thread-1' })}\n${JSON.stringify({
        type: 'item.completed',
        item: { id: 'item-1', type: 'agent_message', text: 'Resposta segura.' },
      })}\n${JSON.stringify({
        type: 'turn.completed',
        usage: { input_tokens: 90, output_tokens: 10 },
      })}\n`,
    );

    expect(chunks).toEqual(['Resposta segura.']);
    expect(decoder.usage()).toMatchObject({ inputTokens: 90, outputTokens: 10, totalTokens: 100 });
  });

  it('parses the documented Gemini JSON response and token statistics', () => {
    const decoder = new CliOutputDecoder('gemini-cli');
    decoder.push(
      JSON.stringify({
        response: 'Resposta do Gemini.',
        stats: {
          models: {
            'gemini-test': { tokens: { prompt: 20, candidates: 5, total: 25 } },
          },
        },
      }),
    );

    expect(decoder.flush()).toEqual(['Resposta do Gemini.']);
    expect(decoder.usage()).toMatchObject({ inputTokens: 20, outputTokens: 5, estimated: false });
  });

  it('extracts OpenCode text parts from JSON events', () => {
    const decoder = new CliOutputDecoder('opencode');
    const chunks = decoder.push(
      `${JSON.stringify({ type: 'text', part: { type: 'text', text: 'Pronto.' } })}\n`,
    );

    expect(chunks).toEqual(['Pronto.']);
  });

  it('keeps plain Aider output readable', () => {
    const decoder = new CliOutputDecoder('aider');
    expect(decoder.push('linha um\nlinha dois')).toEqual(['linha um\n']);
    expect(decoder.flush()).toEqual(['linha dois\n']);
  });
});
