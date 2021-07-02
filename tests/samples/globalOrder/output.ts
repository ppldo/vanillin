import {globalStyle, style} from '@vanilla-extract/css'

export const important = style({
    fontWeight: 'bold',
})
export const menu = style({
    flex: 1,
})
globalStyle(`${menu} a:visited`, {
    color: 'green',
})
globalStyle(`${menu} a${important}`, {
    color: 'red',
})
