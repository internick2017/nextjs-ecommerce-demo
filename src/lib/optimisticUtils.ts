// Utility functions for optimistic operations (not server actions)

export function createOptimisticId(): string {
  return `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isOptimisticId(id: string | number): boolean {
  return typeof id === 'string' && id.startsWith('optimistic_');
}
