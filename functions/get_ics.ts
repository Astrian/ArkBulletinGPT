const get_ics = async (): Promise<string> => {
  
  return `BEGIN:VCALENDAR\n` +
    `VERSION:2.0\n` +
    `PRODID:-//Astrian Zheng//ArkBulletinGPT v1.0//EN\n` +
    `CALSCALE:GREGORIAN\n` +
    `END:VCALENDAR\n`
}

export { get_ics }