import {style, globalStyle} from '@vanilla-extract/css'
export const root = style({
    vars: {
        '--color-0': 'purple'
    },
    color: 'var(--color-0)',
    background: 'var(--color-gradient-0)'
})
export const one = style({
    color: 'var(--color-black)',
    backgroundColor: 'var(--color-1)',
    fontWeight: 'var(--font-weight-regular)'
})
export const two = style({
    color: 'var(--color-red)',
    fontWeight: 'var(--font-weight-bold)',
    selectors: {
        [`${one} &:hover`]: {
            vars: {
                '--color-1': 'black',
            },
            color: 'var(--color-1)',
        },
    },
})
globalStyle(":root", {
    vars: {
        '--color-black': "#000",
        '--color-0': "#F44336",
        '--color-0-1': "#FF8575",
        '--color-gradient-0': "linear-gradient(0deg, var(--color-0) 0%, var(--color-0-1) 100%)",
        '--color-red': "red",
        '--color-1': "#C2185B",
        '--font-weight-regular': "400",
        '--font-weight-bold': "500",
    },
})
