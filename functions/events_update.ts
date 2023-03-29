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

const events_update = async (event: {name: string, "start_time": {"year": number, "month": number, "day": number, "hour": number, "minute": number}, "end_time": {"year": number, "month": number, "day": number, "hour": number, "minute": number}, "detail": string}) => {
  print(event)
  // Event filter
  // If some field is empty, skip this event
  if (event.name === '' || !event.start_time || !event.end_time || event.detail === '' || !event.name || !event.detail) 
    return
  // Generate an UUID
  let uuid = uuid_fun.v4()
  // Write to database
  let sql = `INSERT INTO events (id, name, start_time, end_time, detail) VALUES (?, ?, ?, ?, ?)`
  let start_time = momenttz().tz('Asia/Shanghai').set({year: event.start_time.year, month: event.start_time.month - 1, date: event.start_time.day, hour: event.start_time.hour, minute: event.start_time.minute, second: 0, millisecond: 0})
  let end_time = momenttz().tz('Asia/Shanghai').set({year: event.end_time.year, month: event.end_time.month - 1, date: event.end_time.day, hour: event.end_time.hour, minute: event.end_time.minute, second: 0, millisecond: 0})
  print(`start: ${start_time.valueOf()}`)
  print(`end: ${end_time.valueOf()}`)
  let params = [uuid, event.name, start_time.valueOf(), end_time.valueOf(), event.detail]
  await db_promise(sql, params)
}

export { events_update }