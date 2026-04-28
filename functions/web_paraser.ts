// Import modules
import Debug from 'debug'
import axios from 'axios'

// Initial
let print = Debug('abg:functions/web_paraser.ts')

const web_paraser = async (cid: string): Promise<BulletinData> => {
  print('web_paraser()')
  const url = `https://ak-webview.hypergryph.com/api/game/bulletin/${cid}`
  print(url)
  const res = await axios.get(url)
  const bulletinData = res.data as BulletinData
  return bulletinData
}

export { web_paraser }
