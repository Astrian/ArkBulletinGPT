// Import modules
import Debug from 'debug'
import axios from 'axios'

// Initial
let print = Debug('abg:functions/gpt_analysis.ts')

const gpt_analysis = async (content: string): Promise<{summary: string, events: [{name: string, "start_time": number, "end_time": number, "detail": string}]}> => {
  print('gpt_analysis()')

  // Set prompt
  let prompt = `以下是手游《明日方舟》的公告网页 HTML，请帮我从里面提取活动名称、起止时间和详细信息，以JSON 格式输出。
  
  一些注意事项：

  - 公告中出现的所有时间以北京时间展示
  - 有可能会有多个活动在同一公告中
  - 输出时间时请使用毫秒时间戳格式
  - 整个公告有可能只有一张图片，如遇此情况，请返回空数组
  - 公告中有可能不包含活动有效信息，如遇此情况，请返回空数组
  - 活动详情请你进行精炼与总结
  - 如果活动与「危机合约」有关，请在活动名称中标注「危机合约」字样
  
  使用以下 JSON 模板：
  [{"name": "", "start_time": 0, "end_time": 0, "detail": ""}]
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
  let events_response = await axios.post('https://api.openai.com/v1/chat/completions', body, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  })

  const events = JSON.parse(events_response.data.choices[0].message.content)

  // Set prompt
  prompt = `以下是手游《明日方舟》的公告网页 HTML，请详细总结公告内容。如果公告中只有图片，返回 null。`
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
  let summary_response = await axios.post('https://api.openai.com/v1/chat/completions', body, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  })

  const summary = summary_response.data.choices[0].message.content
  let result = {
    summary,
    events
  }
  print(result)
  return result
}

export { gpt_analysis }