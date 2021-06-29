import {globalStyle, style} from '@vanilla-extract/css'
export const inactive = style({})
export const bubble = style({})
export const compact = style({})
export const forceArrow = style({})
export const special = style({})
export const one = style({
    background: 'yellow',
    selectors: {
        ['&:hover']: {
            color: 'red',
        },
    },
})
export const root = style({
    display: 'block',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
})
export const wrap = style({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    paddingTop: '14px',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    selectors: {
        [`&:not(${inactive})`]: {
            cursor: 'pointer',
        },
    },
})
export const dot = style({
    selectors: {
        [`${root} &:nth-of-type(1)`]: {
            color: 'purple',
        },
        [`${root} &:nth-of-type(2)`]: {
            color: 'blue',
        },
        [`${root} &:nth-of-type(3)`]: {
            color: 'green',
        },
    },
})
export const arrow = style({
    selectors: {
        [`${bubble}:not(${compact}):not(${forceArrow}:not(${one})) &`]: {
            right: '-60px',
        },
    },
})
globalStyle(`${root}:not(:hover) > *`, {
    display: 'none',
})
globalStyle(`${wrap} a`, {
    color: '#4A90E2',
})
globalStyle(`${wrap} a:hover`, {
    color: '#007AFF',
})
globalStyle(`p:not(:first-child):not(${special})`, {
    color: 'red',
})
