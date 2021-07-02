import {style} from '@vanilla-extract/css'

export const one = style({
    background: 'red',
})
export const two = style({
    background: 'red',
})
export const three = style({
    selectors: {
        [`${two}&`]: {
            backgroundColor: 'purple',
        },
    },
})
export const four = style({})
export const five = style({
    selectors: {
        [`${four} &`]: {
            padding: '16px',
        },
    },
})
