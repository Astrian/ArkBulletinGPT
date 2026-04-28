// Import modules
import Debug from 'debug'

// Initial
let print = Debug('abg:functions/unescape_html.ts')

/**
 * Unescape a JSON-encoded HTML string.
 * Converts sequences like \u003Cdiv class=\"media-wrap image-wrap\"\u003E
 * to <div class="media-wrap image-wrap">
 *
 * @param escaped - The JSON-encoded HTML string to unescape
 * @returns The decoded HTML string
 */
const unescape_html = (escaped: string): string => {
  print('unescape_html()')
  try {
    // Escape literal control characters that would break JSON string parsing.
    // The input may contain JSON escape sequences (\uXXXX, \", \\) mixed with
    // actual newlines/tabs from the API response. We escape only the literal
    // control characters while preserving existing backslash sequences.
    const jsonSafe = escaped
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, (ch) => {
        return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')
      })
    const result = JSON.parse(`"${jsonSafe}"`)
    print('unescape_html result: %s', result)
    return result
  } catch (e) {
    print('unescape_html JSON.parse failed, using fallback: %O', e)
    // Fallback: manually handle common escape sequences
    let result = escaped
    // Decode \uXXXX unicode escapes
    result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decode escaped double quotes
    result = result.replace(/\\"/g, '"')
    // Decode escaped backslashes
    result = result.replace(/\\\\/g, '\\')
    // Decode escaped forward slashes
    result = result.replace(/\\\//g, '/')
    return result
  }
}

export { unescape_html }
