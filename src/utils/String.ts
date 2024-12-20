export function isSequentialMatch(text: string, searchChars: string[]): boolean {
  let currentPos = 0
  for (const char of searchChars) {
    const index = text.indexOf(char, currentPos)
    if (index === -1) return false
    currentPos = index + 1
  }
  return true
}
