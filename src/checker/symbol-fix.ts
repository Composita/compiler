import { ProgramNode } from '../ast/ast';
import { SymbolTable, ProgramScopeSymbol } from '../symbols/symbols';
import { VariableListRegisterVisitor } from './register-variable-list';
import { FixStatementNodeVisitor } from './fix-statement-node';

export class SymbolFix {
    private constructor(private symbolTable: SymbolTable, private programScope: ProgramScopeSymbol) {}

    static run(symbolTable: SymbolTable, program: ProgramNode, scope: ProgramScopeSymbol): void {
        const construction = new SymbolFix(symbolTable, scope);
        construction.fix(program);
    }

    fix(node: ProgramNode): void {
        node.accept(new FixStatementNodeVisitor(this.symbolTable, this.programScope));
        node.accept(new VariableListRegisterVisitor(this.symbolTable, this.programScope));
    }
}
