'use strict'

// Import modules
import Debug from 'debug'
import dotenv from 'dotenv'
import axios from 'axios'

// Import functions
import * as functions from './functions'

// Initialize
let print = Debug('abg:app.ts')
dotenv.config()

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

    }
  } catch (error) {
    print(error)
  }
}

refresh()