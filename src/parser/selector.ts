import selectorParser, {Selector, ClassName} from 'postcss-selector-parser'

function parseSelectorInner(selector: Selector, targetClassNode?: ClassName): Array<string | { var: string }> {
    const parts: Array<string | { var: string }> = []
    for (const node of selector.nodes) {
        if (node.type === 'class') {
            const vn = node.value
            if (node === targetClassNode)
                parts.push('&')
            else
                parts.push({var: vn})
        } else if (node.type === 'pseudo') {
            parts.push(node.value)
            if (node.length > 0) {
                if (node.length > 1)
                    throw new Error('???')
                parts.push('(', ...parseSelectorInner(node.nodes[0]), ')')
            }
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

    return {
        targetClass: targetClassNode?.value ?? null,
        parts: parseSelectorInner(selector, targetClassNode),
    }
})

export function parseSelector(selector: string): VanillaSelector {
    return vanillaSelectorParser.transformSync(selector)
}
