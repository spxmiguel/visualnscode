import type {
  PermissionId,
  PermissionState,
  ToolActionRequest,
  ToolActionResult,
  ToolDetectionResult,
} from '@visualnscode/integrations/browser';

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
    };
  }
}

export {};
