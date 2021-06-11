import ts, { factory } from 'typescript'

function makeStmt(): ts.Statement {
    return factory.createExpressionStatement(
        factory.createTemplateExpression(
            factory.createTemplateHead(
                "strHead "
            ),
            [
                factory.createTemplateSpan(
                    factory.createIdentifier("tag0"),
                    factory.createTemplateMiddle(
                        " strMiddle1 ",
                        " strMiddle1 "
                    )
                ),
                factory.createTemplateSpan(
                    factory.createIdentifier("tag1"),
                    factory.createTemplateMiddle(
                        "  strMiddle2 ",
                        "  strMiddle2 "
                    )
                ),
                factory.createTemplateSpan(
                    factory.createIdentifier("tag2"),
                    factory.createTemplateTail(
                        " strTail",
                        " strTail"
                    )
                )
            ]
        )
    )
}


const printer = ts.createPrinter()
const sourceFile: ts.SourceFile =
    ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
const result = printer.printNode(
    ts.EmitHint.Unspecified,
    makeStmt(),
    sourceFile
);
