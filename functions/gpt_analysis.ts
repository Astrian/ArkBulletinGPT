// Import modules
import Debug from 'debug'
import axios from 'axios'

// Initial
let print = Debug('abg:functions/gpt_analysis.ts')

const gpt_analysis = async (content: string): Promise<{summary: string, events: {name: string, "start_time": {"year": number, "month": number, "day": number, "hour": number, "minute": number}, "end_time": {"year": number, "month": number, "day": number, "hour": number, "minute": number}, "detail": string}[]}> => {
  print('gpt_analysis()')

  // Get now time
  let now = new Date()
  // Format time as “2023 年 1 月 1 日 04:00”
  let now_time = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 ' + now.getHours() + ':' + now.getMinutes()

  // Set prompt
  let prompt = `以下是手游《明日方舟》的公告网页 HTML，请帮我从里面提取活动/维护计划的名称、起止时间和详细信息，以JSON 格式输出。
  
  一些注意事项：

  - 公告中出现的所有时间以北京时间展示
  - 有可能会有多个活动/维护计划在同一公告中
  - 输出时间时请使用毫秒时间戳格式
  - 公告发布时间是 ${now_time}，请按照此时间进行活动/维护计划时间的计算
  - 公告中有可能不包含活动/维护计划有效信息，如遇此情况，请返回空数组
  - 活动/维护计划详情请你进行精炼与总结
  - 如果活动与「危机合约」有关，请在活动名称中标注「危机合约」字样
  
  使用以下 JSON 模板：
  {"events": [{"name": "", "start_time": {"year": 2023, "month": 1, "day": 1, "hour": 4, "minute": 0}, "end_time": {"year": 2023, "month": 1, "day": 15, "hour": 3, "minute": 59}, "detail": ""}], "maintance": [{...}]}
  `
  let body = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "system",
        "content": prompt
      },
      {
        "role": "user",
        "content": content
      }
    ]
  }
  let events: {name: string, "start_time": {"year": number, "month": number, "day": number, "hour": number, "minute": number}, "end_time": {"year": number, "month": number, "day": number, "hour": number, "minute": number}, "detail": string}[] = []
  try {
    let events_response = await axios.post('https://api.openai.com/v1/chat/completions', body, {
      headers: {
        'Authorization': `Bearer ${process.env.ARK_OPENAI_API_KEY}`
      }
    })
    if (JSON.parse(events_response.data.choices[0].message.content).maintance) {
      events = JSON.parse(events_response.data.choices[0].message.content).maintance
    } else {
      events = JSON.parse(events_response.data.choices[0].message.content).events
    }
  } catch (error) {
    print('error')
    print(content)
    events = []
  }

  let summary = ""
  // Set prompt
  prompt = `以下是手游《明日方舟》的公告网页 HTML，请详细总结公告内容，以 JSON 格式输出（模板：{"summary": ""}）。如果页面只有一张带链接的图片，summary 请返回空字符串。`
  body = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "system",
        "content": prompt
      },
      {
        "role": "user",
        "content": content
      }
    ]
  }
  try {
    let summary_response = await axios.post('https://api.openai.com/v1/chat/completions', body, {
      headers: {
        'Authorization': `Bearer ${process.env.ARK_OPENAI_API_KEY}`
      }
    })
    summary = JSON.parse(summary_response.data.choices[0].message.content).summary
  } catch(error) {
    print('error')
    summary = ""
  }

  let result = {
    summary,
    events
  }
  print(result)
  return result
}

export { gpt_analysis }

type JsonNode = {
  tag: string,
  attrs?: Attrs,
  children?: (JsonNode | string | null)[] 
}

type Attrs = {
  href?: string,
  src?: string
}