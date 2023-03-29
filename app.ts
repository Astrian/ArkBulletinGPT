'use strict'

// Import modules
import Debug from 'debug'
import dotenv from 'dotenv'
import axios from 'axios'
import koa from 'koa'
import router from 'koa-route'

// Import functions
import * as functions from './functions'

// Initialize
const print = Debug('abg:app.ts')
dotenv.config()
const app = new koa()

// Use axios to fetch json data
async function refresh() {
  try {
    let response = await axios.get('https://ak-conf.hypergryph.com/config/prod/announce_meta/IOS/announcement.meta.json')
    for (let i in response.data.announceList) {
      let exist = await functions.check_bulletin_exist(response.data.announceList[i].announceId)
      if (exist) continue

      // print(response.data.announceList[i])
      
      // Parse bulletin contents
      let content = await functions.web_paraser(response.data.announceList[i].webUrl)

      // GPT analysis
      let gpt_result = await functions.gpt_analysis(content)

      // Process events detail
      let events = gpt_result.events
      for (let j in events) {
        await functions.events_update(events[j])
      }
    }
  } catch (error) {
    print(error)
  }
}

// refresh()

// HTTP server
app.use(router.get('/', async (ctx) => {
  ctx.body = 'Hello World'
}
))
app.use(router.get('/arknights_events.ics', async (ctx) => {
  // ctx.set('Content-Type', 'text/calendar')
  ctx.body = await functions.get_ics()
}))
app.listen(3000)