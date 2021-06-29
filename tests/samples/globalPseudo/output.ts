import {globalStyle, style} from '@vanilla-extract/css'
export const root = style({})
globalStyle(`${root} .emoji-mart-emoji`, {
    cursor: 'text',
})
globalStyle(`${root}  .emoji-mart-emoji .global-b`, {
    cursor: 'text',
})
globalStyle(
    //TODO :local() pseudo from css modules spec not supported
    `${root}  .emoji-mart-emoji :local .global-b`,
    {
        cursor: 'text',
    },
)
