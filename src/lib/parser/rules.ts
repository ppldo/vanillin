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
}

export function parseRules(root: Root): IParseRulesResult {
}
