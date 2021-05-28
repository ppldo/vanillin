import { style } from '@vanilla-extract/css'

export const one = style({
  background: 'red',
  ':hover': {
    backgroundColor: 'purple'
  }
})

export const two = style({
  selectors: {
    [`${one}&`]: {
      backgroundColor: 'green'
    }
  }
})

export const three = style({
  background: 'blue'
})

export const four = style({
  selectors: {
    [`${three} &`]: {
      background: 'purple'
    }
  },
})

