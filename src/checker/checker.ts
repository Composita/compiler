import { SymbolTable, ProgramScopeSymbol } from '../symbols/symbols';
import { ProgramNode } from '../ast/ast';
import { SymbolConstruction } from './symbol-construction';
import { SymbolFix } from './symbol-fix';

export class Checker {
    check(uri: string, ast: ProgramNode): SymbolTable {
        const symbolTable = new SymbolTable();
        const programScope = new ProgramScopeSymbol(symbolTable.globalScope, uri);
        SymbolConstruction.run(symbolTable, ast, programScope);
        SymbolFix.run(symbolTable, ast, programScope);
        return symbolTable;
    }
}
