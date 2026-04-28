type GameEvent = {
    "name": string,
    "start_time": Date?,
    "end_time": Date?,
    "detail": string
}

type BulletinData = {
	status: number
 	code: number
  msg: string
  data: {
  	cid: string
   	displayType: 1 | 2
    title: string
    category: 1 | 2 | 4
    header: string
    content: string
    jumpLink: string
    bannerImageUrl: string
    displayTime: string
    updatedAt: number
  }
}
