'use strict'

import Debug from 'debug'
let print = Debug('abg:app.ts')

const hello = (world: string) => {
  print(`hello ${world}`)
}

hello('world')