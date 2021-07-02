import ts, {factory, SyntaxKind} from 'typescript'
import camelCase from 'camelcase'
import ld from 'lodash'

import {VanillaSelectorMgr} from './vanila-selector'
import {Style, Value} from '../model'

export {VanillaSelectorMgr}

export interface ISelectorConf {
    vanillaSelector: VanillaSelectorMgr
    style: Style
}

export enum StatementEnum {
    GLOBAL,
    REGULAR,
    KEYFRAME,
}

export interface IGlobalStyle extends ISelectorConf {
    type: StatementEnum.GLOBAL
}

export interface IRegularStyle {
    type: StatementEnum.REGULAR
    varName: string
    markerName: string | null
    isMarker: boolean
    selectorConfs: ISelectorConf[]
}

export interface IKeyFrame {
    type: StatementEnum.KEYFRAME
    varName: string
    data: Map<string, Style>
    isGlobal: boolean
}

export type IExpression = IGlobalStyle | IRegularStyle | IKeyFrame

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

function varDecl(varName: VariableNameAstMaker, expr: ts.Expression, withExport = true): [ts.VariableStatement] | [ts.VariableStatement, ts.ExportDeclaration] {
    const varStmt = factory.createVariableStatement(
        withExport && !varName.isReserved ? [factory.createModifier(ts.SyntaxKind.ExportKeyword)] : undefined,
        factory.createVariableDeclarationList(
            [factory.createVariableDeclaration(
                varName.make(),
                undefined,
                undefined,
                expr,
            )],
            ts.NodeFlags.Const,
        ),
    )

    if (varName.dashed) ts.addSyntheticLeadingComment(
        varStmt,
        SyntaxKind.SingleLineCommentTrivia,
        'TODO: name was camelCased from ' + varName.dashed,
    )

    return (!withExport || !varName.isReserved) ? [varStmt] : [
        varStmt,
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

export class CSSValueAstMaker {
    constructor(
        private file: FileMgr,
        private canBeNumber: boolean = true,
    ) {
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
                prop,
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
                    'vars',
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
        'globalKeyframes',
        'keyframes',
        'fallbackVar',
        'vars',
        'composeStyles',
    ]

    readonly isReserved: boolean
    readonly escapedName: string
    readonly rawName: string
    readonly dashed: string | null

    constructor(rawName: string, escapeSuffix = 'Style') {
        if (rawName.includes('-')) {
            this.dashed = rawName
            rawName = camelCase(rawName)
        } else
            this.dashed = null

        this.rawName = rawName
        this.isReserved = VariableNameAstMaker.keywordsList.includes(rawName)
        if (this.isReserved)
            this.escapedName = rawName + escapeSuffix
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
    // export const className = style({
    //     display: 'flex'
    //     selectors: {
    //         [`${parentClass}:focus &`]: {
    //            background: '#fafafa'
    //         }
    //     }
    // })
    public make() {
        const varName = new VariableNameAstMaker(this.regularStyle.varName)

        const exported = !this.regularStyle.isMarker

        if (exported)
            this.file.export(varName.escapedName)

        let styleCall = factory.createCallExpression(
            factory.createIdentifier(this.file.importStyle()),
            undefined,
            [this.createStyleRuleAst()],
        )

        if (this.regularStyle.markerName) {
            styleCall = factory.createCallExpression(
                factory.createIdentifier(this.file.importCompose()),
                undefined,
                [new VariableNameAstMaker(this.regularStyle.markerName).make(), styleCall]
            )
        }

        return varDecl(
            varName,
            styleCall,
            exported,
        )
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
        const props = this.regularStyle.selectorConfs
            .filter(s => s.vanillaSelector.isSelfOnly())
            .flatMap(s => new CSSPropsAstMaker(this.file, s.style).makePropsAst())

        const selectors = this.regularStyle.selectorConfs
            .filter(s => !s.vanillaSelector.isSelfOnly())
            .map(s => factory.createPropertyAssignment(
                factory.createComputedPropertyName(s.vanillaSelector.make()),
                new CSSPropsAstMaker(this.file, s.style).makeObjectAst(),
            ))

        if (selectors.length) props.push(
            factory.createPropertyAssignment(
                'selectors',
                makeObject(selectors),
            )
        )

        return makeObject(props)
    }
}

export class KeyframeAstMaker {
    constructor(
        private file: FileMgr,
        private keyFrame: IKeyFrame,
    ) {
    }

    public make() {
        if (!this.keyFrame.isGlobal)
            return this.makeLocal()
        else {
            return [this.makeGlobal()]
        }
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

    private makeLocal() {
        const name = new VariableNameAstMaker(this.keyFrame.varName, 'Keyframes')

        const withExport = !this.file.hasExport(name.escapedName)

        if (withExport)
            this.file.export(name.escapedName)

        return varDecl(
            name,
            factory.createCallExpression(
                factory.createIdentifier(this.file.importKeyframes()),
                undefined,
                [this.makeKeyFrameConfigAst()],
            ),
            withExport,
        )
    }

    private makeGlobal() {
        return factory.createExpressionStatement(
            factory.createCallExpression(
                factory.createIdentifier(this.file.importGlobalKeyframes()),
                undefined,
                [factory.createStringLiteral(this.keyFrame.varName), this.makeKeyFrameConfigAst()],
            )
        )
    }
}

export class FileMgr {
    private vanilla = new Set<string>()
    private hasVars = false
    private exports = new Set<string>()

    constructor(
        private readonly externalVars: Set<string>,
        private readonly varsImportPath: string,
    ) {
    }

    getImports(): Array<{ importNames: string[], from: string }> {
        const result = []
        if (this.vanilla.size)
            result.push({importNames: ld.orderBy([...this.vanilla]), from: '@vanilla-extract/css'})
        if (this.hasVars)
            result.push({importNames: ['vars'], from: this.varsImportPath})
        return result
    }

    importKeyframes(): string {
        return this.import('keyframes')
    }

    importGlobalKeyframes(): string {
        return this.import('globalKeyframes')
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

    importCompose(): string {
        return this.import('composeStyles')
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

    export(name: string) {
        if (this.exports.has(name))
            throw new Error('Already has export ' + name)
        this.exports.add(name)
    }

    hasExport(name: string) {
        return this.exports.has(name)
    }

    private import(str: string) {
        this.vanilla.add(str)
        return str
    }
}

function assertUnreachable(_: never) {
}

export function expressionsToTSString(exprs: Array<IExpression>, vars?: { names: Iterable<string>, importPath: string }): string {
    const tsNodes: ts.Statement[] = []
    const file = new FileMgr(new Set(vars?.names), vars?.importPath ?? '')
    for (const e of [...exprs].reverse()) {
        switch (e.type) {
            case StatementEnum.REGULAR: {
                tsNodes.push(...new RegularStyleAstMaker(file, e).make().reverse())
                break
            }
            case StatementEnum.GLOBAL: {
                tsNodes.push(new GlobalStyleAstMaker(file, e).make())
                break
            }
            case StatementEnum.KEYFRAME: {
                tsNodes.push(...new KeyframeAstMaker(file, e).make().reverse())
                break
            }
            default:
                assertUnreachable(e)
        }
    }
    tsNodes.push(...file.getImports().reverse().map(i =>
        factory.createImportDeclaration(
            undefined,
            undefined,
            factory.createImportClause(
                false,
                undefined,
                factory.createNamedImports(
                    i.importNames.map(i =>
                        factory.createImportSpecifier(
                            undefined,
                            factory.createIdentifier(i),
                        ),
                    ),
                ),
            ),
            factory.createStringLiteral(i.from),
        ),
    ))

    return ts.createPrinter().printFile(
        factory.createSourceFile(tsNodes.reverse(), factory.createToken(SyntaxKind.EndOfFileToken), 0),
    )
}
