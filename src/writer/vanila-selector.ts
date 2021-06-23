import ts, {factory} from 'typescript'
import {VariableNameAstMaker} from './index'


export class VanillaSelectorMgr {
    constructor(private parts: Array<string | {var: string}>) {
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

        let head = ''
        let currentSpan: { varName: string, text: string } | undefined = undefined
        const spans: ts.TemplateSpan[] = []
        for (const p of this.parts) {
            if (typeof p === 'object') {
                if (currentSpan) {
                    spans.push(
                        factory.createTemplateSpan(
                            new VariableNameAstMaker(currentSpan.varName).make(),
                            factory.createTemplateMiddle(currentSpan.text),
                        ),
                    )
                }
                currentSpan = {varName: p.var, text: ''}
            } else {
                if (!currentSpan) {
                    head += p
                } else {
                    currentSpan.text += p
                }
            }
        }
        if (!currentSpan)
            new Error('assertion error')
        else {
            spans.push(
                factory.createTemplateSpan(
                    new VariableNameAstMaker(currentSpan.varName).make(),
                    factory.createTemplateTail(currentSpan.text),
                ),
            )
        }
        return this.checkLocal(factory.createTemplateExpression(
            factory.createTemplateHead(head),
            spans,
        ))
    }
}
