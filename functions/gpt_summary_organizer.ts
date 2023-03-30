/// <reference path="../types.d.ts" />

// Import modules
import Debug from 'debug'
import axios from 'axios'

// Initial
let print = Debug('abg:functions/gpt_summary_organizer.ts')

const gpt_summary_organizer = async (summaryList: string[]): Promise<string> => {
  print('gpt_summary_organizer()')
  // print(summaryList)

  let summary = ""
  // Set prompt
  // Multiple summaries in lines
  let prompt = `以下是一篇手游《明日方舟》公告的不同片段的总结，请帮我从这些总结中再总结成一段带有信息量的话。`
  let messages = [
    {
      "role": "system",
      "content": prompt
    }, {
      "role": "user",
      "content": summaryList.join('\n')
    }
  ]
  print(messages)
  let body = {
    "model": "gpt-3.5-turbo-0301",
    "messages": messages
  }
  try {
    let summary_response = await axios.post('https://api.openai.com/v1/chat/completions', body, {
      headers: {
        'Authorization': `Bearer ${process.env.ARK_OPENAI_API_KEY}`
      }
    })
    print("RESPONSE")
    print(summary_response.status)
    print(summary_response.data.choices[0].message.content)
    summary = summary_response.data.choices[0].message.content
  } catch(error) {
    print('error')
    print((error as any).response)
    summary = ""
  }

  print(summary)
  return summary
}

export { gpt_summary_organizer }