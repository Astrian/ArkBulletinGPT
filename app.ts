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
      let exist = await functions.check_bulletin_exist(response.data.announceList[i].announceId)
      if (exist) continue

      // Mark announcement as processed
      await functions.mark_bulletin_exist(response.data.announceList[i].announceId)
      
      // Parse bulletin contents
      let content = await functions.web_paraser(response.data.announceList[i].webUrl)

      // GPT analysis
      // Cut the HTML content into 4000-character chips
      let chips = []
      for (let i = 0; i < content.length; i += 4000) {
        chips.push(content.slice(i, i + 4000))
      }
      // Recursion calling
      let summaryList: string[] = []
      for (let chip of chips) {
        let chip_analysis = await functions.gpt_analysis(chip)
        for (let event of chip_analysis.events) {
          print("Updating event: " + event.name)
          await functions.events_update(event)
        }
        summaryList.push(chip_analysis.summary)
      }
      let summary = ""
      // If there are multiple summaries, give GPT a task for summary from those summaries
      if (summaryList.length > 1) {
        summary = await functions.gpt_summary_organizer(summaryList)
      } else {
        summary = summaryList[0]
      }

      // Telegraph post
      let push_url = await functions.telegraph_post(content.replace(/\&/g, '%26'), response.data.announceList[i].webUrl, response.data.announceList[i].title.replace(/[\r\n]/g,""))

      // Telegram bot push
      let bot = new Bot(process.env.ARK_TELEGRAM_BOT_TOKEN ?? "")
      let msg_content = ""
      if (summary !== "" && summary) msg_content = `<b>新游戏内公告</b>：${push_url}\n省流：${summary}\n${response.data.announceList[i].group === 'SYSTEM' ? '#系统公告' : '#活动通知'}`
      else msg_content = `<b>新游戏内公告</b>：${push_url}\n${response.data.announceList[i].group === 'SYSTEM' ? '#系统公告' : '#活动通知'}`
      print(msg_content)
      await bot.api.sendMessage(
        process.env.ARK_CHATID ?? 0,
        msg_content,
        {
          parse_mode: 'HTML'
        }
      )
    }
  } catch (error) {
    print(error)
  }
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