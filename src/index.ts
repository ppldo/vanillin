import {Root} from 'postcss'

const camelCase = require('camelcase')

module.exports = (opts = { }) => {

  // Work with options here

  return {
    postcssPlugin: 'postcss-vanilla-extract-migrate',
    Root (root: Root) {
      const cssProps: Record<string, string | number> = {}
      root.walkRules(rule => {
        rule.walkDecls(decl => {
          cssProps[camelCase(decl.prop)] = decl.value
        })
        console.log(cssProps)
      })
    }
  }
}
module.exports.postcss = true
