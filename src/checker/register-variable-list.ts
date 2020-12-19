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
        node.getNames().forEach((name) => {
            const identifier = name.getName();
            if (type instanceof BuiltInTypeSymbol && type.identifier === 'TEXT') {
                this.symbolTable.registerCollectionVariable(
                    new CollectionVariableSymbol(
                        this.scope,
                        identifier,
                        type,
                        new Array<TypeSymbol>(
                            this.symbolTable.getFirstOrThrow(this.symbolTable.findBuiltIn('INTEGER')),
                        ),
                    ),
                );
                // TODO fix variable here as well.
                return;
            }
            if (name.getParams().length === 0) {
                const variable = new VariableSymbol(this.scope, identifier, true, type);
                this.symbolTable.registerVariable(variable);
                this.symbolTable.variableToSymbol.set(node, variable);
                return;
            }
            this.symbolTable.registerCollectionVariable(
                new CollectionVariableSymbol(
                    this.scope,
                    identifier,
                    type,
                    CheckerHelper.convertParamTypes(this.symbolTable, this.scope, name.getParams()),
                ),
                // TODO fix variable here as well.
            );
        });
    }

    visitVariableList(node: VariableListNode): void {
        node.getVariables().forEach((variable) => variable.accept(this));
    }
}
