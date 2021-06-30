import { style  } from '@vanilla-extract/css'
import {vars} from '../vars'
export const root = style({
    vars: {
        [vars.color0]: 'purple'
    },
    color: vars.color0,
    background: vars.colorGradient0
})
export const one = style({
    color: vars.colorBlack,
    background: vars.color1
})
export const two = style({
    color: `${vars.colorRed} !important`,
    selectors: {
        [`${one} &:hover`]: {
            color: vars.color1,
        },
    },
})
