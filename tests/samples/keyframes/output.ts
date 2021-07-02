import {keyframes, style} from '@vanilla-extract/css'

//TODO: to avoid name conflict "Keyframes" was added
const shakeKeyframes = keyframes({
    '10%, 90%': {
        transform: 'translate3d(-2px, 0, 0)',
    },
    '20%, 80%': {
        transform: 'translate3d(2px, 0, 0)',
    },
    '30%, 50%, 70%': {
        transform: 'translate3d(-4px, 0, 0)',
    },
    '40%, 60%': {
        transform: 'translate3d(4px, 0, 0)',
    },
})
export const caret = keyframes({
    '50%': {
        borderColor: 'transparent',
    },
})
//TODO: name was camelCased from some-kebab
export const someKebab = keyframes({
    '50%': {
        borderColor: 'transparent',
    },
})
const doKeyframes = keyframes({
    '50%': {
        borderColor: 'transparent',
    },
})
//TODO: JS keyword used as export name, transpiler can throw an error
export {doKeyframes as do}
export const shake = style({
    //TODO: local animation name interpolation is not implemented yet, please fix it yourself!
    animationName: 'shake',
    animationDuration: '0.5s',
    transformOrigin: '50% 50%',
    animationTimingFunction: 'linear',
})
export const cursor = style({
    selectors: {
        ['&:before']: {
            content: '\'\'',
            position: 'absolute',
            borderRight: 'solid 1px black',
            right: '40%',
            bottom: '10px',
            height: '21px',
            //TODO: local animation name interpolation is not implemented yet, please fix it yourself!
            animation: 'caret 1.2s steps(1) infinite',
        },
    },
})
