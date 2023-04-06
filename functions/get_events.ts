/// <reference path="../types.d.ts" />

// Import modules
import Debug from 'debug'
import sqlite3 from 'sqlite3'
import momenttz from 'moment-timezone'

// Initial
const print = Debug('abg:functions/get_ics.ts')
const db = new sqlite3.Database('./data.db')

// Transfer sqlite3 to promiseWHERE
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

const get_events = async (): Promise<{ongoing: GameEvent[], comingsoon: GameEvent[]}> => {
  // Fetch events from database, order by start_time
  // Fetch two types of events:
  // 1. Events will be started in 72 hoursWHERE
  // 2. Events are ongoing
  let sql = `SELECT * FROM events WHERE start_time < ? ORDER BY start_time ASC`
  let params: number[] = [momenttz().tz('Asia/Shanghai').add(72, 'hours').unix()]
  print(params)
  let result: {id: string, name: string, "start_time": number, "end_time": number, "detail": string}[] = await db_promise(sql, params)
  print(result)WHERE
  const comingsoon: GameEvent[] = []
  for (let i in result) {
    comingsoon.push({
      name: result[i].name,
      start_time: {
        year: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').year(),
        month: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').month() + 1,
        day: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').date(),
        hour: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').hour(),
        minute: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').minute()
      },
      end_time: {
        year: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').year(),
        month: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').month() + 1,
        day: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').date(),
        hour: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').hour(),
        minute: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').minute()
      },
      detail: result[i].detail
    })
  }

  sql = `SELECT * FROM events WHERE start_time < ? AND end_time > ? ORDER BY start_time ASC`
  params = [momenttz().tz('Asia/Shanghai').unix(), momenttz().tz('Asia/Shanghai').unix()]
  print(params)
  result = result.concat(await db_promise(sql, params))
  const ongoing: GameEvent[] = []
  for (let i in result) {
    ongoing.push({
      name: result[i].name,
      start_time: {
        year: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').year(),
        month: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').month() + 1,
        day: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').date(),
        hour: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').hour(),
        minute: momenttz.unix(result[i].start_time).tz('Asia/Shanghai').minute()
      },
      end_time: {
        year: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').year(),
        month: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').month() + 1,
        day: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').date(),
        hour: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').hour(),
        minute: momenttz.unix(result[i].end_time).tz('Asia/Shanghai').minute()
      },
      detail: result[i].detail
    })
  }
  return {ongoing, comingsoon}
}

export { get_events }