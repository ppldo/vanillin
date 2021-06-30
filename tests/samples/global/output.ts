import {globalKeyframes, globalStyle, style} from '@vanilla-extract/css'
globalKeyframes('kf', {
    from: {
        left: 0,
    },
})
export const d = style({})
export const c = style({
    flex: 1,
})
globalStyle('a', {
    color: 'red',
    backgroundColor: 'grey',
})
globalStyle('body a', {
    backgroundColor: 'white',
})
globalStyle('body article p', {
    color: 'green',
})
globalStyle('p:hover', {
    color: 'purple',
})
globalStyle('article > p', {
    padding: '16px',
})
globalStyle('article > p:hover', {
    backgroundColor: 'blue',
})
globalStyle('p + img', {
    margin: '10px',
})
globalStyle('p ~ img', {
    margin: '12px 6px',
})
globalStyle('p + img > a', {
    color: 'red',
})
globalStyle(`p + ${c} > a`, {
    color: 'red',
})
globalStyle(`${d} p`, {
    color: 'green',
})
globalStyle(`${d} a`, {
    color: 'green',
})
