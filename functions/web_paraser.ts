// Import modules
import Debug from 'debug'

// Initial
let print = Debug('abg:functions/web_paraser.ts')

let web_paraser = async (url: String) => {
  print('web_paraser()')
  print(url)
}

export { web_paraser }