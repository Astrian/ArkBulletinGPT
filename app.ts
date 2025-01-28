/// <reference path="./types.d.ts" />

'use strict'

// Import modules
import Debug from 'debug'
import dotenv from 'dotenv'
import axios from 'axios'
import koa from 'koa'
import router from 'koa-route'
import { Bot } from 'grammy'
import schedule from "node-schedule"

// Import functions
import * as functions from './functions'

// Initialize
const print = Debug('abg:app.ts')
dotenv.config()
const app = new koa()

// Recursion refresh
let rule = new schedule.RecurrenceRule()
rule.second = [0, 30]

const job = schedule.scheduleJob(rule, () => {
  refresh()
})
// refresh()

// Use axios to fetch json data
async function refresh() {
  try {
    let response = await axios.get('https://ak-conf.hypergryph.com/config/prod/announce_meta/IOS/announcement.meta.json')
    for (let i in response.data.announceList) {
      await processAnnouncement(response.data.announceList[i])
    }
    // await processAnnouncement(response.data.announceList[0])
  } catch (error) {
    print(error)
  }
}

async function processAnnouncement(announcement: { announceId: number; webUrl: string; title: string; group: string }) {
  let exist = await functions.check_bulletin_exist(announcement.announceId)
  if (exist) return

  // Mark announcement as processed
  await functions.mark_bulletin_exist(announcement.announceId)
  
  // Parse bulletin contents
  let content = await functions.web_paraser(announcement.webUrl)
  // calculate content character length
  print("Content length: " + content.length)

  // GPT analysis
  let analysis_result = await functions.gpt_analysis(content)
  print(analysis_result)

  // Write to calendar ics
  for (let i in analysis_result.events) await functions.events_update(analysis_result.events[i])
  for (let i in analysis_result.maintance) await functions.events_update(analysis_result.maintance[i])

  // Telegraph post
  let push_url = await functions.telegraph_post(content.replace(/\&/g, '%26'), announcement.webUrl, announcement.title.replace(/[\r\n]/g,""))

  // Telegram bot push
  let bot = new Bot(process.env.ARK_TELEGRAM_BOT_TOKEN ?? "")
  let msg_content = ""
  if (analysis_result.summary !== "" && analysis_result.summary) msg_content = `<b>新游戏内公告</b>：${push_url}\n省流：${analysis_result.summary}\n${announcement.group === 'SYSTEM' ? '#系统公告' : '#活动通知'}`
  else msg_content = `<b>新游戏内公告</b>：${push_url}\n${announcement.group === 'SYSTEM' ? '#系统公告' : '#活动通知'}`
  print(msg_content)
  await bot.api.sendMessage(
    process.env.ARK_CHATID ?? 0,
    msg_content,
    {
      parse_mode: 'HTML'
    }
  )
}

// HTTP server
app.use(router.get('/', async (ctx) => {
  ctx.body = 'Hello World'
}
))
app.use(router.get('/arknights_events.ics', async (ctx) => {
  ctx.set('Content-Type', 'text/calendar')
  ctx.body = await functions.get_ics()
}))
app.listen(process.env.ARK_PORT ?? 3000)