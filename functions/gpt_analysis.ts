/// <reference path="../types.d.ts" />

// Import modules
import Debug from 'debug'
import OpenAI from 'openai'
import { decode } from '@toon-format/toon'

// Initial
let print = Debug('abg:functions/gpt_analysis.ts')

const gpt_analysis = async (content: string): Promise<{events: GameEvent[], maintance: GameEvent[], summary: string}> => {
  print('gpt_analysis()')

  // Get now time
  let now = new Date()
  // Format time as “2023 年 1 月 1 日 04:00”
  let now_time = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 ' + now.getHours() + ':' + now.getMinutes()
  // let now_time = "2023 年 04 月 22 日"

  // Set prompt
  let system = `以下是手游《明日方舟》的公告网页 HTML，请帮我从里面提取活动/维护计划的名称、起止时间和详细信息，并再用一段话总结公告内容。

一些注意事项：

- 公告中出现的所有时间以北京时间展示
- 有可能会有多个活动/维护计划在同一公告中
- 公告发布时间是 ${now_time}，请按照此时间进行活动/维护计划时间的计算
- 公告中有可能不包含活动/维护计划有效信息，如遇此情况，请返回空数组
- 活动/维护计划详情请你进行精炼与总结
- 如果活动与「危机合约」有关，请在活动名称中标注「危机合约」字样
- 忽略与站外平台有关的活动（例如微博、小红书、B 站激励计划等）
- 如果公告中只有一张图片，events 和 maintance 请返回空数组，summary 请返回空字符串
- 如果侦测到某个活动或维护详情不包含精确的开始时间和结束时间，忽略这一条目

使用以下 TOON 模板输出：

events[]{name,start_time,end_time,detail}:
  「相见欢」复刻活动,2026-01-26T16:00,2026-02-09T03:59,活动详情...
maintance[]{name,start_time,end_time,detail}:
  闪断更新,2026-01-26T16:00,2026-01-26T16:10,维护详情...
summary: 公告总结

请在中括号 count 中填入活动或维护事项的具体数量。详情、总结中涉及数量的星号请转换为 × 符号。
  `
  var result: {
    events: GameEvent[],
    maintance: GameEvent[],
    summary: string
  } = {
    events: [],
    maintance: [],
    summary: ""
  }
  try {
    print("start generating")
    const openai = new OpenAI({
      baseURL: "https://api.xiaomimimo.com/v1",
      apiKey: process.env.ARK_MIMO_API_KEY,
    })
    const msg = await openai.chat.completions.create({
      model: "mimo-v2.5",
      temperature: 0.3,
      messages: [{
        "role": "system",
        "content": system
      },
        {
        "role": "user",
        "content": content
      }],
    })
    print(msg.choices[0].message.content)

    print('===')

    // Parse
    const parseRes = decode(msg.choices[0].message.content || "") as {events: {
    	name: string,
    	start_time: string,
    	end_time: string,
    	detail: string
    }[], maintance: GameEvent[], summary: string}
    print(parseRes)
    for (const i in parseRes.events) {
      const event = parseRes.events[i]
      // 2024-05-08T01:01:40+08:00
      let start_time_string = `${event.start_time}:00+08:00`
      print(`start_time_string: ${start_time_string}`)
      let start_time = new Date(start_time_string)
      let end_time_string = `${event.end_time}:00+08:00`
      print(`end_time_string: ${end_time_string}`)
      let end_time = new Date(end_time_string)
      result.events.push({
        name: event.name,
        start_time: start_time,
        end_time: end_time,
        detail: event.detail
      })
    }
    for (let i in parseRes.maintance) {
      let event = parseRes.maintance[i]
      // 2024-05-08T01:01:40Z
      let start_time_string = `${event.start_time}:00+08:00`
      print(`start_time_string: ${start_time_string}`)
      let start_time = new Date(start_time_string)
      let end_time_string = `${event.end_time}:00+08:00`
      print(`end_time_string: ${end_time_string}`)
      let end_time = new Date(end_time_string)
      result.maintance.push({
        name: event.name,
        start_time: start_time,
        end_time: end_time,
        detail: event.detail
      })
    }
    result.summary = parseRes.summary
  } catch (error) {
    print('error')
    print((error as any))
  }
  return result
}

export { gpt_analysis }

function dateTimeTwoDigits(dateTime: number): string {
  return dateTime < 10 ? '0' + dateTime : dateTime.toString()
}
