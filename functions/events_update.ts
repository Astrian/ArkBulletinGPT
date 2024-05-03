/// <reference path="../types.d.ts" />

// Import modules
import Debug from 'debug'
import * as uuid_fun from 'uuid'
import sqlite3 from 'sqlite3'
import momenttz from 'moment-timezone'

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

const events_update = async (event: GameEvent) => {
  print('events_update()')
  print(event)
  // Event filter
  // If some field is empty, skip this event
  if (event.name === '' || !event.start_time || !event.end_time || event.detail === '' || !event.name || !event.detail) 
    return
  // Generate an UUID
  let uuid = uuid_fun.v4()
  // Write to database
  let sql = `INSERT INTO events (id, name, start_time, end_time, detail) VALUES (?, ?, ?, ?, ?)`
  let start_time = event.start_time
  let end_time = event.end_time
  print(`start: ${start_time.valueOf()}`)
  print(`end: ${end_time.valueOf()}`)
  if (isNaN(start_time.valueOf()) || isNaN(end_time.valueOf())) return
  let params = [uuid, event.name, start_time.valueOf(), end_time.valueOf(), event.detail]
  await db_promise(sql, params)
}

export { events_update }