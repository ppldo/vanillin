import {AtRule, Root, Rule} from 'postcss'
import camelCase from 'camelcase'

import {Style} from '../model'
import {parseSelector, VanillaSelector} from './selector'

export interface VanillaRule extends VanillaSelector {
    selectorTemplate: string
    styles: Style
    deps: Set<string>
}

interface IKeyFrame {
    varName: string
    data: Map<string, Style>
}

export interface IParseRulesResult {
    globalRules: VanillaRule[]
    regularRules: VanillaRule[]
    keyFrames: IKeyFrame[]
}

function parseCssProps(rule: Rule): Style {
    let cssProp: Style = {}
    rule.walkDecls(decl => {
        let strValue = decl.value
        let prop = camelCase(decl.prop)
        let numValue = Number(decl.value)
        if (decl.prop.startsWith('-')) {
            prop = camelCase(decl.prop, {pascalCase: true})
        }
        if (isNaN(numValue))
            cssProp[prop] = strValue
        else
            cssProp[prop] = numValue
    })
    return cssProp
}

export function parseRules(root: Root): IParseRulesResult {
    let result: IParseRulesResult = {
        globalRules: [],
        regularRules: [],
        keyFrames: [],
    }

    const parsedKeyFrameName: string[] = []
    root.each(r => {
        if (r instanceof AtRule) {
            if (r.name === 'keyframes') {
                r.nodes.map(node => {
                    if (node instanceof Rule) {
                        if (!result.keyFrames.length) {
                            parsedKeyFrameName.push(r.params)
                            result.keyFrames.push({
                                varName: r.params,
                                data: new Map([
                                    [node.selector, parseCssProps(node)],
                                ]),
                            })
                        } else {
                            for (const keyframe of result.keyFrames) {
                                if (keyframe.varName === r.params) {
                                    keyframe.data.set(node.selector, parseCssProps(node))
                                } else if (!parsedKeyFrameName.includes(r.params)) {
                                    parsedKeyFrameName.push(r.params)
                                    result.keyFrames.push({
                                        varName: r.params,
                                        data: new Map([
                                            [node.selector, parseCssProps(node)],
                                        ]),
                                    })
                                }
                            }
                        }
                    }
                })
            }
        } else if (r instanceof Rule) {
            for (const selector of r.selectors) {
                const {targetClass, parts} = parseSelector(selector)
                const deps: Set<string> = new Set(parts.flatMap(p => typeof p === 'object' ? [p.var] : []))
                const styles = parseCssProps(r)
                const rule: VanillaRule = {
                    selectorTemplate: parts.map(p => typeof p === 'string' ? p : '${' + p.var + '}').join(),
                    targetClass,
                    parts,
                    styles,
                    deps,
                }
                if (!targetClass) {
                    result.globalRules.push(rule)
                } else {
                    result.regularRules.push(rule)
                }
            }
        }
    })
    return result
}
