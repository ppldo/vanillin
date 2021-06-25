import ts, {factory, SyntaxKind} from 'typescript'

import {VanillaSelectorMgr} from './vanila-selector'
import camelCase from 'camelcase'

export {VanillaSelectorMgr}

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

const makeObject: typeof factory.createObjectLiteralExpression = (properties) => {
    return factory.createObjectLiteralExpression(properties, true)
}

class CSSPropsAstMaker {
    constructor(
        private s: Style,
    ) {
    }

    // Возвращает AST содержащий:
    // margin: 0
    public makePropsAst(): ts.ObjectLiteralElementLike[] {
        let result = []
        const animationProp = ['animation', 'animationName']
        const vars = []

        for (let [prop, value] of Object.entries(this.s)) {
            if (prop.startsWith('--')) {
                vars.push({prop, value})
                continue
            }
            else if (prop.startsWith('-')) {
                prop = camelCase(prop, {pascalCase: true})
            } else {
                prop = camelCase(prop)
            }
            const node = factory.createPropertyAssignment(
                factory.createIdentifier(prop),
                (typeof value === 'string') ?
                    factory.createStringLiteral(value) :
                    factory.createNumericLiteral(value),
            )
            if (animationProp.includes(prop)) {
                ts.addSyntheticLeadingComment(
                    node, SyntaxKind.SingleLineCommentTrivia,
                    'TODO: local animation name interpolation is not implemented yet, please fix it yourself!', true,
                )
            }

            result.push(node)
        }
        if (vars.length) {
            result.unshift(
                factory.createPropertyAssignment(
                    factory.createIdentifier('vars'),
                    makeObject(
                        [...vars.map(v => {
                            return factory.createPropertyAssignment(
                                factory.createStringLiteral(v.prop),
                                factory.createStringLiteral(v.value.toString()),
                            )
                        })],
                    ),
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
        return makeObject(this.makePropsAst())
    }
}

class GlobalStyleAstMaker {
    constructor(
        private globalStyle: IGlobalStyle,
    ) {
    }

    // Возвращает AST содержащий:
    // globalStyle('html, body', {
    //     margin: 0
    // });

    public make(): ts.ExpressionStatement {
        const cssProps = new CSSPropsAstMaker(this.globalStyle.style)
        return (
            factory.createExpressionStatement(factory.createCallExpression(
                factory.createIdentifier('globalStyle'),
                undefined,
                [
                    this.globalStyle.vanillaSelector.make(),
                    cssProps.makeObjectAst(),
                ],
            ))
        )
    }
}

export class VariableNameAstMaker {
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
        //imports from vanilla-extract
        'style',
        'globalStyle',
        'keyframes',
    ]

    readonly isReserved: boolean
    readonly escapedName: string
    readonly rawName: string

    constructor(rawName: string) {
        if (rawName.includes('-'))
            rawName = camelCase(rawName)
        this.rawName = rawName
        this.isReserved = VariableNameAstMaker.keywordsList.includes(rawName)
        if (this.isReserved)
            this.escapedName = `${rawName}Style`
        else
            this.escapedName = rawName
    }

    // Возвращает AST содержащий:
    // varStyle
    public make(): ts.Identifier {
        return factory.createIdentifier(this.escapedName)
    }
}

class RegularStyleAstMaker {
    constructor(
        private regularStyle: IRegularStyle,
    ) {
    }

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
            return makeObject(
                [
                    ...this.regularStyle.selectorConfs.filter(s => s.vanillaSelector.isSelfOnly()).flatMap((s) => {
                        return new CSSPropsAstMaker(s.style).makePropsAst()
                    }),
                    factory.createPropertyAssignment(
                        factory.createIdentifier('selectors'),
                        makeObject(
                            [...this.regularStyle.selectorConfs.filter(s => !s.vanillaSelector.isSelfOnly()).map(s => {
                                return factory.createPropertyAssignment(
                                    factory.createComputedPropertyName(s.vanillaSelector.make()),
                                    new CSSPropsAstMaker(s.style).makeObjectAst(),
                                )
                            })],
                        ),
                    ),
                ],
            )
        } else {
            return makeObject(
                [
                    ...this.regularStyle.selectorConfs.filter(s => s.vanillaSelector.isSelfOnly()).flatMap((s) => {
                        return new CSSPropsAstMaker(s.style).makePropsAst()
                    }),
                ],
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
    public make(): [ts.VariableStatement] | [ts.VariableStatement, ts.ExportDeclaration] {
        const varName = new VariableNameAstMaker(this.regularStyle.varName)
        const varDecl = factory.createVariableStatement(
            varName.isReserved ? undefined : [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            factory.createVariableDeclarationList(
                [factory.createVariableDeclaration(
                    varName.make(),
                    undefined,
                    undefined,
                    factory.createCallExpression(
                        factory.createIdentifier('style'),
                        undefined,
                        [this.createStyleRuleAst()],
                    ),
                )],
                ts.NodeFlags.Const,
            ),
        )

        return !varName.isReserved ? [varDecl] : [
            varDecl,
            factory.createExportDeclaration(
                undefined,
                undefined,
                false,
                factory.createNamedExports([factory.createExportSpecifier(
                    factory.createIdentifier(varName.escapedName),
                    factory.createIdentifier(varName.rawName),
                )]),
            ),
        ]
    }
}

class CommentAstMaker {
    constructor(
        private comment: IComment,
    ) {
    }

    // Возвращает AST содержащий:
    // //TODO: this is Commeeeeeeeeeent!
    public make(): ts.Statement {
        const s = factory.createEmptyStatement()
        ts.addSyntheticLeadingComment(s, SyntaxKind.SingleLineCommentTrivia, this.comment.comment)
        return s
    }
}

export class KeyframeAstMaker {
    constructor(
        private keyFrame: IKeyFrame,
    ) {
    }

    private makeKeyFrameConfigAst(): ts.ObjectLiteralExpression {
        return makeObject(
            [...this.keyFrame.data.entries()].map(([literal, style]) => {
                return factory.createPropertyAssignment(
                    factory.createStringLiteral(literal),
                    new CSSPropsAstMaker(style).makeObjectAst(),
                )
            }),
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
                        factory.createIdentifier('keyframes'),
                        undefined,
                        [this.makeKeyFrameConfigAst()],
                    ),
                )],
                ts.NodeFlags.Const,
            ),
        )
    }
}

export function expressionsToTSString(exprs: Array<IExpression>): string {
    const tsNodes: ts.Statement[] = []
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
                            factory.createIdentifier(i),
                        )
                    }),
                ]),
            ),
            factory.createStringLiteral('@vanilla-extract/css'),
        ),
    )

    for (const e of exprs) {
        switch (e.type) {
            case StatementEnum.REGULAR: {
                tsNodes.push(...new RegularStyleAstMaker(e).make())
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

    return ts.createPrinter().printFile(
        factory.createSourceFile(tsNodes, factory.createToken(SyntaxKind.EndOfFileToken), 0),
    )
}
