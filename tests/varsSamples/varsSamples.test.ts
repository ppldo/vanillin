import postcss from 'postcss'
import fs from 'fs'
import p from 'prettier'

import path from 'path'

import {vanillin} from '../../src'
import {getVarsNames} from '../../src/resolveVars'

function getDirPath(name: string) {
  return path.resolve(__dirname, name)
}

function makeFile(content: string) {
    return p.format(content, {parser: 'babel-ts', endOfLine: 'lf'})
}

const abs = getDirPath('vars.ts')
const names = getVarsNames(abs)

async function run(input: string, output: string) {
    const importPath = path.relative(process.cwd(), abs).replace(/\.ts$/, '')
    const root = await postcss.parse(input, { from: undefined })
    const vanillinedCss = vanillin(root, {names, importPath})
    const generated = makeFile(vanillinedCss)
    const expected = makeFile(output)

    expect(generated).toEqual(expected)
}

describe('test files', () => {
  it.each(
      fs.readdirSync(getDirPath('.'), {withFileTypes: true}).filter(a => a.isDirectory()).map(d => d.name)
  )('%s', async (title) => {
      process.chdir(__dirname + '/' + title)
      const input = fs.readFileSync(`./input.css`, {encoding: 'utf-8'})
      const output = fs.readFileSync(`./output.ts`, {encoding: 'utf-8'})
      await run(input, output)
  }, 5000)
})
