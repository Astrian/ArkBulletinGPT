// Import modules
import Debug from 'debug'
import sqlite3 from 'sqlite3'
import momenttz from 'moment-timezone'

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
    let start_time_string = momenttz.utc(start_time).format('YYYYMMDDTHHmmSS') + 'Z'
    let end_time_string = momenttz.utc(end_time).format('YYYYMMDDTHHmmSS') + 'Z'
    let event_string = `BEGIN:VEVENT\n` +
      `UID:${id}\n` +
      `DTSTAMP:${start_time_string}\n` +
      `DTSTART:${start_time_string}\n` +
      `DTEND:${end_time_string}\n` +
      `SUMMARY:${event.name}\n` +
      `DESCRIPTION:${event.detail}\\n注：活动名称、时间与详情由 GPT 3.5 Turbo 引擎抓取，若有错误，您可以前往 ${process.env.ARK_CONTACT} 进行勘误。\n` +
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