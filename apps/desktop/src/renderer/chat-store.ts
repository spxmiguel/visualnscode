import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TokenUsage } from '@visualnscode/providers/browser';

export interface ChatMessage {
  readonly id: string;
  readonly requestId: string | null;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly providerId: string;
  readonly model: string;
  readonly contextFiles: readonly string[];
  readonly status: 'complete' | 'streaming' | 'error' | 'cancelled';
  readonly usage: TokenUsage | null;
  readonly createdAt: string;
}

interface BeginRequest {
  readonly content: string;
  readonly providerId: string;
  readonly model: string;
  readonly contextFiles: readonly string[];
}

interface ChatState {
  readonly activeRequestId: string | null;
  readonly messages: readonly ChatMessage[];
  readonly selectedModel: string;
  readonly selectedProviderId: string;
  readonly append: (requestId: string, text: string) => void;
  readonly begin: (request: BeginRequest) => string;
  readonly cancel: (requestId: string) => void;
  readonly clear: () => void;
  readonly fail: (requestId: string, message: string) => void;
  readonly finish: (requestId: string) => void;
  readonly setSelection: (providerId: string, model: string) => void;
  readonly setUsage: (requestId: string, usage: TokenUsage) => void;
}

const requestId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      activeRequestId: null,
      messages: [],
      selectedModel: '',
      selectedProviderId: '',
      append: (id, text) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.requestId === id && message.role === 'assistant'
              ? { ...message, content: message.content + text }
              : message,
          ),
        })),
      begin: ({ content, providerId, model, contextFiles }) => {
        const id = requestId();
        const now = new Date().toISOString();
        set((state) => ({
          activeRequestId: id,
          messages: [
            ...state.messages,
            {
              id: `user-${id}`,
              requestId: null,
              role: 'user',
              content,
              providerId,
              model,
              contextFiles,
              status: 'complete',
              usage: null,
              createdAt: now,
            },
            {
              id: `assistant-${id}`,
              requestId: id,
              role: 'assistant',
              content: '',
              providerId,
              model,
              contextFiles,
              status: 'streaming',
              usage: null,
              createdAt: now,
            },
          ],
        }));
        return id;
      },
      cancel: (id) =>
        set((state) => ({
          activeRequestId: state.activeRequestId === id ? null : state.activeRequestId,
          messages: state.messages.map((message) =>
            message.requestId === id ? { ...message, status: 'cancelled' } : message,
          ),
        })),
      clear: () => set({ activeRequestId: null, messages: [] }),
      fail: (id, error) =>
        set((state) => ({
          activeRequestId: state.activeRequestId === id ? null : state.activeRequestId,
          messages: state.messages.map((message) =>
            message.requestId === id
              ? { ...message, content: message.content || error, status: 'error' }
              : message,
          ),
        })),
      finish: (id) =>
        set((state) => ({
          activeRequestId: state.activeRequestId === id ? null : state.activeRequestId,
          messages: state.messages.map((message) =>
            message.requestId === id ? { ...message, status: 'complete' } : message,
          ),
        })),
      setSelection: (selectedProviderId, selectedModel) =>
        set({ selectedProviderId, selectedModel }),
      setUsage: (id, usage) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.requestId === id ? { ...message, usage } : message,
          ),
        })),
    }),
    {
      name: 'visualnscode-chat-history',
      partialize: ({ messages, selectedModel, selectedProviderId }) => ({
        messages: messages.map((message) =>
          message.status === 'streaming' ? { ...message, status: 'cancelled' as const } : message,
        ),
        selectedModel,
        selectedProviderId,
      }),
      storage: createJSONStorage(() => window.localStorage),
      version: 1,
    },
  ),
);
