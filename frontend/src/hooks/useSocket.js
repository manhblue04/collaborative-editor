import { useState, useEffect, useCallback } from 'react';
import { onAwarenessChange, setAwarenessUser } from '../yjs/awareness';

export function useSocket(provider, user) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (!provider) return;

    const statusHandler = ({ status }) => setConnectionStatus(status);
    provider.on('status', statusHandler);

    return () => provider.off('status', statusHandler);
  }, [provider]);

  useEffect(() => {
    if (!provider || !user) return;
    setAwarenessUser(provider, user);
  }, [provider, user]);

  useEffect(() => {
    if (!provider) return;
    return onAwarenessChange(provider, setOnlineUsers);
  }, [provider]);

  const disconnect = useCallback(() => {
    if (provider) {
      provider.disconnect();
    }
  }, [provider]);

  const reconnect = useCallback(() => {
    if (provider) {
      provider.connect();
    }
  }, [provider]);

  return { onlineUsers, connectionStatus, disconnect, reconnect };
}
