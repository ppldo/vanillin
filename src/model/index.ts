export type Style = Record<string, Value>
export type Value = Array<string | { var: string, fallback: Value }>
