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
import {ParsedRule, parseRules} from './parser/rules'

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

class KeyFrame implements IKeyFrame {
    public readonly type = StatementEnum.KEYFRAME

    constructor(
        public readonly varName: string,
        public readonly data: Map<string, Style>,
        public readonly isGlobal: boolean,
    ) {
    }
}

function reduceGlobalStyles(rules: ParsedRule[]): GlobalStyle[] {
    return ld.chain(rules).groupBy(r => r.selector.template).values().map(globalRules => {
        let allDeps = new Set<string>()
        let allStyles: Style = {}
        for (const globalRule of globalRules) {
            allDeps = new Set([...allDeps, ...globalRule.selector.deps])
            allStyles = {...allStyles, ...globalRule.styles}
        }
        return new GlobalStyle(new VanillaSelectorMgr(globalRules[0].selector.parts), allStyles, allDeps)
    }).value()
}

function reduceRegularStyles(rules: ParsedRule[]): RegularStyle[] {
    return ld.chain(rules).groupBy((r) => {
        return r.selector.targetClass!
    }).values().map((regularRulesByVar) => {
        let allDeps = new Set<string>()
        for (const r of regularRulesByVar) {
            allDeps = new Set([...allDeps, ...r.selector.deps])
        }
        const selectorConfs: ISelectorConf[] = ld.chain(regularRulesByVar)
            .groupBy(r => r.selector.template)
            .values().map(regularRulesBySelector => {
                let style: Style = {}
                for (const r of regularRulesBySelector) {
                    style = {...style, ...r.styles}
                }
                return {
                    vanillaSelector: new VanillaSelectorMgr(regularRulesBySelector[0].selector.parts),
                    style,
                }
            }).value()
        return new RegularStyle(regularRulesByVar[0].selector.targetClass!, selectorConfs, allDeps)
    }).value()
}

class Mapper {
    constructor(
        readonly globalStyles: readonly GlobalStyle[],
        readonly regularStyles: readonly RegularStyle[],
        readonly keyframes: readonly KeyFrame[],
    ) {
    }

    private addEmptyRegularStyles(result: Array<IExpression>): Set<string> {
        let allDeps: Array<string> = []
        const existing = new Set<string>()

        for (const style of this.regularStyles) {
            existing.add(style.varName)
            allDeps.push(...style.deps.values())
        }
        for (const style of this.globalStyles) {
            allDeps.push(...style.deps.values())
        }
        const empty = new Set<string>()
        for (const name of allDeps) {
            if (!existing.has(name)) {
                result.push(new RegularStyle(name, [], new Set<string>()))
                empty.add(name)
                existing.add(name)
            }
        }
        return empty
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
        for (const r of this.keyframes) {
            result.push(new KeyFrame(r.varName, r.data, r.isGlobal))
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

export function vanillin(root: Root, vars?: {names: Iterable<string>, importPath: string}): string {
    const parsedRules = parseRules(root)
    const mapper = new Mapper(
        reduceGlobalStyles(parsedRules.globalRules),
        reduceRegularStyles(parsedRules.regularRules),
        parsedRules.keyFrames.map(r => new KeyFrame(r.varName, r.data, r.isGlobal)),
    )
    return expressionsToTSString(mapper.map(), vars)
}
