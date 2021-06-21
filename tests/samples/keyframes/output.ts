import { keyframes, style } from "@vanilla-extract/css";
/**
 * TODO: animation ref is not implemented yet, please fix it yourself! */
const shake = keyframes({ "10%, 90%": { transform: "translate3d(-2px, 0, 0)" }, "20%, 80%": { transform: "translate3d(2px, 0, 0)" }, "30%, 50%, 70%": { transform: "translate3d(-4px, 0, 0)" }, "40%, 60%": { transform: "translate3d(4px, 0, 0)" } });
const caret = keyframes({ "50%": { borderColor: "transparent" } });
export const shake = style({
    animationName: "shake",
    animationDuration: "0.5s",
    transformOrigin: "50% 50%",
    animationTimingFunction: "linear"
});
export const cursor = style({
    selectors: { ["&:before"]: { content: "''", position: "absolute", borderRight: "solid 1px black", right: "40%", bottom: "10px", height: "21px", animation: "caret 1.2s steps(1) infinite" } }
});
