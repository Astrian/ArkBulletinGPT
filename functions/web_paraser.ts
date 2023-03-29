// Import modules
import Debug from 'debug'
import axios from 'axios'

// Initial
let print = Debug('abg:functions/web_paraser.ts')

const web_paraser = async (url: string): Promise<string> => {
  print('web_paraser()')
  print(url)
  return <string>(await axios.get(url)).data
}

export { web_paraser }