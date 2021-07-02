import {composeStyles, style} from '@vanilla-extract/css'

export const empty1 = style({})
export const one = style({
    selectors: {
        [`${empty1}&`]: {
            background: 'red',
        },
    },
})
export const empty2 = style({})
export const two = style({
    selectors: {
        [`${empty2} ${one} &`]: {
            background: 'blue',
        },
    },
})
const fiveMarker = style({})
const fourMarker = style({})
export const three = style({
    selectors: {
        [`${fiveMarker} > ${fourMarker} &`]: {
            color: 'green',
        },
    },
})
export const four = composeStyles(
    fourMarker,
    style({
        flex: '0 0 auto',
        color: 'purple',
        selectors: {
            [`${fourMarker} &`]: {
                color: 'aqua',
            },
        },
    })
)
export const five = composeStyles(
    fiveMarker,
    style({
        selectors: {
            ['&:hover']: {
                color: 'pink',
            },
            [`${fourMarker} &`]: {
                color: 'green',
            },
        },
    })
)
const crclBMarker = style({})
export const crclA = style({
    selectors: {
        [`${crclBMarker} &`]: {
            minWidth: '200px',
            width: '200px',
        },
    },
})
const crclCMarker = style({})
export const crclB = composeStyles(
    crclBMarker,
    style({
        selectors: {
            [`${crclCMarker} > &`]: {
                height: '100px',
                content: '\'\'',
                background: 'grey',
            },
        },
    })
)
export const crclC = composeStyles(
    crclCMarker,
    style({
        selectors: {
            [`${crclA} + &`]: {
                overflow: 'hidden',
                position: 'absolute',
                left: '-12px',
            },
        },
    })
)
