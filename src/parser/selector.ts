import selectorParser from 'postcss-selector-parser'

import {VanillaSelectorMgr} from '../writer'

export class GlobalSelector {
    constructor(
        public readonly vanillaSelector: VanillaSelectorMgr,
        public readonly deps: Set<string>,
    ) {
    }
}

export class RegularSelector {
    constructor(
        public readonly vanillaSelector: VanillaSelectorMgr,
        public readonly deps: Set<string>,
        public readonly varName: string,
    ) {
    }
}

type TSPResult = GlobalSelector | RegularSelector

export const vanillaSelectorParser = selectorParser<TSPResult>(function (selectors): TSPResult {
    let isGlobalStyle = true
    let targetClassNode: selectorParser.ClassName | undefined
    selectors.each(s => {
        loop: for (const node of s.nodes.slice().reverse()) {
            switch (node.type) {
                case 'class': {
                    isGlobalStyle = false
                    targetClassNode = node
                    break loop
                }
                case 'string':
                case 'pseudo':
                case 'combinator': {
                    break
                }
                default: {
                    break loop
                }
            }
        }
    })

    let vanillaSelector = new VanillaSelectorMgr()
    let varName = ''
    let deps = new Set<string>()
    let result: TSPResult | undefined

    selectors.each(s => {
        for (const node of s.nodes) {
            if (node.type === 'class') {
                const vn = node.value

                if (node === targetClassNode) {
                    vanillaSelector.pushText('&')
                    varName = vn
                } else {
                    vanillaSelector.pushVar(vn)
                    deps.add(vn)
                }
            } else {
                if (typeof node.value === 'string') {
                    vanillaSelector.pushText(node.value)
                }
            }
        }
    })
    if (isGlobalStyle) {
        result = new GlobalSelector(vanillaSelector, deps)
    } else {
        result = new RegularSelector(vanillaSelector, deps, varName)
    }
    return result
})
