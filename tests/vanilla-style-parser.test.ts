import {parseVanillaStyles, parseSelector, Rules, VanillaStyles} from '../src'

const testGlobalRules: Rules = new Map([
  [parseSelector('a'), {background: 'red'}],
  [parseSelector('body a'), {backgroundColor: 'purple'}],
  [parseSelector('body article p'), {color: 'green'}],
  [parseSelector('p:hover'), {color: 'purple'}],
  [parseSelector('article > p'), {padding: '16px'}],
  [parseSelector('article >p:hover'), {backgroundColor: 'blue'}],
  [parseSelector('p + img'), {margin: '10px'}],
  [parseSelector('p ~ img'), {margin: '12px 6px'}],
  [parseSelector('p + img > a'), {color: 'red'}],
])

const vanillaGlobalStyles: VanillaStyles = [
  {selector: 'a', style: {background: 'red'}},
  {selector: 'body a', style: {background: 'purple'}},
  {selector: 'body article p', style: {color: 'green'}},
  {selector: 'p:hover', style: {color: 'purple'}},
  {selector: 'article > p', style: {padding: '16px'}},
  {selector: 'article >p:hover', style: {padding: '16px'}},
  {selector: 'p + img', style: {margin: '10px'}},
  {selector: 'p ~ img', style: {margin: '12px 6px'}},
  {selector: 'p + img > a', style: {color: 'red'}},
]

const testLocalRules: Rules = new Map([
  [parseSelector('.one'), {background: 'red'}],
  [parseSelector('.two.three'), {backgroundColor: 'purple'}],
  [parseSelector('.four .five'), {padding: '16px'}],
])

const vanillaLocalStyles: VanillaStyles = [
  {name: 'one', style: {background: 'red'}},
  {name: 'two', style: {}, selectors: {'&.three': {backgroundColor: 'purple'}}},
  {name: 'four', style: {}, selectors: {'.five &': {padding: '16px'}}},
]

describe('test vanilla extract parser', () => {
  it('global', () => {
    expect(parseVanillaStyles(testGlobalRules)).toEqual(vanillaGlobalStyles)
  })
  it ('local', () => {
    expect(parseVanillaStyles(testLocalRules)).toEqual(vanillaLocalStyles)
  })
})
