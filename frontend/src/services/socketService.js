import { WS_URL } from '../utils/constants';

class SocketService {
  constructor() {
    this.connections = new Map();
  }

  getConnectionUrl(documentId) {
    return `${WS_URL}/${documentId}`;
  }

  isConnected(documentId) {
    return this.connections.has(documentId);
  }

  addConnection(documentId, provider) {
    this.connections.set(documentId, provider);
  }

  removeConnection(documentId) {
    const provider = this.connections.get(documentId);
    if (provider) {
      provider.destroy();
      this.connections.delete(documentId);
    }
  }

  removeAll() {
    this.connections.forEach((provider) => provider.destroy());
    this.connections.clear();
  }
}

export const socketService = new SocketService();
