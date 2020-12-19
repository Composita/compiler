import { Visitor, BasicTypeNode, AnyTypeNode } from '../ast/ast';
import { SymbolTable, GenericComponentSymbol, GenericSymbol, ScopeSymbolType, SearchOptions } from '../symbols/symbols';
import { SymbolConstruction } from './symbol-construction';

export class FixTypeNodeVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    visitBasicType(node: BasicTypeNode): void {
        const types = this.symbolTable.findType(node.getIdentifier(), new SearchOptions(this.scope, true, true));
        if (types.length < 1) {
            throw new Error(`Failed to find type for basic type: ${node.getIdentifier()}, no type found.`);
        }
        if (types.length > 1) {
            throw new Error(`Failed to find type for basic type: ${node.getIdentifier()}, multiple definitions found.`);
        }
        this.symbolTable.typeToSymbol.set(node, types[0]);
    }

    visitAnyType(node: AnyTypeNode): void {
        const symbol = new GenericComponentSymbol(
            this.scope,
            new GenericSymbol(
                node
                    .getOffered()
                    .map((offered) =>
                        SymbolConstruction.createInterfaceDeclarationSymbol(this.symbolTable, offered, this.scope),
                    ),
                node
                    .getRequired()
                    .map((required) =>
                        SymbolConstruction.createInterfaceDeclarationSymbol(this.symbolTable, required, this.scope),
                    ),
            ),
        );
        this.symbolTable.typeToSymbol.set(node, symbol);
    }
}
