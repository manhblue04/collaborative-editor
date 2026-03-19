export function setAwarenessUser(provider, user) {
  if (!provider?.awareness) return;

  provider.awareness.setLocalStateField('user', {
    id: user.id,
    name: user.name,
    color: user.color,
  });
}

export function getAwarenessStates(provider) {
  if (!provider?.awareness) return [];

  const states = [];
  provider.awareness.getStates().forEach((state, clientId) => {
    if (state.user && clientId !== provider.awareness.clientID) {
      states.push({ clientId, ...state.user });
    }
  });
  return states;
}

export function onAwarenessChange(provider, callback) {
  if (!provider?.awareness) return () => {};

  const handler = () => {
    const users = getAwarenessStates(provider);
    callback(users);
  };

  provider.awareness.on('change', handler);
  return () => provider.awareness.off('change', handler);
}
