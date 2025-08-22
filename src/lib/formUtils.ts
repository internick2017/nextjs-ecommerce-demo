// Utility functions for forms (not server actions)

export function getFieldError(errors: Record<string, string[]> | undefined, field: string): string | undefined {
  return errors?.[field]?.[0];
}

export function hasFieldError(errors: Record<string, string[]> | undefined, field: string): boolean {
  return !!errors?.[field]?.length;
}
