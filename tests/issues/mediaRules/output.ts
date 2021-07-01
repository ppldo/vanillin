import { globalStyle, style} from '@vanilla-extract/css'
globalStyle('article', {
    '@media': {
        'screen and (min-width: 900px)': {
            padding: '10px',
        },
    },
    '@supports': {
        '(display: grid)': {
            '@media': {
                'screen and (min-width: 900px)': {
                    display: 'grid',
                },
            },
        },
    },
})
export const className = style({
    '@media': {
        'screen and (min-width: 768px)': {
            padding: '10px',
        },
    },
})
