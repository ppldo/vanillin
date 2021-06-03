import ts, { factory } from 'typescript'

class SelectorText {
    constructor(public readonly text: string) {}
}

class SelectorVar {
    constructor(public readonly varName: string) {}
}

export class VanillaSelectorMgr {
    private parts = new Array<SelectorText | SelectorVar>()

    // добавление ссылки на внешнюю переменную
    public pushVar(s: string): void {
    }

    // добавление ноды селектора as-is (не reach элемент)
    public pushText(s: string): void {
    }

    public serialize(): string {
        return ts.createPrinter().printNode(
            ts.EmitHint.Unspecified,
            factory.createExpressionStatement(this.make()),
            ts.createSourceFile('source.ts', '', ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS)
        )
    }

    public isSelfOnly(): boolean {
    }

    public make(): ts.Expression {
    }
}
