# vanillin - migrate to vanilla-extract in hour (eventually)

CLI-tool for transpiling css modules to vanilla-extract.

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
    color: var(--color-0);
}

.wrap a:hover {
    color: var(--color-1, pink);
}
```

**output:**

```ts
import {style, globalStyle} from "@vanilla-extract/css";
import {vars} from "../vars";

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
globalStyle(`${wrap} a`, {color: vars.color0});
globalStyle(`${wrap} a:hover`, {color: fallbackVar(vars.color1, "pink")});
```

## Install:

```sh
yarn add -D @ppldo/vanillin

npm install -D @ppldo/vanillin
```

## Usage

Internally vanillin uses PostCSS parser, which expects spec-compliant CSS. If you use preprocessor, you need to
preprocess your file before use vanillin.

Next examples assume your project uses PostCSS. For another preprocessor consults with their CLI documentation.

**Note:** don't forget to install postcss-cli with proper version

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

**If generated code changed semantic of original code and don't contain TODO comments about it, please let us know by
sending bug report with preprocessed file (NOT ORIGINAL ONE) and generated file.**

Please, paste output of this command to bug report:

```sh
PREPR=$(postcss styles.module.css) &&
 printf "IN:\n\n$PREPR\n\nOUT:\n\n" &&
  printf "$PREPR" | vanillin
```

Also add vanillin version and desired output.

## Variables

**Note:**
If you want to convert variables.css to vanilla-extract variables, don't forget to disable the CSS processor plugin for
translating custom properties.

Given such CSS variables:

```css
:root {
    --color-black: #000;
    --color-0: #F44336;
    --color-0-1: #FF8575;
    --color-gradient-0: linear-gradient(0deg, var(--color-0) 0%, var(--color-0-1) 100%);
    --color-red: red;
    --color-1: #C2185B;
    --color-1-1: #E33594;
    --color-gradient-1: linear-gradient(0deg, var(--color-1) 0%, var(--color-1-1) 100%);
}
```

You should create file `vars.ts` with `vars` export and all variables translated to camelCase:

`vars.ts`

```ts
import {createGlobalTheme} from '@vanilla-extract/css'

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
```

You can remember it path to shell variable:

```sh
VARS=$(realpath vars.ts)
```

Then when you run vanillin on your regular css pass this path under `vars` flag.

**ATTENTION**: You should run this command from directory, where `styles.css.ts` will be placed!

```sh
postcss styles.module.css | vanillin --vars $VARS > styles.css.ts
```

Vanillin will replace variables from theme to refs. All unknown variables will be left as is.

**input:**

```css
.root {
    --color-0: purple;
    --color-some: green;
    color: var(--color-0, red);
    background: var(--color-gradient-0);
    border: solid 1px var(--color-brand);
}
```

**output:**

```ts
import {style} from "@vanilla-extract/css";
import {vars} from '../vars.ts'

export const root = style({
    vars: {
        [vars.color0]: 'purple',
        '--color-some': 'green',
    },
    color: fallbackVar(vars.color0, "red"),
    background: vars.colorGradient0,
    border: 'solid 1px var(--color-brand)',
})
```

## Bulk converting

Call vanillin with two arguments: directory with preprocessed css files and your output directory.

Vanillin does recursive search css files in directory and writes it to output directory with the same structure. For
example styles.css from ./build/some-component/styles.css will be generated in ./src/some-component/styles.css.ts
(full project).

We assume your original files named `styles.module.css`,then names of generated files will be `styles.modules.css.ts`

Select project part which you are going convert:

```sh
FOLDER=src
```

Generate styles.css.ts with vanillin:

```sh
postcss "$FOLDER/**/styles.module.css" --base $FOLDER --dir build
vanillin --bulk build $FOLDER
rm -rf build
```

You can use vanillin --bulk with `vars` flag.

```sh
vanillin --bulk cssDir targetDir --vars vars.ts
```

You can bulk replace style imports with IDE or use some regexp:

```sh
find $FOLDER -name '*.tsx' -type f -print0 |
 xargs -0 sed -E -i "s#import\s+(\w+)\s+from\s+.\./styles\.module\.css.#import * as \1 from './styles.module.css'#"
```

Fix all TODO comments and possible compilation errors in generated files.

Now you can delete original files:

```sh
find $FOLDER -name "styles.module.css" -exec rm {} \;
```

## Caveats

All kebab-case class names will be transformed to camelCase, with TODO comment, because of js syntax

In case of circular dependencies (or forward refs) in selectors, some marker classes will be added.

:local() pseudo from css modules spec not supported.

```css
/*localB and localC will not be local*/
.localA :global global-b :local(localC) :local .localB {
}
```

For all not implemented yet features from CSS and CSS Modules look
here: https://github.com/ppldo/vanillin/issues?q=is%3Aissue+is%3Aopen+label%3Atodo
