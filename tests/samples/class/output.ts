import { style } from '@vanilla-extract/css'

export const one = style({
  background: 'red',
  ':hover': {
    backgroundColor: 'blue',
  }
})

export const two = style({
  selectors: {
    [`${one}&`]: {
      backgroundColor: 'purple'
    },
    [`${one} &`]: {
      padding: '16px'
    },
    [`${one} >&`]: {
      background: 'green',
    },
    [`${one} >:hover&`]: {
      background: 'yellow'
    },
    [`${one} +&`]: {
      padding: '16px 8px'
    },
    [`${one} ~&`]: {
      padding: '8px'
    }
  }
})

export const three = style({
  selectors: {
    [`${one} ${two} &`]: {
      margin: '10px',
    },
    [`${one} + ${two} &`]: {
      margin: '20px',
    }
  }
})

export const galleryItem = style({
  '::before': {
    content: '""',
    backgroundColor: 'grey',
  },
  ':after': {
    content: '""',
    backgroundColor: 'darkgray',
  },
})

