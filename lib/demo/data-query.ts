export function buildDocumentDiagnosticQuery(documentId: string) {
  return `SELECT "id", "version", "status", "syncStatus"\nFROM "Document"\nWHERE "id" = '${documentId}';`;
}
