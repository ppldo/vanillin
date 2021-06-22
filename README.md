# vanillin - migrate to vanilla-extract in hour (eventually)

CLI-tool for transpiling css modules to vanilla-extract.

Vanillin can convert css rules with: tag, class, keyframe, combinator, pseudo class, simple selector, nested selector.

When it doesn't possible to transpile automatically, vanillin will add a TODO comment.

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
import {style, globalStyle} from "@vanilla-extract/css";

export const wrap = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  paddingTop: "14px",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word"
});
export const active = style({
  selectors: {[`${wrap}&`]: {cursor: "pointer"}}
});
globalStyle(`${wrap} a`, {color: "#4A90E2"});
globalStyle(`${wrap} a:hover`, {color: "#007AFF"});
```

## Install:

```sh
yarn add -D @ppldo/vanillin

npm install -D @ppldo/vanillin
```

## Usage

Internally vanillin uses PostCSS parser, which expects spec-compliant CSS.
If you use preprocessor, you need to preprocess your file before use vanillin.

Next examples assume your project uses PostCSS. For another preprocessor consults with their CLI documentation.

Note: don't forget to install postcss-cli with proper version

```sh
yarn add -D postcss-cli@YOUR_POSTCSS_VERSION

npm install -D postcss-cli@YOUR_POSTCSS_VERSION
```

Try to convert one file. Pass css content to stdin of vanillin, result will be printed stdout which you can redirect to
new file.

```sh
postcss styles.module.css | vanillin > styles.css.ts
```

Change style imports:
```ts
// before
import styles from './styles.module.css'

// after
import * as styles from './styles.css'
```

Prettify generated file with your code formatter.

Fix all TODO comments and possible compilation errors in generated file `styles.css.ts`

Make sure code semantic doesn't change. Make bug reports if so.

Now you can delete original file:
```sh
rm styles.module.css
```

Congrats! You just started migration to vanilla-extract.

Repeat it until you (and we) will be sure about codegen quality, and then go to bulk converting.

## Bug reports
Make sure you use the latest version of vanillin.

**If generated code changed semantic of original code and don't contain TODO comments about it, please let us know by sending bug report with preprocessed file (NOT ORIGINAL ONE) and generated file.**

Please, paste output of this command to bug report:
```sh
PREPR=$(postcss styles.module.css) &&
 printf "IN:\n\n$PREPR\n\nOUT:\n\n" &&
  printf "$PREPR" | vanillin
```

Also add vanillin version and desired output.

## Bulk converting
Call vanillin with two arguments: directory with preprocessed css files and your output directory.

Vanillin does recursive search css files in directory and writes it to output directory with the same structure. For
example styles.css from ./build/some-component/styles.css will be generated in ./src/some-component/styles.css.ts
(full project).

We assume your original files named `styles.module.css` and names of generated files is `styles.css.ts`

Select project part which you are going convert:
```sh
FOLDER=src
```

Generate styles.css.ts with vanillin:
```sh
postcss "$FOLDER/**/*.module.css" --base $FOLDER --dir build
vanillin build $FOLDER
rm -rf build
```

You can bulk replace style imports with IDE or use some regexp:
```sh
find $FOLDER -name '*.tsx' -type f -print0 |
 xargs -0 sed -E -i "s#import\s+(\w+)\s+from\s+.\./styles\.module\.css.#import * as \1 from './styles.css'#"
```

Fix all TODO comments and possible compilation errors in generated files.

Now you can delete original files:
```sh
find $FOLDER -name "styles.module.css" -exec rm {} \;
```

## Caveats

All kebab-case class names will be transformed to camelCase, because of js syntax.

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
//TODO: animation ref is not implemented yet, please fix it yourself!
const slidein = keyframes({
    from: {
        marginLeft: "100%",
        width: "300%",
    },
    to: {
        marginLeft: "0%",
        width: "100%",
    },
});
export const one = style({});
export const slidein = style({
    animationDuration: "3s",
    //TODO: local animation name interpolation is not implemented yet, please fix it yourself!
    animationName: "slidein",
    animationIterationCount: 3,
    animationDirection: "alternate",
    selectors: {
        [`${one} &`]: {
            background: "purple",
        },
    },
});
export const two = style({
    selectors: {
        [`${slidein}&:hover`]: {
            background: "green",
            display: "flex",
            flex: "0 0 auto",
        },
    },
});
//TODO: this variable has circular dependencies, please fix it yourself!
export const four = style({
    selectors: {
        [`${three} &`]: {
            color: "grey",
        },
    },
});
//TODO: this variable has circular dependencies, please fix it yourself!
export const three = style({
    selectors: {
        [`${four}&:hover`]: {
            color: "red",
        },
    },
});
globalStyle(`${slidein} a`, {
    color: "red",
});
globalStyle(`${logo}>*`, {
    margin: 0,
    display: "inline-block",
});
```
