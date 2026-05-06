import { useState, useEffect, useCallback } from 'react';
import { onAwarenessChange, setAwarenessUser } from '../yjs/awareness';

export function useSocket(provider, user) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (!provider) return;

    const statusHandler = ({ status }) => setConnectionStatus(status);
    const errorHandler = () => setConnectionStatus('disconnected');

    provider.on('status', statusHandler);
    provider.on('connection-error', errorHandler);
    provider.on('connection-close', errorHandler);

    return () => {
      provider.off('status', statusHandler);
      provider.off('connection-error', errorHandler);
      provider.off('connection-close', errorHandler);
    };
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
    if (provider) provider.disconnect();
  }, [provider]);

  const reconnect = useCallback(() => {
    if (provider) provider.connect();
  }, [provider]);

  return { onlineUsers, connectionStatus, disconnect, reconnect };
}
