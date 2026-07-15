export const TITLE_MAX_LENGTH = 200;

/** Todo のタイトルが有効か（空でなく、最大長以内か）を判定する */
export function isValidTitle(title: string): boolean {
  const trimmed = title.trim();
  return trimmed.length > 0 && trimmed.length <= TITLE_MAX_LENGTH;
}
