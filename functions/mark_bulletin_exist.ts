// Import modules
import Debug from 'debug'
import sqlite3 from 'sqlite3'

// Initial
const print = Debug('abg:functions/mark_bulletin_exist.ts')
const db = new sqlite3.Database('./data.db')

// Transfer sqlite3 to promise
const db_promise = (sql: string, params: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

const mark_bulletin_exist = async (id: number) => {
  // Check if bulletin exist
  let sql = `SELECT * FROM bulletins WHERE id = ?`
  let params = [id]
  let result = await db_promise(sql, params)
  if (result !== undefined) return
  sql = `INSERT INTO bulletins (id) VALUES (?)`
  params = [id]
  await db_promise(sql, params)
}

export { mark_bulletin_exist }
