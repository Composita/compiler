import { getFirstOrThrow, getOrThrow } from '@composita/ts-utility-types';
import { Visitor, ConstantListNode, ConstantNode } from '../ast/ast';
import {
    SymbolTable,
    ScopeSymbolType,
    VariableSymbol,
    BuiltInTypeSymbol,
    CollectionVariableSymbol,
    TypeSymbol,
} from '../symbols/symbols';
import { FixExpressionNodeVisitor } from './fix-expression-node';

export class ConstantListRegisterVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    visitConstant(node: ConstantNode): void {
        const name = node.getName().getName();
        node.getExpression().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
        const type = getOrThrow(this.symbolTable.expressionToSymbol.get(node.getExpression().getExpression()));
        if (type instanceof BuiltInTypeSymbol && type.identifier === 'TEXT') {
            const variable = new CollectionVariableSymbol(
                this.scope,
                name,
                type,
                new Array<TypeSymbol>(getFirstOrThrow(this.symbolTable.findBuiltIn('INTEGER'))),
            );
            this.symbolTable.registerCollectionVariable(variable);
            this.symbolTable.variableToSymbol.set(node, variable);
            return;
        }
        const variable = new VariableSymbol(this.scope, name, false, type);
        this.symbolTable.registerVariable(variable);
        this.symbolTable.variableToSymbol.set(node, variable);
    }

    visitConstantList(node: ConstantListNode): void {
        node.getConstants().forEach((constant) => constant.accept(this));
    }
}
