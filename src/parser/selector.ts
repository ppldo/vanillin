import selectorParser, {Selector, ClassName} from 'postcss-selector-parser'

function parseSelectorInner(selector: Selector): Array<string | {
    var: string
    node: ClassName
}> {
    const parts: Array<string | { var: string, node: ClassName}> = []
    for (const node of selector.nodes) {
        if (node.type === 'class') {
            const vn = node.value
            parts.push({var: vn, node})
        } else if (node.type === 'pseudo') {
            if (node.length > 1)
                throw new Error('???')
            if (node.value === ':global') {
                if (node.length) {
                    node.nodes[0].each(n => void parts.push(n.toString()))
                    continue
                }
                else {
                    selector.nodes.slice(selector.nodes.indexOf(node) + 1)
                        .forEach(n => void parts.push(n.toString()))
                    break
                }
            }
            parts.push(node.value)
            if (node.length > 0)
                parts.push('(', ...parseSelectorInner(node.nodes[0]), ')')
        } else if (typeof node.value === 'string') {
            parts.push(node.toString())
        }
    }
    return parts
}

export type VanillaSelector = {
    targetClass: string | null
    parts: Array<string | { var: string }>
}

const vanillaSelectorParser = selectorParser<VanillaSelector>(function (selectors): VanillaSelector {
    if (selectors.length > 1)
        throw new Error('???')
    const selector = selectors.nodes[0]

    let targetClassNode: ClassName | undefined
    loop: for (const node of selector.nodes.slice().reverse()) {
        switch (node.type) {
            case 'class': {
                targetClassNode = node
                break loop
            }
            case 'combinator':
                break loop
            default:
                break
        }
    }

    const parts = parseSelectorInner(selector)
        .map(p => typeof p === 'string'
            ? p
            : p.node === targetClassNode
                ? '&'
                : {var: p.var})

    return {
        targetClass: parts.includes('&') ? targetClassNode?.value ?? null : null,
        parts,
    }
})

export function parseSelector(selector: string): VanillaSelector {
    return vanillaSelectorParser.transformSync(selector)
}
