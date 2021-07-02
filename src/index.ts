import {Root} from 'postcss'

import {Style} from './model'
import {
    expressionsToTSString,
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

    replaceDep(dep: string, to: string) {
        this.deps.delete(dep)
        this.deps.add(to)
        this.vanillaSelector.replaceVar(dep, to)
    }
}

class RegularStyle implements IRegularStyle {
    public markerName: string | null = null
    public isMarker: boolean = false

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

    public static makeMarker(name: string): RegularStyle {
        const s = new RegularStyle(name, [], new Set())
        s.isMarker = true
        return s
    }

    addSelector(conf: ISelectorConf, deps: Iterable<string>) {
        this.selectorConfs.push(conf)
        for (const dep of deps)
            this.deps.add(dep)
    }

    replaceDep(dep: string, to: string) {
        this.deps.delete(dep)
        this.deps.add(to)
        for (const selectorConf of this.selectorConfs) {
            selectorConf.vanillaSelector.replaceVar(dep, to)
        }
    }
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


function reduceStyles(rules: ParsedRule[]): Array<RegularStyle | GlobalStyle> {
    let last: Array<RegularStyle> = []
    const res: Array<RegularStyle | GlobalStyle> = []
    const regulars = new Set<string>()

    for (const {selector, style} of rules) {
        const target = selector.targetClass
        if (!target) {
            res.push(...last, new GlobalStyle(
                new VanillaSelectorMgr(selector.parts),
                style,
                new Set(selector.deps),
            ))
            last = []
        } else {
            const conf: ISelectorConf = {
                vanillaSelector: new VanillaSelectorMgr(selector.parts),
                style,
            }

            const existing = last.find(s => s.varName === target)
            if (existing)
                existing.addSelector(conf, selector.deps)
            else if (regulars.has(target)) {
                res.push(...last, new GlobalStyle(
                    new VanillaSelectorMgr(selector.parts.map(p => p === '&' ? {var: target} : p)),
                    style,
                    new Set(selector.deps).add(target),
                ))
                last = []
            } else {
                last.push(new RegularStyle(target, [conf], new Set(selector.deps)))
                regulars.add(target)
            }
        }
    }
    res.push(...last)

    return res
}

class Mapper {
    constructor(
        readonly styles: Array<RegularStyle | GlobalStyle>,
        readonly keyframes: readonly KeyFrame[],
    ) {
    }

    private addStyles(result: Array<IExpression>) {
        const existing = new Set<string>()

        for (const style of this.styles) {
            if (style instanceof RegularStyle)
                existing.add(style.varName)
        }

        const declared = new Set<string>()

        const markers = new Map<string, string>()

        for (const style of this.styles) {
            for (const dep of [...style.deps]) {
                const markerName = dep + 'Marker'

                if (!declared.has(dep)) {
                    if (!existing.has(dep)) { //just add empty
                        result.push(RegularStyle.makeEmpty(dep))
                        existing.add(dep)
                        declared.add(dep)
                    } else { //need circular marker
                        if (!markers.has(dep)) {
                            markers.set(dep, markerName)
                            result.push(RegularStyle.makeMarker(markerName))
                        }
                        style.replaceDep(dep, markerName)
                    }
                }

                if (markers.has(dep))
                    style.replaceDep(dep, markerName)
            }

            if (style instanceof RegularStyle) {
                style.markerName = markers.get(style.varName) ?? null
                declared.add(style.varName)
            }

            result.push(style)
        }
    }

    private addKeyFrames(result: Array<IExpression>) {
        for (const r of this.keyframes) {
            result.push(new KeyFrame(r.varName, r.data, r.isGlobal))
        }
    }

    public map(): Array<IExpression> {
        const result = new Array<IExpression>()
        this.addKeyFrames(result)
        this.addStyles(result)
        return result
    }
}

export function vanillin(root: Root, vars?: { names: Iterable<string>, importPath: string }): string {
    const parsedRules = parseRules(root)
    const mapper = new Mapper(
        reduceStyles(parsedRules.rules),
        parsedRules.keyFrames.map(r => new KeyFrame(r.varName, r.data, r.isGlobal)),
    )
    return expressionsToTSString(mapper.map(), vars)
}
