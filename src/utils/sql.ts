export function trimSqlBlank(sql: string) {
  return sql.replace(/[ \t]+/g, ' ').replace(/\n+/g, ' \n ').trim()
}
