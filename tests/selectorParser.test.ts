import {parseSelector} from '../src/parser/selector'

describe('selector parser', () => {
    it('parses', function () {
        expect(parseSelector('.bubble:not(.compact):not(.forceArrow:not(.one)) .arrow')).toEqual({
            targetClass: 'arrow',
            parts: [{var: 'bubble'}, ':not', '(', {var: 'compact'}, ')', ':not', '(', {var: 'forceArrow'}, ':not', '(', {var: 'one'}, ')', ')', ' ', '&']
        })
    })

    it('parse global selector', function () {
        expect(parseSelector('.bubble #a')).toEqual({
            targetClass: null,
            parts: [{var: 'bubble'}, ' ', '#a']
        })
    })
})
