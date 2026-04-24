export function canSaveToVaultFromHistory(bookTitle?: string): boolean {
  return !!bookTitle?.trim();
}
