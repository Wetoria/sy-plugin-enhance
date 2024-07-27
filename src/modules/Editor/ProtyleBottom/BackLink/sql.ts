import { sql } from '@/api'

export async function getParentNodesBySql(nodeIds: string[]) {
  const sqlStmt = `
  WITH RECURSIVE parentList AS (
    SELECT
      id,
      parent_id,
      root_id,
      content,
      fcontent,
      markdown,
      type,
      subtype
    FROM blocks
    WHERE id in (
      ${nodeIds.map(i => `'${i}'`).join(',')}
    )
    UNION
    SELECT c.id, c.parent_id, c.root_id, c.content, c.fcontent, c.markdown, c.type, c.subtype
    FROM blocks c
    JOIN parentList ct ON c.id = ct.parent_id and c.root_id = ct.root_id
  )
  select * from parentList
  `
  return sql(sqlStmt)
}

export async function getChildNodesBySql(nodeIds: string[]) {
  const sqlStmt = `
  WITH RECURSIVE parentList AS (
    SELECT
      id,
      parent_id,
      root_id,
      content,
      fcontent,
      markdown,
      type,
      subtype
    FROM blocks
    WHERE id in (
      ${nodeIds.map(i => `'${i}'`).join(',')}
    )
    UNION
    SELECT c.id, c.parent_id, c.root_id, c.content, c.fcontent, c.markdown, c.type, c.subtype
    FROM blocks c
    JOIN parentList ct ON c.parent_id = ct.id and c.root_id = ct.root_id
  )
  select * from parentList
  `

  return sql(sqlStmt)
}
