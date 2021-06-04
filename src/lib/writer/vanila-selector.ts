import ts, { factory } from 'typescript'

class SelectorText {
    constructor(public readonly text: string) {
    }
}

class SelectorVar {
    constructor(public readonly varName: string) {
    }
}

export class VanillaSelectorMgr {
    private parts = new Array<SelectorText | SelectorVar>()

    // добавление ссылки на внешнюю переменную
    public pushVar(s: string): void {
      this.parts.push(new SelectorVar(s))
    }

    // добавление ноды селектора as-is (не reach элемент)
    public pushText(s: string): void {
      this.parts.push(new SelectorText(s))
    }

    public serialize(): string {
        return ts.createPrinter().printNode(
            ts.EmitHint.Unspecified,
            factory.createExpressionStatement(this.make()),
            ts.createSourceFile('source.ts', '', ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS)
        )
    }

    public isSelfOnly(): boolean {
      if (this.parts.length !== 1)
        return false
      const onlyPart = this.parts[0]
      if (!(onlyPart instanceof SelectorText))
        return false
      return onlyPart.text === '&'
    }

    public make(): ts.Expression {
    }
}
