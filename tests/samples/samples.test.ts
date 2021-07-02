import postcss from 'postcss'
import fs from 'fs'
import p from 'prettier'

import path from 'path'

import {vanillin} from '../../src'

function getDirPath(name: string) {
    return path.resolve(__dirname, name)
}

function makeFile(content: string) {
    return p.format(content, {parser: 'babel-ts', endOfLine: 'lf'}).replace(/\n+/, '\n')
}

async function run(input: string, output: string) {
    const root = await postcss.parse(input, {from: undefined})
    const vanillinedCss = vanillin(root)
    const generated = makeFile(vanillinedCss)
    const expected = makeFile(output)

    expect(generated).toEqual(expected)
}

describe('test files', () => {
    it.each(
        fs.readdirSync(getDirPath('.'), {withFileTypes: true}).filter(a => a.isDirectory()).map(d => d.name)
    )('%s', async (title) => {
        const input = fs.readFileSync(getDirPath(`./${title}/input.css`), {encoding: 'utf-8'})
        const output = fs.readFileSync(getDirPath(`./${title}/output.ts`), {encoding: 'utf-8'})
        await run(input, output)
    })
})
