// Import modules
import Debug from 'debug'
import { JSDOM } from 'jsdom'
import axios from 'axios'

// Initial
let print = Debug('abg:functions/telegraph_post.ts')

const telegraph_post = async (html: string, url: string, ori_title: string): Promise<string> => {
  let jsdom = new JSDOM(html)

  print("Processing title...")
  let title = (jsdom.window.document.getElementsByClassName("head-title")).item(0)?.textContent
  title = title?.replace("\n", "").replace(/(^\s*)/g, "").replace(/(\s*$)/g, "")
  if (!title) {
    print('no title.')
    title = ori_title
  }
  print(title)

  print("Processing links...")
  let links = jsdom.window.document.getElementsByTagName("a")
  if (links.length) {
    print("This bulletin has links")
    for (let i = 0; i < links.length; i++) {
      print(`Link ${i}`)
      if (links[i].href.startsWith("uniwebview://")) {
        links[i].href = "#"
      }
      print(links[i].href)
    }
  }

  // Parse content
  print("Parsing content...")
  let contentRaw = jsdom.window.document.getElementsByClassName("content").item(0) ? jsdom.window.document.getElementsByClassName("content").item(0) : jsdom.window.document.getElementsByClassName("cover").item(0)
  let content: (JsonNode | string | null)[] = (<JsonNode>await domParser(contentRaw || new Element())).children ?? []
  content.push({"tag":"p","children":[{"tag": "a", "attrs": { "href": url }, "children": ["查看原公告"]}]})
  print(JSON.stringify(content))
  let data = ``
  data += `access_token=${process.env.ARK_TGPHTOKEN}&`
  data += `title=${title}&`
  data += `content=${JSON.stringify(content)}`
  print(data)
  let telegrapharticle = await axios.post('https://api.telegra.ph/createPage', data)
  print(telegrapharticle.data)
  return(telegrapharticle.data.ok ? telegrapharticle.data.result.url : url)
}

export { telegraph_post }

type JsonNode = {
  tag: string,
  attrs?: Attrs,
  children?: (JsonNode | string | null)[] 
}

type Attrs = {
  href?: string,
  src?: string
}

async function domParser(dom: Element): Promise<JsonNode | null | string> {
  if (dom.nodeType === dom.TEXT_NODE) {
    return dom.textContent ?? ""
  }
  if (dom.nodeType !== dom.ELEMENT_NODE) {
    return null
  }
  let res: JsonNode = {
    tag: ""
  }
  res.tag = (dom.nodeName ?? "").toLowerCase()

  for (let i in dom.attributes) {
    let attr = dom.attributes[parseInt(i)]
    if (!res.attrs) {
      res.attrs = {}
    }
    if (attr?.name === "href") {
      res.attrs.href = attr?.value
    } else if (attr?.name === "src") {
      res.attrs.src = attr?.value
    }
  }

  if (dom.childNodes.length > 0) {
    res.children = []
    for (let i = 0; i < dom.childNodes.length; i++) {
      let child = <Element>dom.childNodes[i]
      res.children.push(await domParser(child))
    }
  }
  return res
}