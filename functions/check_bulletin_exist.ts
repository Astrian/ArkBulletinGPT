// Imports
import Debug from 'debug'
import sqlite3 from 'sqlite3'

// Initialize
let print = Debug('abg:functions/database_checker.ts')
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

const check_bulletin_exist = async (bulletin_id: number): Promise<Boolean> => {
  let sql = `SELECT * FROM bulletins WHERE id = ?`
  let params = [bulletin_id]
  let result = await db_promise(sql, params)
  print(bulletin_id)
  print(result)
  if (result === undefined) {
    return false
  }
  return true
}

// Export
export { check_bulletin_exist }