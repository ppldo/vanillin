import {parseSelector} from '../src/parser/selector'

describe('selector parser', () => {
    it('parses', function () {
        expect(parseSelector('.bubble:not(.compact):not(.forceArrow:not(.one)) .arrow')).toEqual({
            targetClass: 'arrow',
            parts: [{var: 'bubble'}, ':not', '(', {var: 'compact'}, ')', ':not', '(', {var: 'forceArrow'}, ':not', '(', {var: 'one'}, ')', ')', ' ', '&']
        })
    })

    it('parse id selector', function () {
        expect(parseSelector('.bubble #a')).toEqual({
            targetClass: null,
            parts: [{var: 'bubble'}, ' ', '#a']
        })
    })

    it('parse global selector', function () {
        expect(parseSelector('.root :global(.emoji-mart-emoji #asd .asd b)')).toEqual({
            targetClass: null,
            parts: [{var: 'root'}, ' ', '.emoji-mart-emoji', ' ', '#asd', ' ', '.asd', ' ', 'b']
        })
    })
    it('parse global switch', function () {
        expect(() => parseSelector('.localA :global .global-b')).toThrow(`selector global switch doesn't supported yet`)
    })
})
