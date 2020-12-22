import { getFirstOrThrow } from '@composita/ts-utility-types';
import { Visitor, VariableListNode, VariableNode } from '../ast/ast';
import {
    SymbolTable,
    ScopeSymbolType,
    VariableSymbol,
    CollectionVariableSymbol,
    BuiltInTypeSymbol,
    TypeSymbol,
} from '../symbols/symbols';
import { FixTypeNodeVisitor } from './fix-type-node';
import { CheckerHelper } from './static-helpers';

export class VariableListRegisterVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    visitVariable(node: VariableNode): void {
        node.getType().accept(new FixTypeNodeVisitor(this.symbolTable, this.scope));
        const type = this.symbolTable.typeToSymbol.get(node.getType());
        if (type === undefined) {
            throw new Error(`${node.getNames()[0].getName()}: Unknown type.`);
        }
        // ignored for now as usage is unclear
        //const isMarkedArray = node.getAttributes().find((attr) => attr.getName().getName() === 'ARRAY');
        node.getNames().forEach((name) => {
            const identifier = name.getName();
            const hasParams = name.getParams().length > 0;
            if (type instanceof BuiltInTypeSymbol && type.identifier === 'TEXT' && !hasParams) {
                const variable = new CollectionVariableSymbol(
                    this.scope,
                    identifier,
                    type,
                    new Array<TypeSymbol>(getFirstOrThrow(this.symbolTable.findBuiltIn('INTEGER'))),
                );
                this.symbolTable.registerCollectionVariable(variable);
                this.symbolTable.variableToSymbol.set(node, variable);
                return;
            }
            if (!hasParams) {
                const variable = new VariableSymbol(this.scope, identifier, true, type);
                this.symbolTable.registerVariable(variable);
                this.symbolTable.variableToSymbol.set(node, variable);
                return;
            }
            const variable = new CollectionVariableSymbol(
                this.scope,
                identifier,
                type,
                CheckerHelper.convertParamTypes(this.symbolTable, this.scope, name.getParams()),
            );
            this.symbolTable.registerCollectionVariable(variable);
            this.symbolTable.variableToSymbol.set(node, variable);
        });
    }

    visitVariableList(node: VariableListNode): void {
        node.getVariables().forEach((variable) => variable.accept(this));
    }
}
