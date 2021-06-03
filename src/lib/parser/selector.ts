import selectorParser from 'postcss-selector-parser'
import camelCase from 'camelcase'

import { VanillaSelectorMgr } from '../writer'

export class GlobalSelector {
    constructor(
        public readonly vanillaSelector: VanillaSelectorMgr,
        public readonly deps: Set<string>,
    ) {}
}

export class RegularSelector {
    constructor(
        public readonly vanillaSelector: VanillaSelectorMgr,
        public readonly deps: Set<string>,
        public readonly varName: string,
    ) {}
}

type TSPResult = GlobalSelector | RegularSelector

export const vanillaSelectorParser = selectorParser<TSPResult>(function (selectors): TSPResult {
})
