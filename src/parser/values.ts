import valueParser, {Node, stringify} from 'postcss-value-parser'
import {Value} from '../model'

function parseVarNodes(nodes: Node[]): Value {
    if (nodes.length === 0) {
        return ['var()']
    }
    const parts: Value = []
    const fallback: Value = []
    if (nodes.length > 2) {
        fallback.push(...parseInnerValue(nodes.slice(2).filter(n => n.value !== ',')))
    }
    parts.push({var: nodes[0].value, fallback})
    return parts
}

function parseInnerValue(nodes: Node[]): Value {
    const parts: Value = []
    for (const node of nodes) {
        if (node.type !== 'function') {
            parts.push(stringify(node))
        } else {
            if (node.value === 'var') {
                parts.push(...parseVarNodes(node.nodes))
            } else {
                parts.push(node.value, '(', ...parseInnerValue(node.nodes), ')')
            }
        }
    }
    return parts
}

export function parseValue(value: string): Value {
    return parseInnerValue(valueParser(value).nodes)
}
