import ts, {factory, SyntaxKind} from 'typescript'
import {CSSValueAstMaker, FileMgr} from '../src/writer'
import {parseValue} from '../src/parser/values'
import {Value} from '../src/model'

const printer = ts.createPrinter()

function checkStyle(value: Value, vars: Array<string> = []): string {
    const st = factory.createExpressionStatement(new CSSValueAstMaker(new FileMgr(new Set(vars), '')).make(value))
    const str = printer.printFile(
        factory.createSourceFile([st], factory.createToken(SyntaxKind.EndOfFileToken), 0),
    )
    return str.slice(0, str.length - 2)
}

describe('value writer', () => {
    it('numeric', function () {
        const value = checkStyle(['3'])
        expect(value).toEqual('3')
    })
    it('string', function () {
        const value = checkStyle(['0', ' ', '0', ' ', 'auto'])
        expect(value).toEqual('"0 0 auto"')
    })
    it('empty var', function () {
        const value = checkStyle([{var: '--color-red', fallback: []}])
        expect(value).toEqual('"var(--color-red)"')
    })
    it('expression', function () {
        const value = checkStyle(['linear-gradient', '(',
            '0deg', ', ', {var: '--color-0', fallback: []}, ' ', '0%', ', ',
            {var: '--color-0-1', fallback: []}, ' ', '100%', ')'
        ])
        expect(value).toEqual('"linear-gradient(0deg, var(--color-0) 0%, var(--color-0-1) 100%)"')
    })
    it('single external var', function () {
        const value = checkStyle([{var: '--color-1', fallback: []}], ['color1'])
        expect(value).toEqual('vars.color1')
    })
    it('single external var with fallback', function () {
        const value = checkStyle([{var: '--color-1', fallback: ['orange']}], ['color1'])
        expect(value).toEqual('fallbackVar(vars.color1, "orange")')
    })
    it('expression template', function () {
        const value = checkStyle(parseValue('linear-gradient(0deg, var(--color-0) 0%, var(--color-0-1, red) 100%)'),
            ['color0'])
        expect(value).toEqual('`linear-gradient(0deg, ${vars.color0} 0%, var(--color-0-1, red) 100%)`')
    })
    it('expression template', function () {
        const value = checkStyle(parseValue('var(--color-0, red, var(--color-1, green, purple))'),
            ['color0', 'color1'])
        expect(value).toEqual('fallbackVar(vars.color0, "red", fallbackVar(vars.color1, "green", "purple"))')
    })
})
