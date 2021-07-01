import { globalFontFace, style } from '@vanilla-extract/css';
globalFontFace('Open Sans', {
    src: 'url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2")'
});
export const text = style({
    fontFamily: 'Open Sans'
});
