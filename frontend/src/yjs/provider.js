import { WebsocketProvider } from 'y-websocket';
import { WS_URL } from '../utils/constants';

export function createWebsocketProvider(ydoc, documentId) {
  const provider = new WebsocketProvider(WS_URL, documentId, ydoc);

  provider.on('status', ({ status }) => {
    console.log(`[y-websocket] ${documentId}: ${status}`);
  });

  return provider;
}

export function destroyProvider(provider) {
  if (provider) {
    provider.disconnect();
    provider.destroy();
  }
}
