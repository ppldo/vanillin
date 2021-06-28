import ts, {ModuleResolutionKind} from 'typescript'

const host = ts.createCompilerHost({})

export function getVarsNames(modulePath: string): string[] {
    const program = ts.createProgram([modulePath], {moduleResolution: ModuleResolutionKind.NodeJs}, host)
    const checker = program.getTypeChecker()
    const f = program.getSourceFile(modulePath)!
    // @ts-ignore
    const t = checker.getExportsOfModule(f.symbol).find(e => e.escapedName === 'vars')!

    return checker.getTypeAtLocation(t.valueDeclaration).getProperties().map(p => p.getEscapedName() as string)
}
