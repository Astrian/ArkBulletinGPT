// Import modules
import Debug from 'debug'
import * as uuid_fun from 'uuid'
import sqlite3 from 'sqlite3'

// Initial
const print = Debug('abg:functions/events_update.ts')
const db = new sqlite3.Database('./data.db')

// Transfer sqlite3 to promise
const db_promise = (sql: string, params: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

const events_update = async (event: {name: string, "start_time": number, "end_time": number, "detail": string}) => {
  // Generate an UUID
  let uuid = uuid_fun.v4()
  // Write to database
  let sql = `INSERT INTO events (id, name, start_time, end_time, detail) VALUES (?, ?, ?, ?, ?)`
  let params = [uuid, event.name, event.start_time, event.end_time, event.detail]
  await db_promise(sql, params)
}

export { events_update }