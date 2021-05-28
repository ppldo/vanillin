const postcss = require('postcss')
import fs from 'fs'

import {plugin} from '../index'

async function run (input, output, opts = { }) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

describe('test files', () => {
  it.each(fs.readdirSync('./samples'))('%s', async (title) => {
    const input = fs.readFileSync(`./samples/${title}/input.css`,{encoding: 'utf-8'})
    const output = fs.readFileSync(`./samples/${title}/output.ts`,{encoding: 'utf-8'})
    await run(input, output)
  })
})
