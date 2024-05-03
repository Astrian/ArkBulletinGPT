/// <reference path="../types.d.ts" />

// Import modules
import Debug from 'debug'
import Anthropic from '@anthropic-ai/sdk'

// Initial
let print = Debug('abg:functions/gpt_analysis.ts')

const gpt_analysis = async (content: string): Promise<{events: GameEvent[], maintance: GameEvent[], summary: string}> => {
  print('gpt_analysis()')

  // Get now time
  let now = new Date()
  // Format time as “2023 年 1 月 1 日 04:00”
  // let now_time = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 ' + now.getHours() + ':' + now.getMinutes()
  let now_time = "2023 年 04 月 22 日"

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
  - 请 *千万不要* 在 JSON 内容中加插引号（\"），否则将影响 JSON 输出。

  使用以下 JSON 模板输出：
  
  {"events": [{"name": "", "start_time": {"year": 2023, "month": 1, "day": 1, "hour": 4, "minute": 0}, "end_time": {"year": 2023, "month": 1, "day": 15, "hour": 3, "minute": 59}, "detail": ""}], "maintance": [{...}], "summary": ""}
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
      max_tokens: 2048,
      messages: [{
        "role": "user",
        "content": content
      }],
      system
    })
    print(msg.content[0].text)
    result = JSON.parse(msg.content[0].text)
    print(result)
  } catch (error) {
    print('error')
    print((error as any))
  }
  return result
}

export { gpt_analysis }