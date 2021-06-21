import {AtRule, Root, Rule} from 'postcss'
import camelCase from 'camelcase'

import { Style } from '../model'
import { VanillaSelectorMgr } from '../writer'
import { vanillaSelectorParser, GlobalSelector } from './selector'

export interface IGlobalRule {
    vanillaSelector: VanillaSelectorMgr
    styles: Style
    deps: Set<string>
}

export interface IRegularRule extends IGlobalRule {
    varName: string
}

interface IKeyFrame {
    varName: string
    data: Map<string, Style>
}

export interface IParseRulesResult {
    globalRules: IGlobalRule[]
    regularRules: IRegularRule[]
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
    keyFrames: []
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
                  [node.selector, parseCssProps(node)]
                ])
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
                      [node.selector, parseCssProps(node)]
                    ])
                  })
                }
              }
            }
          }
        })
      }
    } else if (r instanceof Rule) {
      for (const selector of r.selectors) {
        const parsedSelector = vanillaSelectorParser.transformSync(selector)
        if (parsedSelector instanceof GlobalSelector) {
          result.globalRules.push({
            vanillaSelector: parsedSelector.vanillaSelector,
            styles: parseCssProps(r),
            deps: parsedSelector.deps
          })
        } else if (parsedSelector.varName) {
          result.regularRules.push({
            vanillaSelector: parsedSelector.vanillaSelector,
            styles: parseCssProps(r),
            deps: parsedSelector.deps,
            varName: camelCase(parsedSelector.varName)
          })
        }
      }
    }
  })
  return result
}
