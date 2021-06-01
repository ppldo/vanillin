import { globalStyle } from '@vanilla-extract/css'

globalStyle('a', {
  color: 'red',
  backgroundColor: 'grey'
})

globalStyle('body a', {
  backgroundColor: 'white'
})

globalStyle('body article p', {
  color: 'green'
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
