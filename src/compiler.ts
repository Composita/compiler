import { Lexer } from '@composita/lexer';
import { Parser } from '@composita/parser';
import { ProgramNode } from '@composita/ast';
import { IL } from '@composita/il';
import { SymbolTable } from '@composita/symbols';
import { CompilerDiagnosis } from '@composita/diagnosis';
import { Checker } from '@composita/checker';
import { Generator } from '@composita/generator';

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
