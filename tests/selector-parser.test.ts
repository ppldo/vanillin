import {parseSelector, Selector, Element} from '../src'

function tag(tag: string): Element {
  return {tag, classes: [], pseudos: []}
}

function cls(...classes: string[]): Element {
  return {classes, pseudos: []}
}

const samples: Record<string, Selector> = {
  'a': tag('a'),
  'body a': [tag('body'), ' ', tag('a')],
  'body article p': [[tag('body'), ' ' , tag('article')], ' ', tag('p')],
  'p:hover': {tag: 'p', classes: [], pseudos: [':hover']},
  'article > p': [tag('article'), '>', tag('p')],
  'article > p:hover': [tag('article'), '>', {tag: 'p', classes:[], pseudos: [':hover']}],
  'p + img': [tag('p'), '+', tag('img')],
  'p ~ img': [tag('p'), '~', tag('img')],
  'p + img > a': [[tag('p'), '+', tag('img')], '>', tag('a')],

  '.one': cls('one'),
  '.one.two': cls('one', 'two'),
  '.one .two': [cls('one'), ' ', cls('two')],
  '.one .two .three': [[cls('one'), ' ', cls('two')], ' ', cls('three')],
  '.gallery-item::before': {classes: ['gallery-item'], pseudos: ['::before']},
  '.gallery-item:after': {classes: ['gallery-item'], pseudos: [':after']},
  // '.one:nth-child(3n+4)': {classes: ['one'], pseudos: [':nth-child(3n+4)']},
  '.one:hover': {classes: ['one'], pseudos: [':hover']},
  '.one > .two': [cls('one'), '>', cls('two')],
  '.one > .two:hover': [cls('one'), '>', {classes:['two'], pseudos: [':hover']}],
  '.one + .two': [cls('one'), '+', cls('two')],
  '.one ~ .two': [cls('one'), '~', cls('two')],
  '.one + .two > .three': [[cls('one'), '+', cls('two')], '>', cls('three')],
  // '.root:not(.compact) .moreIcon': [{classes: ['root'], pseudos: [':not']}, ' ', cls('moreIcon')],

  '.sidebar h2': [cls('sidebar'), ' ', tag('h2')],
  '.sidebar h2 + .one.two:hover': [[cls('sidebar'), ' ', tag('h2')], '+', {classes: ['one', 'two'], pseudos: [':hover']}],
}

describe('test selectors', () => {
  it.each(Object.entries(samples))('%s', (name, selector) => {
    expect(parseSelector(name)).toEqual(selector)
  })
})
