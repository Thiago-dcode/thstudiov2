/** Match legacy `.ts` rows and current `.js` dist filenames for the same migration. */
export const migrationNameAliases = (filename: string): string[] => {
  const base = filename.replace(/\.(ts|js)$/, '');
  return [...new Set([filename, `${base}.ts`, `${base}.js`, base])];
};

export const migrationNamesMatch = (
  fileName: string,
  dbName: string,
): boolean => {
  return (
    fileName.replace(/\.(ts|js)$/, '') === dbName.replace(/\.(ts|js)$/, '')
  );
};
