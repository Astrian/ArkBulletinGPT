/// <reference path="../types.d.ts" />

// Import modules
import Debug from 'debug'
import Anthropic from '@anthropic-ai/sdk'
import xml2js from "xml2js"

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
  - 如果公告中只有一张图片，events 和 maintance 请返回空数组，summary 请返回空字符串

  使用以下 XML 模板输出：
  
  <announcement>
    <event>
      <name>name</name>
      <start_time>
        <year>2023</year>
        <month>1</month>
        <day>1</day>
        <hour>4</hour>
        <minute>0</minute>
      </start_time>
      <end_time>
        <year>2023</year>
        <month>1</month>
        <day>15</day>
        <hour>3</hour>
        <minute>59</minute>
      </end_time>
      <detail>event detail...</detail>
    </event>
    <maintance>
      <!-- start_time, end_time, name, detail... --->
    </maintance>
    <summary>summary</summary>
  </announcement>
  
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
    const anthropic = new Anthropic({
      apiKey: process.env.ARK_ANTHROPIC_API_KEY,
    })
    const msg = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 3096,
      messages: [{
        "role": "user",
        "content": content
      }],
      system
    })
    // Parse XML
    let parseRes = await parseStringPromise(msg.content[0].text)
    print(parseRes)
    if (parseRes.announcement.event[0] === "") result.events = []
    else {
      result.events = parseRes.announcement.event.map((event: any) => {
        return {
          name: event.name[0],
          start_time: new Date(event.start_time[0].year[0], event.start_time[0].month[0], event.start_time[0].day[0], event.start_time[0].hour[0], event.start_time[0].minute[0]),
          end_time: new Date(event.end_time[0].year[0], event.end_time[0].month[0], event.end_time[0].day[0], event.end_time[0].hour[0], event.end_time[0].minute[0]),
          detail: event.detail[0]
        }
      })
    }
    if (parseRes.announcement.maintance[0] === "") result.maintance = []
    else {
      result.maintance = parseRes.announcement.maintance.map((event: any) => {
        return {
          name: event.name[0],
          start_time: new Date(event.start_time[0].year[0], event.start_time[0].month[0], event.start_time[0].day[0], event.start_time[0].hour[0], event.start_time[0].minute[0]),
          end_time: new Date(event.end_time[0].year[0], event.end_time[0].month[0], event.end_time[0].day[0], event.end_time[0].hour[0], event.end_time[0].minute[0]),
          detail: event.detail[0]
        }
      })
    }
    result.summary = parseRes.announcement.summary[0]
  } catch (error) {
    print('error')
    print((error as any))
  }
  return result
}

export { gpt_analysis }

// make synchronous function into async function
function parseStringPromise(str: string): Promise<any> {
  return new Promise((resolve, reject) => {
    xml2js.parseString(str, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}