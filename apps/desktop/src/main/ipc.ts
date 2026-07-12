import { ipcMain, shell } from 'electron';
import {
  getToolDefinition,
  type PermissionId,
  type ToolActionRequest,
} from '@visualnscode/integrations';
import { EnvironmentService } from './services/environment-service';
import { SecureStorage } from './services/secure-storage';

const service = new EnvironmentService();
const secureStorage = new SecureStorage();
const providerIds = new Set(['openai', 'anthropic', 'google']);

export const registerEnvironmentIpc = (): void => {
  ipcMain.handle('environment:detect-all', () => service.detectAll());
  ipcMain.handle('environment:detect', (_event, toolId: string) => service.detect(toolId));
  ipcMain.handle('environment:perform', (_event, request: ToolActionRequest) =>
    service.perform(request),
  );
  ipcMain.handle('environment:permissions', () => service.permissions.list());
  ipcMain.handle('environment:set-permission', (_event, id: PermissionId, granted: boolean) => {
    service.setPermission(id, granted);
    return service.permissions.list();
  });
  ipcMain.handle('environment:open-docs', async (_event, toolId: string) => {
    const definition = getToolDefinition(toolId);
    if (!definition) return false;
    await shell.openExternal(definition.documentationUrl);
    return true;
  });
  ipcMain.handle('environment:secret-status', async (_event, providerId: string) => ({
    available: secureStorage.isSecureAvailable(),
    configured:
      providerIds.has(providerId) && Boolean(await secureStorage.get(`provider:${providerId}`)),
  }));
  ipcMain.handle('environment:store-secret', async (_event, providerId: string, secret: string) => {
    if (!providerIds.has(providerId) || !service.permissions.has('credentials')) return false;
    if (secret.length < 8 || secret.length > 4096) return false;
    await secureStorage.set(`provider:${providerId}`, secret);
    return true;
  });
  ipcMain.handle('environment:remove-secret', async (_event, providerId: string) => {
    if (!providerIds.has(providerId) || !service.permissions.has('credentials')) return false;
    await secureStorage.remove(`provider:${providerId}`);
    return true;
  });
};
