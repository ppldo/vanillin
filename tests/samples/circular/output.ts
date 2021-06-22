import {style} from '@vanilla-extract/css'
export const empty1 = style({})
export const empty2 = style({})
export const one = style({
    selectors: {
        [`${empty1}&`]: {
            background: 'red',
        },
    },
})
export const two = style({
    selectors: {
        [`${empty2} ${one} &`]: {
            background: 'blue',
        },
    },
})
export const four = style({
    flex: '0 0 auto',
    color: 'purple',
})
export const five = style({
    selectors: {
        ['&:hover']: {
            color: 'pink',
        },
    },
})
export const three = style({
    selectors: {
        [`${five}>${four} &`]: {
            color: 'green',
        },
    },
})
//TODO: this variable has circular dependencies, please fix it yourself!
export const crclA = style({
    selectors: {
        [`${crclB} &`]: {
            minWidth: '200px',
            width: '200px',
        },
    },
})
//TODO: this variable has circular dependencies, please fix it yourself!
export const crclB = style({
    selectors: {
        [`${crclC}>&`]: {
            height: '100px',
            content: '\'\'',
            background: 'grey',
        },
    },
})
//TODO: this variable has circular dependencies, please fix it yourself!
export const crclC = style({
    selectors: {
        [`${crclA}+&`]: {
            overflow: 'hidden',
            position: 'absolute',
            left: '-12px',
        },
    },
})
