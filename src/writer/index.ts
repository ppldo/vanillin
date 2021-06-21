import ts, {factory} from 'typescript'

import { VanillaSelectorMgr } from './vanila-selector'
import camelCase from 'camelcase'
export { VanillaSelectorMgr }

type Style = Record<string, string | number>

export interface ISelectorConf {
    vanillaSelector: VanillaSelectorMgr
    style: Style
}

export enum StatementEnum {
    GLOBAL,
    REGULAR,
    COMMENT,
    KEYFRAME,
}

export interface IGlobalStyle extends ISelectorConf {
    type: StatementEnum.GLOBAL
}
export interface IRegularStyle {
    type: StatementEnum.REGULAR
    varName: string
    selectorConfs: ISelectorConf[]
}
export interface IComment {
    type: StatementEnum.COMMENT
    comment: string
}
export interface IKeyFrame {
    type: StatementEnum.KEYFRAME
    varName: string
    data: Map<string, Style>
}

export type IExpression = IGlobalStyle | IRegularStyle | IComment | IKeyFrame

class CSSPropsAstMaker {
    constructor(
        private s: Style
    ) {}

    // Возвращает AST содержащий:
    // margin: 0
    public makePropsAst(): ts.ObjectLiteralElementLike[] {
      let result = []
      for (const [prop, value] of Object.entries(this.s)) {
        result.push(
          factory.createPropertyAssignment(
            factory.createIdentifier(prop),
            (typeof value === 'string') ?
              factory.createStringLiteral(value) :
              factory.createNumericLiteral(value)
          )
        )
      }
      return result
    }

    // Возвращает AST содержащий:
    // {
    //   margin: 0
    // }
    public makeObjectAst(): ts.ObjectLiteralExpression {
      return factory.createObjectLiteralExpression(
        this.makePropsAst()
      )
    }
}

class GlobalStyleAstMaker {
    constructor(
        private globalStyle: IGlobalStyle,
    ) {}

    // Возвращает AST содержащий:
    // globalStyle('html, body', {
    //     margin: 0
    // });

    public make(): ts.ExpressionStatement {
      const cssProps = new CSSPropsAstMaker(this.globalStyle.style)
      return (
        factory.createExpressionStatement(factory.createCallExpression(
          factory.createIdentifier("globalStyle"),
          undefined,
          [
            this.globalStyle.vanillaSelector.make(),
            cssProps.makeObjectAst()
          ]
        ))
      )
    }
}

class VariableNameAstMaker {
    private static keywordsList = [
        'any',
        'any',
        'as',
        'break',
        'case',
        'catch',
        'const',
        'continue',
        'do',
        'delete',
        'else',
        'enum',
        'export',
        'extends',
        'false',
        'finally',
        'for',
        'function',
        'get',
        'if',
        'implements',
        'in',
        'instanceof',
        'interface',
        'let',
        'module',
        'new',
        'new',
        'null',
        'number',
        'package',
        'private',
        'public',
        'return',
        'static',
        'string',
        'super',
        'switch',
        'this',
        'throw',
        'true',
        'try',
        'type',
        'typeof',
        'var',
        'void',
        'while',
        'yield',
    ]

    constructor(private varName: string) {}

    // Возвращает AST содержащий:
    // myVar
    public make(): ts.Identifier {
      let varName = camelCase(this.varName)
      if (VariableNameAstMaker.keywordsList.includes(this.varName))
        varName = `my${camelCase(this.varName)}`
      return factory.createIdentifier(varName)
    }
}

class RegularStyleAstMaker {
    constructor(
        private regularStyle: IRegularStyle,
    ) {}

    // Возвращает AST содержащий:
    // {
    //     display: 'flex'
    //     selectors: {
    //         [`${parentClass}:focus &`]: {
    //            background: '#fafafa'
    //         }
    //     }
    // }

    private createStyleRuleAst(): ts.Expression {
      if (this.regularStyle.selectorConfs.some(conf => !conf.vanillaSelector.isSelfOnly())) {
        return factory.createObjectLiteralExpression(
          [
            ...this.regularStyle.selectorConfs.filter(s => s.vanillaSelector.isSelfOnly()).flatMap((s) => {
              return new CSSPropsAstMaker(s.style).makePropsAst()
            }),
            factory.createPropertyAssignment(
              factory.createIdentifier("selectors"),
              factory.createObjectLiteralExpression(
                [...this.regularStyle.selectorConfs.filter(s => !s.vanillaSelector.isSelfOnly()).map(s => {
                  return factory.createPropertyAssignment(
                    factory.createComputedPropertyName(s.vanillaSelector.make()),
                    new CSSPropsAstMaker(s.style).makeObjectAst(),
                  )
                })],
              )
            )
          ],
          true
        )
      } else {
        return factory.createObjectLiteralExpression(
          [
            ...this.regularStyle.selectorConfs.filter(s => s.vanillaSelector.isSelfOnly()).flatMap((s) => {
              return new CSSPropsAstMaker(s.style).makePropsAst()
            }),
          ],
          true
        )
      }
    }

    // Возвращает AST содержащий:
    // export const className = style({
    //     display: 'flex'
    //     selectors: {
    //         [`${parentClass}:focus &`]: {
    //            background: '#fafafa'
    //         }
    //     }
    // })
    public make(): ts.VariableStatement {
      return (
        factory.createVariableStatement(
          [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          factory.createVariableDeclarationList(
            [factory.createVariableDeclaration(
              new VariableNameAstMaker(this.regularStyle.varName).make(),
              undefined,
              undefined,
              factory.createCallExpression(
                factory.createIdentifier("style"),
                undefined,
                [this.createStyleRuleAst()]
              )
            )],
            ts.NodeFlags.Const
          )
        )
      )
    }
}

class CommentAstMaker {
    constructor(
        private comment: IComment,
    ) {}

    // Возвращает AST содержащий:
    // /**
    //  * TODO: this is Commeeeeeeeeeent! */
    public make(): ts.JSDoc {
        return factory.createJSDocComment(this.comment.comment)
    }
}

export class KeyframeAstMaker {
    constructor(
        private keyFrame: IKeyFrame,
    ) {}

    private makeKeyFrameConfigAst(): ts.ObjectLiteralExpression {
      return factory.createObjectLiteralExpression(
        [...this.keyFrame.data.entries()].map(([literal, style]) => {
          return factory.createPropertyAssignment(
            factory.createStringLiteral(literal),
            new CSSPropsAstMaker(style).makeObjectAst()
          )
        })
      )
    }

    public make(): ts.VariableStatement {
      return factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [factory.createVariableDeclaration(
            factory.createIdentifier(this.keyFrame.varName),
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createIdentifier("keyframes"),
              undefined,
              [this.makeKeyFrameConfigAst()]
            )
          )],
          ts.NodeFlags.Const
        )
      )
    }
}

export function expressionsToTSString(exprs: Array<IExpression>): string {
  const tsNodes: ts.Node[] = []
  const imports: Array<string> = []
  for (const e of exprs) {
    switch (e.type) {
      case StatementEnum.REGULAR: {
        if (!imports.includes('style'))
          imports.push('style')
        break
      }
      case StatementEnum.GLOBAL: {
        if (!imports.includes('globalStyle'))
          imports.push('globalStyle')
        break
      }
      case StatementEnum.KEYFRAME: {
        if (!imports.includes('keyframes'))
          imports.push('keyframes')
        break
      }
    }
  }
  tsNodes.push(
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          ...imports.map(i => {
            return factory.createImportSpecifier(
              undefined,
              factory.createIdentifier(i)
            )
          })
        ])
      ),
      factory.createStringLiteral("@vanilla-extract/css")
    )
  )

  for (const e of exprs) {
    switch (e.type) {
      case StatementEnum.REGULAR: {
        tsNodes.push(new RegularStyleAstMaker(e).make())
        break
      }
      case StatementEnum.GLOBAL: {
        tsNodes.push(new GlobalStyleAstMaker(e).make())
        break
      }
      case StatementEnum.KEYFRAME: {
        tsNodes.push(new KeyframeAstMaker(e).make())
        break
      }
      case StatementEnum.COMMENT: {
        tsNodes.push(new CommentAstMaker(e).make())
        break
      }
    }
  }

  const result = ts.createPrinter().printList(
      ts.ListFormat.SourceFileStatements,
      ts.createNodeArray(tsNodes),
      ts.createSourceFile('source.ts', '', ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS)
  )

  return result
}
