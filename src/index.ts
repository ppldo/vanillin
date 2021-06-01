import {Root, PluginCreator, rule} from 'postcss'
import createSelectorParser, {className, string, tag} from 'postcss-selector-parser'

const camelCase = require('camelcase')

type TagName = string
type StarPattern = '*'
type ClassName = string
type PseudoClass = `:${string}`
type Combinator = ' ' | '>' | '+' | '~'

export type Element = {
  tag?: TagName
  classes: ClassName[]
  pseudos: PseudoClass[]
}

type ElementOrStar = Element | StarPattern

export type Selector = ElementOrStar | [Selector, Combinator, ElementOrStar]

type Style = Record<string, string | number>
export type Rules = Map<Selector, Style>

export function parseSelector(selector: string): Selector {
  return parser.transformSync(selector) as any
}

function emptyElement(): Element {
  return {
    classes: [],
    pseudos: []
  }
}

const parser = createSelectorParser(selectors => {
  let sel: any | null = null

  let el = emptyElement()

  selectors.each(selector => {
    for (const node of selector.nodes) {
      if (node.type === 'class') {
        el.classes.push(node.value)
      } else if (node.type === 'tag') {
        el.tag = node.value
      } else if (node.type === 'combinator') {
        if (!sel)
          sel = [el]
        else {
          sel.push(el)
          sel =[sel]
        }
        el = emptyElement()
        sel.push(node.value)
      } else if (node.type === 'pseudo') {
        el.pseudos.push(node.value as any)
      }
    }
  })
  sel?.push(el)
  return sel ?? el
})

type LocalStyle = {
  name: string
  style: Style
  selectors?: Record<string, Style>
}

type GlobalStyle = {
  selector: string
  style: Style
}

export type VanillaStyles = Array<LocalStyle | GlobalStyle>


function printSel(selector: any){
  if (Array.isArray(selector)){
    selector.map(s => console.log(s, 'Sel'))
  }
}

export function parseVanillaStyles(rules: Rules): VanillaStyles{
  let result: VanillaStyles = []
  for (let [selector, style] of rules.entries()) {
    printSel(selector)
/*    if (!Array.isArray(selector)) {
      if (selector['tag']) {
        result.push({
          selector: selector['tag'],
          style
        })
      } else if (selector['classes']) {
        result.push({
          name: selector['classes'][0],
          style,
        })
      }
    }
    else {
      console.log(selector, 'SELECTOR')
      const flat = (arr) =>
        arr.reduce((accum, currentVal) =>
          accum.concat(Array.isArray(currentVal) ? flat(currentVal) : currentVal), []
        )
      console.log(`${flat(selector)[0]['tag']}${flat(selector)[1]}${flat(selector)[2]['tag']}`)
      console.log(flat(selector))
    }*/
  }
  console.log(result, 'RESULT')
  return result
}


export const plugin: PluginCreator<any> = (opts = { }) => {
  return {
    postcssPlugin: 'postcss-vanilla-extract-migrate',
    Root (root: Root) {
      let parsedRules: Rules = new Map()
      let cssProps: Style = {}
      root.walkRules(rule => {
        rule.walkDecls(decl => {
          cssProps[camelCase(decl.prop)] = decl.value
        })
        parsedRules.set(parseSelector(rule.selector), cssProps)
        cssProps = {}
      })
      console.log(parsedRules, 'RULE')
      for (let entry of parsedRules.entries()) {
        for (let i = 0; i < entry.length; i++) {
          console.log(entry[i], 'ELEMENT')
        }
      }
    }
  }
}
plugin.postcss = true

/*const plugin: PluginCreator<any> = (opts = { }) => {
  return {
    postcssPlugin: 'postcss-vanilla-extract-migrate',
    Root (root: Root) {
      let cssProps: Style = {}
      let myRule: Rule = {}
      let result: Rules = []
      root.walkRules(rule => {
        rule.walkDecls(decl => {
          cssProps[camelCase(decl.prop)] = decl.value
        })
        makeParser((className) => {
          myRule[className] = cssProps
        }).process(rule, { lossless: false })

        result.push(myRule)
        myRule = {}
        cssProps = {}
      })
      console.log(result, 'result')
    }
  }
}*/

