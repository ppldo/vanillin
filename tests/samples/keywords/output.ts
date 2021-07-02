import {style} from '@vanilla-extract/css'

const doStyle = style({})
//TODO: JS keyword used as export name, transpiler can throw an error
export {doStyle as do}
const forStyle = style({
    background: 'red',
    selectors: {
        [`${doStyle}&`]: {
            backgroundColor: 'purple',
        }
    }
})
//TODO: JS keyword used as export name, transpiler can throw an error
export {forStyle as for}
export const SomePascal = style({
    color: 'red',
})
//TODO: name was camelCased from some-kebab
export const someKebab = style({
    color: 'green',
})
const styleStyle = style({
    color: 'blue'
})
export {styleStyle as style}
