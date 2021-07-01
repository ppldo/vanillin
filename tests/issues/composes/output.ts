import {style, composeStyles} from '@vanilla-extract/css'

const reset = style({
    border: 'none',
    background: 'none',
})

export const root = composeStyles(reset, style({
    display: 'flex',
    background: 'green',
}))

const one = style({
    color: 'red',
})

const two = style({
    color: 'blue',
})

export const three = composeStyles(one, two, style({
    padding: '16px'
}))

//TODO composes: wrap from './tests/samples/pseudo/input.css'
export const otherWrap = composeStyles(wrap, style({
    padding: '16px 8px'
}))

export const otherBubble = composeStyles('bubble', style({}))
