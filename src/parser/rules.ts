import {AtRule, Root, Rule} from 'postcss'

import {Style} from '../model'
import {ParsedSelector, parseSelector} from './selector'
import {parseValue} from './values'

export interface ParsedRule {
    selector: ParsedSelector
    style: Style
}

interface IKeyFrames {
    varName: string
    data: Map<string, Style>
    isGlobal: boolean
}

export interface IParseRulesResult {
    rules: ParsedRule[]
    keyFrames: IKeyFrames[]
}

function parseCssProps(rule: Rule): Style {
    let cssProp: Style = {}
    rule.walkDecls(decl => {
        const value = parseValue(decl.value)
        if (decl.important)
            value.push(' !important')
        cssProp[decl.prop] = value
    })
    return cssProp
}

function getKeyFrames(r: AtRule): IKeyFrames {
    let varName = r.params
    let isGlobal = false
    const res = r.params.match(/:global\(([^)]*)\)/)
    if (res) {
        varName = res[1]
        isGlobal = true
    }
    return {
        varName,
        data: new Map(),
        isGlobal,
    }
}

export function parseRules(root: Root): IParseRulesResult {
    let result: IParseRulesResult = {
        rules: [],
        keyFrames: [],
    }

    root.each(r => {
        if (r instanceof AtRule) {
            if (r.name === 'keyframes') {
                const keyFrames = getKeyFrames(r)
                for (const node of r.nodes) {
                    if (node instanceof Rule)
                        keyFrames.data.set(node.selector, parseCssProps(node))
                }
                const index = result.keyFrames.findIndex(k => k.varName === keyFrames.varName)
                if (index > -1)
                    result.keyFrames[index] = keyFrames
                else
                    result.keyFrames.push(keyFrames)
            }
        } else if (r instanceof Rule) {
            for (const s of r.selectors) {
                const selector = parseSelector(s)
                const style = parseCssProps(r)
                const rule: ParsedRule = {
                    selector,
                    style,
                }
                result.rules.push(rule)
            }
        }
    })
    return result
}
