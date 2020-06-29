import { Lexer } from './lexer/lexer';
import { Parser } from './parser/parser';
import { ProgramNode } from '../data/ast/program';
import { IL } from '../data/il/il';
import { SymbolTable } from '../data/symbol/symbol';
import { CompilerDiagnosis } from '../diagnosis/diagnosis';
import { Checker } from './checker/checker';
import { Generator } from './generator/generator';

export class Compiler {
    async compile(uri: string, code: string): Promise<IL> {
        const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
        const parser: Parser = new Parser(lexer);
        const ast: ProgramNode = await parser.parse();
        const checker: Checker = new Checker();
        const symbols: SymbolTable = await checker.check(ast);
        const generator: Generator = new Generator();
        return await generator.generate(symbols);
    }
}
