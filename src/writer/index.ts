import ts, {factory, SyntaxKind} from 'typescript'

import {VanillaSelectorMgr} from './vanila-selector'
import camelCase from 'camelcase'
import {Style, Value} from '../model'

export {VanillaSelectorMgr}

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

export function makeTemplateAst(parts: Array<string | { expr: ts.Expression }>): ts.TemplateExpression {
    let head: string | null = null
    const spans: { expr: ts.Expression, text: string }[] = []
    let text = ''
    let lastExpr: ts.Expression | null = null

    for (const p of parts) {
        if (typeof p === 'object') {
            if (lastExpr)
                spans.push({expr: lastExpr, text})
            else
                head = text
            text = ''
            lastExpr = p.expr
        } else {
            text += p
        }
    }

    if (head === null || !lastExpr)
        throw new Error('There is should be at least one variable substitution')

    spans.push({expr: lastExpr, text})

    return factory.createTemplateExpression(
        factory.createTemplateHead(head),
        spans.map((s, i, {length}) =>
            factory.createTemplateSpan(
                s.expr,
                (i === length - 1)
                    ? factory.createTemplateTail(s.text)
                    : factory.createTemplateMiddle(s.text),
            ),
        ),
    )
}

function valueToString(value: Value): string {
    return value.map(v => {
        if (typeof v === 'string')
            return v
        if (!v.fallback.length)
            return `var(${v.var})`
        return `var(${v.var}, ${valueToString(v.fallback)})`
    }).join('')
}

function makeExternalVar(file: FileMgr, varName: string): ts.Expression {
    return factory.createPropertyAccessExpression(
        factory.createIdentifier('vars'),
        factory.createIdentifier(file.importExternalVar(varName)),
    )
}

export class CSSValueAstMaker {
    constructor(
        private file: FileMgr,
        private canBeNumber: boolean = true,
    ) {
    }

    private includesExternalVars(value: Value): boolean {
        return value.some(v =>
            typeof v !== 'string'
            && (this.file.hasExternalVar(v.var) || this.includesExternalVars(v.fallback)),
        )
    }

    private makeValuePartExpressionAst(v: string | { var: string, fallback: Value }): ts.Expression {
        const inner = (v: string | { var: string, fallback: Value }): ts.Expression => {
            if (typeof v === 'string')
                return factory.createStringLiteral(v)

            const name = makeExternalVar(this.file, v.var)
            if (!v.fallback.length)
                return name

            return factory.createCallExpression(
                factory.createIdentifier(this.file.importFallback()),
                undefined,
                [name, ...v.fallback.map(inner)],
            )
        }

        return inner(v)
    }

    private flatFallbacks(value: Value): Array<string | { expr: ts.Expression }> {
        const inner = (v: string | { var: string, fallback: Value }): Array<string | { expr: ts.Expression }> => {
            if (typeof v === 'string')
                return [v]
            if (this.file.hasExternalVar(v.var)) {
                if (!v.fallback.length)
                    return [{expr: makeExternalVar(this.file, v.var)}]
                return [{expr: this.makeValuePartExpressionAst(v)}]
            }
            if (v.fallback.length)
                return ['var(', v.var, ', ', ...v.fallback.map(inner).join(', '), ')']
            return ['var(', v.var, ')']
        }
        return value.flatMap(inner)
    }

    public make(value: Value): ts.Expression {
        if (this.canBeNumber && value.length === 1 && typeof value[0] === 'string') {
            let numValue = Number(value[0])
            if (!isNaN(numValue))
                return factory.createNumericLiteral(numValue)
        }
        if (value.length === 1 && typeof value[0] === 'object' && this.file.hasExternalVar(value[0].var))
            return this.makeValuePartExpressionAst(value[0])
        if (value.every(v => typeof v === 'string'))
            return factory.createStringLiteral(value.join(''))
        if (!this.includesExternalVars(value)) {
            return factory.createStringLiteral(valueToString(value))
        }
        return makeTemplateAst(this.flatFallbacks(value))
    }
}

class CSSPropsAstMaker {
    constructor(
        private file: FileMgr,
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
            } else if (prop.startsWith('-')) {
                prop = camelCase(prop, {pascalCase: true})
            } else {
                prop = camelCase(prop)
            }
            const node = factory.createPropertyAssignment(
                factory.createStringLiteral(prop),
                new CSSValueAstMaker(this.file).make(value),
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
                    makeObject([...vars.map(v => factory.createPropertyAssignment(
                        this.file.hasExternalVar(v.prop)
                            ? factory.createComputedPropertyName(makeExternalVar(this.file, v.prop))
                            : factory.createStringLiteral(v.prop),
                        new CSSValueAstMaker(this.file, false).make(v.value),
                    ))]),
                ),
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
        private file: FileMgr,
        private globalStyle: IGlobalStyle,
    ) {
    }

    // Возвращает AST содержащий:
    // globalStyle('html, body', {
    //     margin: 0
    // });

    public make(): ts.ExpressionStatement {
        const cssProps = new CSSPropsAstMaker(this.file, this.globalStyle.style)
        return (
            factory.createExpressionStatement(factory.createCallExpression(
                factory.createIdentifier(this.file.importGlobalStyle()),
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
        'fallbackVar',
        'vars',
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
        private file: FileMgr,
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
                        return new CSSPropsAstMaker(this.file, s.style).makePropsAst()
                    }),
                    factory.createPropertyAssignment(
                        factory.createIdentifier('selectors'),
                        makeObject([...this.regularStyle.selectorConfs.filter(s => !s.vanillaSelector.isSelfOnly()).map(s => {
                            return factory.createPropertyAssignment(
                                factory.createComputedPropertyName(s.vanillaSelector.make()),
                                new CSSPropsAstMaker(this.file, s.style).makeObjectAst(),
                            )
                        })]),
                    ),
                ],
            )
        } else {
            return makeObject([
                ...this.regularStyle.selectorConfs.filter(s => s.vanillaSelector.isSelfOnly()).flatMap((s) => {
                    return new CSSPropsAstMaker(this.file, s.style).makePropsAst()
                }),
            ])
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
                        factory.createIdentifier(this.file.importStyle()),
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
        private file: FileMgr,
        private keyFrame: IKeyFrame,
    ) {
    }

    private makeKeyFrameConfigAst(): ts.ObjectLiteralExpression {
        return makeObject(
            [...this.keyFrame.data.entries()].map(([literal, style]) => {
                return factory.createPropertyAssignment(
                    factory.createStringLiteral(literal),
                    new CSSPropsAstMaker(this.file, style).makeObjectAst(),
                )
            }),
        )
    }

    public make(): ts.VariableStatement {
        return factory.createVariableStatement(
            [factory.createModifier(SyntaxKind.ExportKeyword)],
            factory.createVariableDeclarationList(
                [factory.createVariableDeclaration(
                    factory.createIdentifier(this.keyFrame.varName),
                    undefined,
                    undefined,
                    factory.createCallExpression(
                        factory.createIdentifier(this.file.importKeyframes()),
                        undefined,
                        [this.makeKeyFrameConfigAst()],
                    ),
                )],
                ts.NodeFlags.Const,
            ),
        )
    }
}

export class FileMgr {
    private vanilla = new Set<string>()
    private hasVars = false

    constructor(
        private readonly externalVars: Set<string>,
        private readonly varsImportPath: string,
    ) {
    }

    private import(str: string) {
        this.vanilla.add(str)
        return str
    }

    getImports(): Array<{ importNames: string[], from: string }> {
        const result = []
        if (this.vanilla.size)
            result.push({importNames: [...this.vanilla], from: '@vanilla-extract/css'})
        if (this.hasVars)
            result.push({importNames: ['vars'], from: this.varsImportPath})
        return result
    }

    importKeyframes(): string {
        return this.import('keyframes')
    }

    importFallback(): string {
        return this.import('fallbackVar')
    }

    importStyle(): string {
        return this.import('style')
    }

    importGlobalStyle(): string {
        return this.import('globalStyle')
    }

    hasExternalVar(name: string): boolean {
        return this.externalVars.has(camelCase(name))
    }

    importExternalVar(name: string): string {
        const varName = camelCase(name)
        if (!this.externalVars.has(varName))
            throw new Error('There is no external var named ' + name)
        this.hasVars = true
        return varName
    }
}

export function expressionsToTSString(exprs: Array<IExpression>, vars?: {names: Iterable<string>, importPath: string}): string {
    const tsNodes: ts.Statement[] = []
    const file = new FileMgr(new Set(vars?.names), vars?.importPath ?? '')
    for (const e of exprs) {
        switch (e.type) {
            case StatementEnum.REGULAR: {
                tsNodes.push(...new RegularStyleAstMaker(file, e).make())
                break
            }
            case StatementEnum.GLOBAL: {
                tsNodes.push(new GlobalStyleAstMaker(file, e).make())
                break
            }
            case StatementEnum.KEYFRAME: {
                tsNodes.push(new KeyframeAstMaker(file, e).make())
                break
            }
            case StatementEnum.COMMENT: {
                tsNodes.push(new CommentAstMaker(e).make())
                break
            }
        }
    }
    tsNodes.unshift(...file.getImports().map(i =>
        factory.createImportDeclaration(
            undefined,
            undefined,
            factory.createImportClause(
                false,
                undefined,
                factory.createNamedImports([
                    ...i.importNames.map(i => {
                        return factory.createImportSpecifier(
                            undefined,
                            factory.createIdentifier(i),
                        )
                    }),
                ]),
            ),
            factory.createStringLiteral(i.from),
        ),
    ))

    return ts.createPrinter().printFile(
        factory.createSourceFile(tsNodes, factory.createToken(SyntaxKind.EndOfFileToken), 0),
    )
}
