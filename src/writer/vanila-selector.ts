import ts, {factory} from 'typescript'
import {makeTemplateAst, VariableNameAstMaker} from './index'

export class VanillaSelectorMgr {
    constructor(private parts: Array<string | { var: string }>) {
    }

    replaceVar(name: string, to: string) {
        for (const p of this.parts)
            if (typeof p === 'object' && p.var === name)
                p.var = to
    }

    public isSelfOnly(): boolean {
        if (this.parts.length !== 1)
            return false
        const onlyPart = this.parts[0]
        if (typeof onlyPart !== 'string')
            return false
        return onlyPart === '&'
    }

    private checkLocal<T extends ts.Node>(node: T): T {
        if (this.parts.includes(':local'))
            ts.addSyntheticLeadingComment(node, ts.SyntaxKind.SingleLineCommentTrivia, 'TODO :local() pseudo from css modules spec not supported')
        return node
    }

    public make(): ts.Expression {
        if (this.parts.every(p => typeof p === 'string')) {
            let literal = ''
            for (const part of this.parts)
                literal += part
            return this.checkLocal(factory.createStringLiteral(literal))
        }
        return this.checkLocal(makeTemplateAst(
            this.parts.map(p => (typeof p === 'string') ? p : {expr: new VariableNameAstMaker(p.var).make()})
        ))
    }
}
