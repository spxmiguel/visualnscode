import type {
  PermissionId,
  PermissionState,
  ToolActionRequest,
  ToolActionResult,
  ToolDetectionResult,
} from '@visualnscode/integrations/browser';
import type {
  AgentChunk,
  AgentInput,
  AIModel,
  ProviderConnectionResult,
  ProviderSettings,
  ProviderSummary,
} from '@visualnscode/providers/browser';

declare global {
  interface Window {
    readonly visualnscode?: {
      readonly platform: string;
      readonly versions: Readonly<Record<'chrome' | 'electron' | 'node', string>>;
      readonly environment: {
        detectAll(): Promise<readonly ToolDetectionResult[]>;
        detect(toolId: string): Promise<ToolDetectionResult>;
        perform(request: ToolActionRequest): Promise<ToolActionResult>;
        permissions(): Promise<readonly PermissionState[]>;
        setPermission(id: PermissionId, granted: boolean): Promise<readonly PermissionState[]>;
        openDocumentation(toolId: string): Promise<boolean>;
        secretStatus(providerId: string): Promise<{ available: boolean; configured: boolean }>;
        storeSecret(providerId: string, secret: string): Promise<boolean>;
        removeSecret(providerId: string): Promise<boolean>;
      };
      readonly providers: {
        list(): Promise<readonly ProviderSummary[]>;
        update(settings: ProviderSettings): Promise<ProviderSettings>;
        test(providerId: string): Promise<ProviderConnectionResult>;
        models(providerId: string): Promise<readonly AIModel[]>;
      };
      readonly chat: {
        start(payload: { providerId: string; input: AgentInput }): void;
        cancel(requestId: string): Promise<void>;
        onChunk(listener: (chunk: AgentChunk) => void): () => void;
      };
    };
  }
}

export {};
