import postcss from 'postcss'
import fs from 'fs'

import path from 'path'

import {vanillin} from '../src'

function getDirPath(name: string) {
  return path.resolve(__dirname, name)
}

async function run (input: string, output: string, title: string, opts = { }) {
    const root = await postcss.parse(input, { from: undefined })
    const vanillinedCss = vanillin(root)
    try {
        expect(vanillinedCss+"\n").toEqual(output)
    } catch (e) {
        console.warn(vanillinedCss, title)
        throw e
    }
}

describe('test files', () => {
  it.each(fs.readdirSync(getDirPath('./samples')))('%s', async (title) => {
    const input = fs.readFileSync(getDirPath(`./samples/${title}/input.css`),{encoding: 'utf-8'})
    const output = fs.readFileSync(getDirPath(`./samples/${title}/output.ts`),{encoding: 'utf-8'})
    await run(input, output, title)
  })
})
