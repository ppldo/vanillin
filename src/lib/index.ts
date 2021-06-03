import { Root } from 'postcss'
import ld from 'lodash'

import { Style } from './model'
import {
    expressionsToTSString,
    ISelectorConf,
    VanillaSelectorMgr,
    IGlobalStyle,
    IRegularStyle,
    IComment,
    IKeyFrame,
    IExpression,
    StatementEnum
} from './writer'
import {
    parseRules,
    IGlobalRule,
    IRegularRule,
} from './parser/rules'

class GlobalStyle implements IGlobalStyle {
    public readonly type = StatementEnum.GLOBAL

    constructor(
        public readonly vanillaSelector: VanillaSelectorMgr,
        public readonly style: Style,
        public readonly deps: Set<string>,
    ) {}
}

class RegularStyle implements IRegularStyle {
    public readonly type = StatementEnum.REGULAR

    constructor(
        public readonly varName: string,
        public readonly selectorConfs: ISelectorConf[],
        public readonly deps: Set<string>,
    ) {}

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
    public readonly comment = 'TODO: keyframes interpolations is not implemented yet, please fix it yourself!'
}

class KeyFrame implements IKeyFrame {
    public readonly type = StatementEnum.KEYFRAME

    constructor(
        public readonly varName: string,
        public readonly data: Map<string, Style>,
    ) {}
}

function reduceGlobalStyles(rules: IGlobalRule[]): GlobalStyle[] {
}

function reduceRegularStyles(rules: IRegularRule[]): RegularStyle[] {
}

class Mapper {
    constructor(
        readonly globalStyles: GlobalStyle[],
        readonly regularStyles: RegularStyle[],
        readonly keyframes: KeyFrame[],
    ) {}

    private getEmptyVarNames(): Set<string> {
    }

    private addEmptyRegularStyles(result: Array<IExpression>): Set<string> {
    }

    private addRegularStyles(result: Array<IExpression>, processedVarNames: Set<string>) {
    }

    private addGlobalStyles(result: Array<IExpression>, processedVarNames: Set<string>) {
    }

    private addKeyFrames(result: Array<IExpression>) {
    }

    public map(): Array<IExpression> {
    }
}

export function vanillin(root: Root): string {
}
