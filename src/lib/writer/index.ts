import ts, { factory } from 'typescript'

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
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(prop),
            ts.factory.createNumericLiteral(value)
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
      return ts.factory.createObjectLiteralExpression(
        this.makePropsAst(),
        true
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
    }

    public make(): ts.VariableStatement {
    }
}

export function expressionsToTSString(exprs: Array<IExpression>): string {
    const tsNodes: ts.Node[] = []
    // TODO: tsNodes

    const result = ts.createPrinter().printList(
        ts.ListFormat.SourceFileStatements,
        ts.createNodeArray(tsNodes),
        ts.createSourceFile('source.ts', '', ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS)
    )

    return result
}
