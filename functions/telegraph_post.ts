
import Debug from 'debug'
import { JSDOM } from 'jsdom'
import axios from 'axios'

const print = Debug('abg:functions/telegraph_post.ts')

// Telegraph API supported node types
interface TelegraphNode {
  tag: string
  attrs?: Record<string, string>
  children?: (TelegraphNode | string)[]
}

// Supported Telegraph tags that can have children
const CONTAINER_TAGS = new Set([
  'a', 'aside', 'b', 'blockquote', 'code', 'em', 'figcaption',
  'figure', 'h3', 'h4', 'i', 'li', 'ol', 'p', 'pre', 's',
  'strong', 'u', 'ul'
])

// Self-closing tags
const VOID_TAGS = new Set(['br', 'hr', 'img'])

/**
 * Convert a DOM element to Telegraph-compatible node format
 */
function domToTelegraphNode(node: globalThis.Node): TelegraphNode | string | null {
  // Handle text nodes
  if (node.nodeType === node.TEXT_NODE) {
    const text = node.textContent?.trim()
    return text || null
  }

  // Only process element nodes
  if (node.nodeType !== node.ELEMENT_NODE) {
    return null
  }

  const element = node as globalThis.Element
  const tagName = element.tagName.toLowerCase()

  // Skip unsupported container tags but process children
  if (!CONTAINER_TAGS.has(tagName) && !VOID_TAGS.has(tagName)) {
    // For unsupported wrappers like div/span, extract children
    const children: (TelegraphNode | string)[] = []
    for (const child of Array.from(element.childNodes)) {
      const result = domToTelegraphNode(child)
      if (result !== null) {
        children.push(result)
      }
    }

    // If only one child, return it directly
    if (children.length === 1) {
      return children[0]
    }

    // If multiple children, wrap in a supported container or return as fragment
    if (children.length > 1) {
      return { tag: 'p', children }
    }

    return null
  }

  // Build the node
  const nodeObj: TelegraphNode = { tag: tagName }

  // Process attributes (only supported ones)
  const attrs: Record<string, string> = {}

  if (tagName === 'a' && element.hasAttribute('href')) {
    attrs.href = element.getAttribute('href') || ''
  }

  if (tagName === 'img' && element.hasAttribute('src')) {
    attrs.src = element.getAttribute('src') || ''
  }

  if (Object.keys(attrs).length > 0) {
    nodeObj.attrs = attrs
  }

  // Process children for non-void tags
  if (!VOID_TAGS.has(tagName)) {
    const children: (TelegraphNode | string)[] = []
    for (const child of Array.from(element.childNodes)) {
      const result = domToTelegraphNode(child)
      if (result !== null) {
        children.push(result)
      }
    }

    if (children.length > 0) {
      nodeObj.children = children
    }
  }

  return nodeObj
}

/**
 * Process an image element, wrapping it in a figure if needed
 */
function processImage(imgElement: globalThis.Element): TelegraphNode | null {
  const src = imgElement.getAttribute('src')
  if (!src) return null

  return {
    tag: 'figure',
    children: [
      { tag: 'img', attrs: { src } }
    ]
  }
}

/**
 * Parse HTML content and extract Telegraph-compatible nodes
 */
function parseHtmlToTelegraphNodes(html: string): (TelegraphNode | string)[] {
  const dom = new JSDOM(html)
  const document = dom.window.document

  // Try to find content container, fallback to body
  const contentContainer =
    document.querySelector('.content') ||
    document.querySelector('.cover') ||
    document.body

  if (!contentContainer) {
    print('No content container found')
    return []
  }

  const nodes: (TelegraphNode | string)[] = []

  for (const child of Array.from(contentContainer.childNodes)) {
    const element = child as globalThis.Element

    // Handle standalone images (often wrapped in div.media-wrap)
    if (element.tagName?.toLowerCase() === 'div') {
      const img = element.querySelector('img')
      if (img) {
        const figure = processImage(img)
        if (figure) {
          nodes.push(figure)
          continue
        }
      }
    }

    // Handle direct img elements
    if (element.tagName?.toLowerCase() === 'img') {
      const figure = processImage(element)
      if (figure) {
        nodes.push(figure)
        continue
      }
    }

    // Process other elements
    const result = domToTelegraphNode(child)
    if (result !== null) {
      // Skip empty paragraphs
      if (typeof result === 'object' && result.tag === 'p') {
        const hasContent = result.children?.some(c =>
          typeof c === 'string' ? c.trim().length > 0 : true
        )
        if (!hasContent) continue
      }
      nodes.push(result)
    }
  }

  return nodes
}

/**
 * Post an article to Telegraph
 * @param html - The HTML content to parse
 * @param title - The article title
 * @returns The URL of the created page, or empty string on failure
 */
export async function telegraph_post(html: string, title: string): Promise<string> {
  print('Parsing content...')

  const content = parseHtmlToTelegraphNodes(html)

  if (content.length === 0) {
    print('No content found to post')
    return ''
  }

  print(`Parsed ${content.length} content nodes`)

  const token = process.env.ARK_TGPHTOKEN
  if (!token) {
    print('Error: ARK_TGPHTOKEN environment variable not set')
    return ''
  }

  const requestData = {
    access_token: token,
    title: title,
    content: JSON.stringify(content)
  }

  try {
    print('Posting to Telegraph API...')
    const response = await axios.post('https://api.telegra.ph/createPage', requestData, {
      headers: { 'Content-Type': 'application/json' }
    })

    const { data } = response

    if (data.ok) {
      print(`Article created successfully: ${data.result.url}`)
      return data.result.url
    } else {
      print(`Telegraph API error: ${data.error}`)
      return ''
    }
  } catch (error) {
    print(`Request failed: ${error}`)
    return ''
  }
}

// Legacy export for backward compatibility
export { telegraph_post as default }
