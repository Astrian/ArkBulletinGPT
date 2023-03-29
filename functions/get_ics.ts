// Import modules
import Debug from 'debug'
import sqlite3 from 'sqlite3'
import moment from 'moment'

// Initial
const print = Debug('abg:functions/get_ics.ts')
const db = new sqlite3.Database('./data.db')

// Transfer sqlite3 to promise
// Transfer sqlite3 to promise
const db_promise = (sql: string, params: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

const get_ics = async (): Promise<string> => {
  // Fetch events from database, order by start_time
  let sql = `SELECT * FROM events ORDER BY start_time`
  let params: never[] = []
  let result: [{id: string, name: string, "start_time": number, "end_time": number, "detail": string}] = await db_promise(sql, params)

  // ICS string
  let ics_string = ""

  for (let i in result) {
    let event = result[i]
    let id = event.id
    let start_time = new Date(event.start_time)
    let end_time = new Date(event.end_time)
    let start_time_string = moment(start_time).format('YYYYMMDDTHHmmSS')
    let end_time_string = moment(end_time).format('YYYYMMDDTHHmmSS')
    let event_string = `BEGIN:VEVENT\n` +
      `UID:${id}\n` +
      `DTSTAMP:${start_time_string}\n` +
      `DTSTART:${start_time_string}\n` +
      `DTEND:${end_time_string}\n` +
      `SUMMARY:${event.name}\n` +
      `DESCRIPTION:${event.detail}` +
      `END:VEVENT\n`
    ics_string += event_string
  }

  return `BEGIN:VCALENDAR\n` +
    `VERSION:2.0\n` +
    `PRODID:-//Astrian Zheng//ArkBulletinGPT v1.0//EN\n` +
    `CALSCALE:GREGORIAN\n` +
    ics_string +
    `END:VCALENDAR\n`
}

export { get_ics }