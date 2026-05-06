import { WebsocketProvider } from 'y-websocket';
import { WS_URL } from '../utils/constants';

export function createWebsocketProvider(ydoc, documentId, token) {
  const params = token ? { token } : {};
  const provider = new WebsocketProvider(WS_URL, documentId, ydoc, { params });

  provider.on('status', ({ status }) => {
    console.log(`[y-websocket] ${documentId}: ${status}`);
  });

  provider.on('connection-error', (event) => {
    console.error(`[y-websocket] ${documentId} connection error:`, event);
  });

  return provider;
}

export function destroyProvider(provider) {
  if (!provider) return;
  provider.disconnect();
  provider.destroy();
}
