import { Lexer } from './lexer/lexer';
import { Parser } from './parser/parser';
import { ProgramNode } from './ast/ast';
import { IL } from '@composita/il';
import { SymbolTable } from './symbols/symbols';
import { CompilerDiagnosis, Diagnosis } from './diagnosis/diagnosis';
import { Checker } from './checker/checker';
import { Generator } from './generator/generator';

export class Compiler {
    async compile(uri: string, code: string): Promise<IL> {
        const diagnosis: Diagnosis = new CompilerDiagnosis();
        const lexer: Lexer = new Lexer(diagnosis, uri, code);
        const parser: Parser = new Parser(diagnosis, lexer);
        const ast: ProgramNode = parser.parse();
        if (diagnosis.hasErrors()) {
            diagnosis.print(console.log);
            throw new Error('Error during Lexing and/or Parsing. See console.log.');
        }
        const checker: Checker = new Checker();
        const symbols: SymbolTable = checker.check(uri, ast);
        const generator: Generator = new Generator();
        return generator.generate(symbols);
    }
}
