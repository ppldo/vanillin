import {parseValue} from '../src/parser/values'

describe('value parser', () => {
    it('simple string value', function () {
        const value = parseValue('0 0 auto')
        expect(value).toEqual(['0', ' ', '0', ' ', 'auto'])
    })
    it('simple number value', function () {
        const value = parseValue('400')
        expect(value).toEqual(['400'])
    })
    it('empty var', function () {
        const value = parseValue('var()')
        expect(value).toEqual(['var()'])
    })
    it('simple var', function () {
        const value = parseValue('var(--color-red)')
        expect(value).toEqual([{var: '--color-red', fallback: []}])
    })
    it('var with comma', function () {
        const value = parseValue('var(--color-red,)')
        expect(value).toEqual([{var: '--color-red', fallback: []}])
    })
    it('var with fallback', function () {
        const value = parseValue('var(--color-red, red)')
        expect(value).toEqual([{var: '--color-red', fallback: ['red']}])
    })
    it('var with some fallbacks', function () {
        const value = parseValue('var(--color-red, red, purple, pink)')
        expect(value).toEqual([{var: '--color-red', fallback: ['red', 'purple', 'pink']}])
    })
    it('var with var fallbacks', function () {
        const value = parseValue('var(--color-red, var(--color-purple, var(--color-orange, yellow))')
        expect(value).toEqual([{
            var: '--color-red', fallback: [{
                var: '--color-purple', fallback: [{
                    var: '--color-orange', fallback: ['yellow']}
                ]}
            ]}
        ])
    })
    it('parses', function () {
        const value = parseValue('linear-gradient(0deg, var(--color-0) 0%, var(--color-0-1) 100%)')
        expect(value).toEqual(['linear-gradient', '(',
            '0deg', ', ', {var: '--color-0', fallback: []}, ' ', '0%', ', ',
            {var: '--color-0-1', fallback: []}, ' ', '100%', ')'
        ])
    })
})
