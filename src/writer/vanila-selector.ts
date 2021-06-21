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
    if (this.parts.some(p => p instanceof SelectorVar)) {
      let head = ''
      let currentSpan: {varName: string, text: string} | undefined = undefined
      const spans: ts.TemplateSpan[] = []
      for (const p of this.parts) {
        if (p instanceof SelectorVar) {
          if (currentSpan) {
            spans.push(
              factory.createTemplateSpan(
                factory.createIdentifier(currentSpan.varName),
                factory.createTemplateMiddle(currentSpan.text)
              ),
            )
          }
          currentSpan = {varName: p.varName, text: ''}
        } else if (p instanceof SelectorText) {
          if (!currentSpan) {
            head += p.text
          } else {
            currentSpan.text += p.text
          }
        }
      }
      if (!currentSpan)
        new Error('assertion error')
      else {
        spans.push(
          factory.createTemplateSpan(
            factory.createIdentifier(currentSpan.varName),
            factory.createTemplateTail(currentSpan.text)
          )
        )
      }
      return factory.createTemplateExpression(
        factory.createTemplateHead(head),
        spans
      )
    } else {
      let literal = ''
      for (const part of this.parts)
        literal += (part as SelectorText).text
      return factory.createStringLiteral(literal)
    }
  }
}
