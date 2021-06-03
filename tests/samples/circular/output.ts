import { style } from "@vanilla-extract/css";
/**
 * TODO: this variable has circular dependencies, please fix it yourself! */
export const two = style({
    selectors: { [`${one}&`]: { background: "red" } }
});
/**
 * TODO: this variable has circular dependencies, please fix it yourself! */
export const one = style({
    selectors: { [`${two}&`]: { background: "blue" } }
});
