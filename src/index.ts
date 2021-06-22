import {Root} from 'postcss'
import ld from 'lodash'

import {Style} from './model'
import {
    expressionsToTSString,
    IComment,
    IExpression,
    IGlobalStyle,
    IKeyFrame,
    IRegularStyle,
    ISelectorConf,
    StatementEnum,
    VanillaSelectorMgr,
} from './writer'
import {IGlobalRule, IRegularRule, parseRules} from './parser/rules'

class GlobalStyle implements IGlobalStyle {
    public readonly type = StatementEnum.GLOBAL

    constructor(
        public readonly vanillaSelector: VanillaSelectorMgr,
        public readonly style: Style,
        public readonly deps: Set<string>,
    ) {
    }
}

class RegularStyle implements IRegularStyle {
    public readonly type = StatementEnum.REGULAR

    constructor(
        public readonly varName: string,
        public readonly selectorConfs: ISelectorConf[],
        public readonly deps: Set<string>,
    ) {
    }

    public static makeEmpty(varName: string): RegularStyle {
        return new RegularStyle(varName, [], new Set())
    }
}

class CircularJSComment implements IComment {
    public readonly type = StatementEnum.COMMENT
    public readonly comment = 'TODO: this variable has circular dependencies, please fix it yourself!'
}

class KeyframeJSComment implements IComment {
    public readonly type = StatementEnum.COMMENT
    public readonly comment = 'TODO: animation ref is not implemented yet, please fix it yourself!'
}

class KeyFrame implements IKeyFrame {
    public readonly type = StatementEnum.KEYFRAME

    constructor(
        public readonly varName: string,
        public readonly data: Map<string, Style>,
    ) {
    }
}

function reduceGlobalStyles(rules: IGlobalRule[]): GlobalStyle[] {
    return ld.chain(rules).groupBy((r) => {
        return r.vanillaSelector.serialize()
    }).values().map((globalRules: IGlobalRule[]) => {
        let allDeps = new Set<string>()
        let allStyles: Style = {}
        for (const globalRule of globalRules) {
            allDeps = new Set([...allDeps, ...globalRule.deps])
            allStyles = {...allStyles, ...globalRule.styles}
        }
        return new GlobalStyle(globalRules[0].vanillaSelector, allStyles, allDeps)
    }).value()
}

function reduceRegularStyles(rules: IRegularRule[]): RegularStyle[] {
    return ld.chain(rules).groupBy((r) => {
        return r.varName
    }).values().map((regularRulesByVar: IRegularRule[]) => {
        let allDeps = new Set<string>()
        for (const r of regularRulesByVar) {
            allDeps = new Set([...allDeps, ...r.deps])
        }
        const selectorConfs: ISelectorConf[] = ld.chain(regularRulesByVar)
            .groupBy(r => {
                return r.vanillaSelector.serialize()
            })
            .values()
            .map((regularRulesBySelector: IRegularRule[]) => {
                let style: Style = {}
                for (const r of regularRulesBySelector) {
                    style = {...style, ...r.styles}
                }
                return {
                    vanillaSelector: regularRulesBySelector[0].vanillaSelector,
                    style,
                }
            }).value()
        return new RegularStyle(regularRulesByVar[0].varName, selectorConfs, allDeps)
    }).value()
}

class Mapper {
    constructor(
        readonly globalStyles: readonly GlobalStyle[],
        readonly regularStyles: readonly RegularStyle[],
        readonly keyframes: readonly KeyFrame[],
    ) {
    }

    private getEmptyVarNames(): Set<string> {
        const allVar = new Set<string>()
        for (const style of this.regularStyles)
            allVar.add(style.varName)
        return allVar
    }

    private addEmptyRegularStyles(result: Array<IExpression>): Set<string> {
        let allDeps: Array<string> = []
        const emptyRegularStyles = new Set<string>()
        for (const style of this.regularStyles) {
            allDeps.push(...style.deps.values())
        }
        for (const d of allDeps) {
            if (!this.getEmptyVarNames().has(d))
                emptyRegularStyles.add(d)
        }
        for (const name of emptyRegularStyles)
            result.push(new RegularStyle(name, [], new Set<string>()))
        return emptyRegularStyles
    }

    private addRegularStyles(result: Array<IExpression>, processedVarNames: Set<string>) {
        const emptyRegularStyles: Set<string> = this.addEmptyRegularStyles(result)
        processedVarNames = new Set([...emptyRegularStyles, ...processedVarNames])
        let isProcessed = true
        while (isProcessed) {
            isProcessed = false
            for (const style of this.regularStyles) {
                if (!processedVarNames.has(style.varName)) {
                    if ([...style.deps.values()].every((d) => processedVarNames.has(d))) {
                        result.push(new RegularStyle(style.varName, style.selectorConfs, processedVarNames))
                        processedVarNames.add(style.varName)
                        isProcessed = true
                    }
                }
            }
        }
        if (!isProcessed) {
            for (const style of this.regularStyles) {
                if (!processedVarNames.has(style.varName)) {
                    result.push(new CircularJSComment())
                    result.push(new RegularStyle(style.varName, style.selectorConfs, processedVarNames))
                }
            }
        }
    }

    private addGlobalStyles(result: Array<IExpression>, processedVarNames: Set<string>) {
        for (const r of this.globalStyles) {
            result.push(new GlobalStyle(r.vanillaSelector, r.style, processedVarNames))
        }
    }

    private addKeyFrames(result: Array<IExpression>) {
        if (this.keyframes.length > 0)
            result.push(new KeyframeJSComment())
        for (const r of this.keyframes) {
            result.push(new KeyFrame(r.varName, r.data))
        }
    }

    public map(): Array<IExpression> {
        const result = new Array<IExpression>()
        const processedVarNames = new Set<string>()
        this.addKeyFrames(result)
        this.addRegularStyles(result, processedVarNames)
        this.addGlobalStyles(result, processedVarNames)
        return result
    }
}

export function vanillin(root: Root): string {
    const parsedRules = parseRules(root)
    const mapper = new Mapper(
        reduceGlobalStyles(parsedRules.globalRules),
        reduceRegularStyles(parsedRules.regularRules),
        parsedRules.keyFrames.map(r => new KeyFrame(r.varName, r.data)),
    )
    return expressionsToTSString(mapper.map())
}
