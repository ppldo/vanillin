import postcss from 'postcss'
import fs from 'fs'

import path from 'path'

import {plugin} from '../src'

function getDirPath(name: string) {
  return path.resolve(__dirname, name)
}

async function run (input, output, opts = { }) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

describe('test files', () => {
  it.each(fs.readdirSync(getDirPath('./samples')))('%s', async (title) => {
    const input = fs.readFileSync(getDirPath(`./samples/${title}/input.css`),{encoding: 'utf-8'})
    const output = fs.readFileSync(getDirPath(`./samples/${title}/output.ts`),{encoding: 'utf-8'})
    await run(input, output)
  })
})
