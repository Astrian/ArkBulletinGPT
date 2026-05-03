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
	print('refresh')
  try {
    let response = await axios.get('https://ak-webview.hypergryph.com/api/game/bulletinList?target=IOS')
    response.data.data.list.forEach(async (announcement: { cid: string; title: string; category: 1 | 2 | 4; displayTime: string; updatedAt: number; sticky: boolean }) => {
      await processAnnouncement(announcement)
    })
    // await processAnnouncement(response.data.announceList[0])
  } catch (error) {
    print(error)
  }
}

async function processAnnouncement(announcement: { cid: string; title: string; category: 1 | 2 | 4; displayTime: string; updatedAt: number; sticky: boolean }) {
	print(announcement)
  const exist = await functions.check_bulletin_exist(announcement.cid)
  if (exist) return

  // Mark announcement as processed
  await functions.mark_bulletin_exist(announcement.cid)

  // Parse bulletin contents
  const content = await functions.web_paraser(announcement.cid)

  // GPT analysis
  let push_url = ""
  let analysis_result: { events: GameEvent[]; maintance: GameEvent[]; summary: string } = { events: [], maintance: [], summary: "" }
  if (content.data.displayType === 1) {
	  analysis_result = await functions.gpt_analysis(content.data.content)
	  print(analysis_result)

	  // Write to calendar ics
	  for (let i in analysis_result.events) await functions.events_update(analysis_result.events[i])
	  for (let i in analysis_result.maintance) await functions.events_update(analysis_result.maintance[i])

	  // Telegraph post
	  push_url = await functions.telegraph_post(functions.unescape_html(content.data.content), content.data.header)
		print(push_url)
  }

  // // Telegram bot push
  let bot = new Bot(process.env.ARK_TELEGRAM_BOT_TOKEN ?? "")
  if (content.data.displayType === 1) {
	 	await bot.api.sendMessage(
	    process.env.ARK_CHATID ?? 0,
	    `<b>新游戏内公告</b>：${push_url}\n省流：${analysis_result.summary}\n${announcementCategoryTags(announcement.category)}`,
	    {
	      parse_mode: 'HTML'
	    }
	  )
  }
  else {
   	await bot.api.sendPhoto(
   		process.env.ARK_CHATID ?? 0,
   		content.data.bannerImageUrl,
   		{
     		caption: `<b>新游戏内公告</b>：<a href="${content.data.jumpLink}">${content.data.title.replace(/[\\r\\n]/g, "")}</a>\n${announcementCategoryTags(announcement.category)}`,
   			parse_mode: 'HTML'
   		}
   	)
  }

}

// HTTP server
app.use(router.get('/', async (ctx) => {
  ctx.redirect('/arknights_events.ics')
}
))
app.use(router.get('/arknights_events.ics', async (ctx) => {
  ctx.set('Content-Type', 'text/calendar')
  ctx.body = await functions.get_ics()
}))
app.listen(process.env.ARK_PORT ?? 3000)

function announcementCategoryTags(category: 1 | 2 | 4) {
	switch (category) {
		case 2: return '#系统公告'
		case 1: return '#活动通知'
		case 4: return '#资讯速报'
	}
}
