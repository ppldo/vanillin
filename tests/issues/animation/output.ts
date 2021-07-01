import {keyframes, style} from '@vanilla-extract/css'
const moveTo = keyframes({
    '0%': {
        left: 0,
    },
    '75%': {
        left: '20px',
    },
    '100%': {
        left: '75px',
    },
})
export const circle = style({
    background: 'red',
    height: '40px',
    width: '40px',
    borderRadius: '100%',
    position: 'absolute',
    animationName: moveTo,
    animationDuration: '0.5s',
    animationTimingFunction: 'linear',
})
const caret = keyframes({
    '50%': {
        borderColor: 'transparent',
    },
})
export const cursor = style({
    selectors: {
        ['&:before']: {
            animation: `${caret} 1.2s steps(1) infinite`,
        },
    },
})
export const one = style({
    animation: 'oneMoveTo 1.2s steps(1) infinite',
})
