import { style } from "@vanilla-extract/css";
export const one = style({
    background: "red !important",
    selectors: {
        ["&:hover"]: {
            backgroundColor: "red",
        },
    },
});
export const two = style({
    selectors: {
        [`${one}&`]: {
            backgroundColor: "purple",
        },
        [`${one} &`]: {
            padding: "16px",
        },
        [`${one} > &`]: {
            backgroundColor: "green !important",
            flex: "1 !important"
        },
        [`${one} > &:hover`]: {
            backgroundColor: "yellow",
        },
        [`${one} + &`]: {
            padding: "16px 8px",
        },
        [`${one} ~ &`]: {
            padding: "8px",
        },
    },
});
export const three = style({
    selectors: {
        [`${one} ${two} &`]: {
            margin: "10px",
        },
        [`${one} + ${two} > &`]: {
            margin: "10px",
        },
    },
});
//TODO: name was camelCased from gallery-item
export const galleryItem = style({
    selectors: {
        ["&::before"]: {
            content: "''",
            backgroundColor: "grey",
        },
        ["&:after"]: {
            content: "''",
            backgroundColor: "darkgray",
        },
    },
});
