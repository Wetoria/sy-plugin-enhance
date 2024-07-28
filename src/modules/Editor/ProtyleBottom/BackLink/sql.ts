import { sql } from '@/api'

function removeExtraSpaces(sqlString) {
  return sqlString.replace(/\s+/g,' ').trim();
}

function queryBySqlStmt(str) {
  return sql(removeExtraSpaces(str))
}


// 根据任意 id 列表，查询容器块 id 列表的 sql
export function sqlOfGetContainerBlockIds(nodeIds: string[], needHeading = false) {
  const containerBlockTypes = [
    'i',
    'b',
    's',
  ]

  if (needHeading) {
    containerBlockTypes.push('h')
  }

  const sqlStmt = `
    SELECT CASE
        WHEN type IN (${containerBlockTypes.map(i => `'${i}'`).join(',')}) THEN id
        ELSE parent_id
    END AS ref_id
    FROM blocks
    WHERE id IN (
      ${nodeIds.map(i => `'${i}'`).join(',')}
    )
  `

  return sqlStmt
}

// 根据块 id 列表，查询所有的父级数据
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
  return queryBySqlStmt(sqlStmt)
}

// 根据容器块 id 列表，查询所有的子级
export async function getChildNodesBySql(nodeIds: string[]) {
  const sqlStmt = `
  WITH RECURSIVE childList AS (
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
    JOIN childList ct ON c.parent_id = ct.id and c.root_id = ct.root_id
  )
  select * from childList
  `

  return queryBySqlStmt(sqlStmt)
}

// 根据任意块 id 列表，查询所有的子级。
// 如果是叶子块，会根据上级 id 进行查询
export async function getChildNodesBySqlWithAnyLevelIds(nodeIds: string[], needHeading: boolean = false) {


  const sqlStmt = `
    WITH RECURSIVE childList AS (
      SELECT
        b.id,
        b.parent_id,
        b.root_id,
        b.content,
        b.fcontent,
        b.markdown,
        b.type,
        b.subtype
      FROM blocks b
      JOIN (
          ${sqlOfGetContainerBlockIds(nodeIds, needHeading)}
      ) sub ON b.id = sub.ref_id
      where b.type <> 'd'
      UNION
      SELECT c.id, c.parent_id, c.root_id, c.content, c.fcontent, c.markdown, c.type, c.subtype
      FROM blocks c
      JOIN childList ct ON c.parent_id = ct.id AND c.root_id = ct.root_id
    )
    SELECT * FROM childList;
  `

  return queryBySqlStmt(sqlStmt)
}
