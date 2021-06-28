import { createGlobalTheme } from '@vanilla-extract/css'
const colorBlack = '#000'
const color0 = '#F44336'
const color01 = '#FF8575'
const colorGradient0 = `linear-gradient(0deg, ${color0} 0%, ${color01} 100%)`
const colorRed = 'red'
const color1 = '#C2185B'
const color11 = '#E33594'
const colorGradient1 = `linear-gradient(0deg, ${color1} 0%, ${color11} 100%)`

export const vars = createGlobalTheme(':root', {
    colorBlack,
    color0,
    color01,
    colorGradient0,
    colorRed,
    color1,
    color11,
    colorGradient1
})
