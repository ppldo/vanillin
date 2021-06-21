# Vanillin. Vanilla Extract Migrate Tool

Converting tool for migrate css modules code base to vanilla-extract.

Vanillin can convert css rules with: tag, class, keyframe, combinator, pseudo class, simple selector, nested selector.
Please fix it yourself: animation ref, circular dependencies between classes. (vanillin will add a TODO comment).

**input:**
```css
.wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 14px;
  white-space: pre-wrap;
  overflow-wrap: break-word
}

.wrap.active {
  cursor: pointer;
}

.wrap a {
  color: #4A90E2
}

.wrap a:hover {
  color: #007AFF;
}
```

**output:**
```ts
import { style, globalStyle } from "@vanilla-extract/css";
export const wrap = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  paddingTop: "14px",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word"
});
export const active = style({
  selectors: { [`${wrap}&`]: { cursor: "pointer" } }
});
globalStyle(`${wrap} a`, { color: "#4A90E2" });
globalStyle(`${wrap} a:hover`, { color: "#007AFF" });
```

## Usage

**Step 1.** Install:

```sh
yarn add vanillin

npm install vanillin
```

**Step 2.** You can use vanillin two ways:
1. If you use PostCSS, you can do it with postcss-cli. Pass css content to stdin of vanillin, result will be printed stdout.

```sh
postcss styles.module.css > styles.css
cat styles.css | vanillin
```

2. Call vanillin with two arguments: name of your directory with css files and of your output directory.

Vanillin does recursive search css files in directory and writes it to output directory with the same structure.
For example styles.css from ./work/build/some-component/styles.css will be generated in ./work/src/some-component/styles.css.ts

```sh
postcss "src/**/*.css" --base src --dir build
vanillin ~/work/build ~/work/src
```

## Example

**input:**
```css
.slidein {
  animation-duration: 3s;
  animation-name: slidein;
  animation-iteration-count: 3;
  animation-direction: alternate;
}

.slidein a {
  color: red;
}

.one .slidein {
  background: purple;
}

.slidein.two:hover {
  background: green;
  display: flex;
  flex: 0 0 auto;
}

@keyframes slidein {
  from {
    margin-left: 100%;
    width: 300%
  }

  to {
    margin-left: 0%;
    width: 100%;
  }
}

.three .four {
  color: grey;
}

.four.three:hover {
  color: red;
}

.logo > * {
  margin: 0;
  display: inline-block;
}
```
**output:**
```ts
import { keyframes, style, globalStyle } from "@vanilla-extract/css";
/**
 * TODO: animation ref is not implemented yet, please fix it yourself! */
const slidein = keyframes({ "from": { marginLeft: "100%", width: "300%" }, "to": { marginLeft: "0%", width: "100%" } });
export const one = style({});
export const slidein = style({
  animationDuration: "3s",
  animationName: "slidein",
  animationIterationCount: 3,
  animationDirection: "alternate",
  selectors: { [`${one} &`]: { background: "purple" } }
});
export const two = style({
  selectors: { [`${slidein}&:hover`]: { background: "green", display: "flex", flex: "0 0 auto" } }
});
/**
 * TODO: this variable has circular dependencies, please fix it yourself! */
export const four = style({
  selectors: { [`${three} &`]: { color: "grey" } }
});
/**
 * TODO: this variable has circular dependencies, please fix it yourself! */
export const three = style({
  selectors: { [`${four}&:hover`]: { color: "red" } }
});
globalStyle(`${slidein} a`, { color: "red" });
globalStyle(`${logo}>*`, { margin: 0, display: "inline-block" });
```
