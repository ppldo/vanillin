#! /usr/bin/env node
import fs from 'fs'
import path from 'path'
import postcss from 'postcss'
import glob from 'glob'

import {vanillin} from './index'

const [, , cssDirName, targetDirName] = process.argv

async function singleRun() {
  const input = fs.readFileSync(0, 'utf-8')
  const root = await postcss.parse(input, { from: undefined })
  const vanillinedCss = vanillin(root)
  process.stdout.write(vanillinedCss + '\n')
}

function run() {
  glob(cssDirName+"/**/*.css", (er: Error | null, files: string[]) => {
    files.forEach((file) => {
      fs.readFile(file, (err, data) => {
        if (err)
          console.log(err)
        else {
          const relative = path.relative(cssDirName, path.dirname(file))
          const root = postcss.parse(data, { from: undefined })
          const vanillinedCss = vanillin(root)
          fs.writeFileSync(`${targetDirName}/${relative}/styles.css.ts`, vanillinedCss, 'utf8')
        }
      })
    })
  })
}

if (process.argv.length > 2)
  run()
else {
  singleRun().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
