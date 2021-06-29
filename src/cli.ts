#! /usr/bin/env node
import fs from 'fs'
import path from 'path'
import postcss from 'postcss'
import glob from 'glob'

import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'

import {vanillin} from './index'
import {getVarsNames} from './resolveVars'

const optionDefinitions = [
    {
        name: 'help',
        alias: 'h',
        type: Boolean,
        description: 'Print out usage information',
    },
    {
        name: 'bulk',
        alias: 'b',
        type: String,
        multiple: true,
        description: 'Bulk converting. \n' +
            'Expects two arguments: cssDirName (directory with preprocessed css files) \n' +
            'and targetDirName (your output directory)',
        typeLabel: '<cssDirName>, <targetDirName>',
    },
    {
        name: 'vars',
        alias: 'v',
        type: String,
        description: 'The input file with vars to converting',
        typeLabel: '<vars.ts>',
    },
]

const options = commandLineArgs(optionDefinitions)

type Vars = { names: Iterable<string>, absPath: string }

function getVars(p: string): Vars {
    const absPath = path.resolve(process.cwd(), p)
    if (!fs.existsSync(absPath))
        throw new Error(`There is no file on the given path: ${absPath}`)
    const names = getVarsNames(absPath)
    return {names, absPath}
}

function getRelVars(vars: Vars | undefined, dir: string = process.cwd()): {names: Iterable<string>, importPath: string} | undefined {
    if (!vars)
        return undefined
    let relativePath = path.relative(dir, vars.absPath).replace(/\.ts$/, '')
    return {
        names: vars.names,
        importPath: relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
    }
}

function reportUsage(error = false) {
    const url = `\n{underline https://github.com/ppldo/vanillin${error ? '#readme' : ''}}`
    const usage = commandLineUsage([
        {content: (error ? 'Your options are invalid. Please refer to the documentation:' : 'Project home') + url},
        {header: 'Options', optionList: optionDefinitions},
    ])
    console.log(usage)
}

async function singleRun(vars?: Vars) {
    const input = fs.readFileSync(0, 'utf-8')
    const root = await postcss.parse(input, {from: undefined})
    const vanillinedCss = vanillin(root, getRelVars(vars))
    process.stdout.write(vanillinedCss + '\n')
}

function run(cssDirName: string, targetDirName: string, vars?: Vars) {
    glob(cssDirName + '/**/*.css', (er: Error | null, files: string[]) => {
        for (const file of files) {
            const data = fs.readFileSync(file)

            const relative = path.relative(cssDirName, path.dirname(file))
            const fileName = path.basename(file)
            const root = postcss.parse(data, {from: undefined})

            const dirName = `${targetDirName}/${relative}`

            const vanillinedCss = vanillin(root, getRelVars(vars, dirName))

            fs.mkdirSync(dirName, {recursive: true})
            fs.writeFileSync(`${dirName}/${fileName}.ts`, vanillinedCss, 'utf8')
        }
    })
}

function start() {
    if (options.help)
        return reportUsage()

    let vars: Vars | undefined
    if ('vars' in options) {
        if (typeof options.vars !== 'string')
            return reportUsage(true)
        vars = getVars(options.vars)
    }

    if (options.bulk) {
        if (options.bulk.length !== 2)
            return reportUsage(true)
        const cssDirName = options.bulk[0]
        const targetDirName = options.bulk[1]
        run(cssDirName, targetDirName, vars)
        return
    }
    singleRun(vars).catch(e => {
        console.error(e)
        process.exit(1)
    })
}

start()
