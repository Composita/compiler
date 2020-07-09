import { Lexer } from '@composita/lexer';
import { Parser } from '@composita/parser';
import { ProgramNode } from '@composita/ast';
import { IL } from '@composita/il';
import { SymbolTable } from '@composita/symbols';
import { CompilerDiagnosis, Diagnosis } from '@composita/diagnosis';
import { Checker } from '@composita/checker';
import { Generator } from '@composita/generator';

export class Compiler {
    async compile(uri: string, code: string): Promise<IL> {
        const diagnosis: Diagnosis = new CompilerDiagnosis();
        const lexer: Lexer = new Lexer(diagnosis, uri, code);
        const parser: Parser = new Parser(diagnosis, lexer);
        const ast: ProgramNode = await parser.parse();
        if (diagnosis.hasErrors()) {
            diagnosis.print(console.log);
            throw new Error('Error during Lexing and/or Parsing. See console.log.');
        }
        const checker: Checker = new Checker();
        const symbols: SymbolTable = await checker.check(ast);
        const generator: Generator = new Generator();
        return generator.generate(symbols);
    }
}
