export function trimSqlBlank(sql: string) {
  return sql.replace(/\s+/g, ' ').trim()
}
