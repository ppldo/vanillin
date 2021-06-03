import fs from 'fs'
import postcss from 'postcss'
import {vanillin} from '../lib'

async function run() {
    const input = fs.readFileSync(0, 'utf-8')
    const root = await postcss.parse(input, { from: undefined })
    const vanillinedCss = vanillin(root)
    process.stdout.write(vanillinedCss + '\n')
}

run().catch(e => {
    console.error(e)
    process.exit(1)
})
