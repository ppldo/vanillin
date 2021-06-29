import {style} from '@vanilla-extract/css'
const doStyle = style({})
export {doStyle as do}
const forStyle = style({
    background: 'red',
    selectors: {
        [`${doStyle}&`]: {
            backgroundColor: 'purple',
        }
    }
})
export {forStyle as for}
export const SomePascal = style({
    color: 'red',
})
//TODO: name was camelCased
export const someKebab = style({
    color: 'green',
})
const styleStyle = style({
    color: 'blue'
})
export {styleStyle as style}
