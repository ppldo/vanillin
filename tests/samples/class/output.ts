import {composeStyles, style} from '@vanilla-extract/css'

const twoMarker = style({})
export const one = style({
    background: 'red !important',
    selectors: {
        [`${twoMarker}&`]: {
            flex: 1,
        },
        ['&:hover']: {
            backgroundColor: 'red',
        },
    },
})
export const two = composeStyles(
    twoMarker,
    style({
        selectors: {
            [`${one}&`]: {
                backgroundColor: 'purple',
            },
            [`${one} &`]: {
                padding: '16px',
            },
            [`${one} &`]: {
                color: 'red',
            },
            [`${one} > &`]: {
                backgroundColor: 'green !important',
                flex: '1 !important',
            },
            [`${one} > &:hover`]: {
                backgroundColor: 'yellow',
            },
            [`${one} + &`]: {
                padding: '16px 8px',
            },
            [`${one} ~ &`]: {
                padding: '8px',
            },
        },
    })
)
export const three = style({
    selectors: {
        [`${one} ${twoMarker} &`]: {
            margin: '10px',
        },
        [`${one} + ${twoMarker} > &`]: {
            margin: '10px',
        },
    },
})
//TODO: name was camelCased from gallery-item
export const galleryItem = style({
    selectors: {
        ['&::before']: {
            content: '\'\'',
            backgroundColor: 'grey',
        },
        ['&:after']: {
            content: '\'\'',
            backgroundColor: 'darkgray',
        },
    },
})
