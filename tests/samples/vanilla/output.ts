import { style } from '@vanilla-extract/css'

export const one = style({
  background: 'red',
  selectors: {
    ['&.two']: {
      backgroundColor: 'purple'
    }
  }
})

export const three = style({
  background: 'blue'
})

export const four = style({
  selectors: {
    [`${three} &`]: {
      background: 'purple',
    }
  },
})

