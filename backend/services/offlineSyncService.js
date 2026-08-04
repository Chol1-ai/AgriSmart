const pendingOperations = [];

const enqueueOperations = async (operations) => {
  if (!Array.isArray(operations)) {
    throw new Error('Operations must be an array');
  }

  operations.forEach((operation) => {
    if (operation && operation.type) {
      pendingOperations.push({
        ...operation,
        timestamp: operation.timestamp || new Date().toISOString()
      });
    }
  });

  return pendingOperations.length;
};

const listPendingOperations = async () => [...pendingOperations];

const resolvePendingOperations = async () => {
  const resolved = [];
  const uniqueMap = new Map();

  while (pendingOperations.length) {
    const item = pendingOperations.shift();
    uniqueMap.set(item.id || `${item.type}:${item.timestamp}`, item);
  }

  for (const operation of uniqueMap.values()) {
    resolved.push(operation);
  }

  return { resolved, count: resolved.length };
};

module.exports = { enqueueOperations, listPendingOperations, resolvePendingOperations };
