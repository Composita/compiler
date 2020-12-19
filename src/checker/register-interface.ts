import { Visitor, InterfaceNode } from '../ast/ast';
import { SymbolTable, ScopeSymbolType, InterfaceSymbol, SearchOptions } from '../symbols/symbols';

export class InterfaceRegisterVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    //visitProtocol(node: ProtocolNode): void {}

    //visitProtocolExpression(node: ProtocolExpressionNode): void {}

    //visitProtocolTerm(node: ProtocolTermNode): void {}

    visitInterface(node: InterfaceNode): void {
        const name = node.getName().getName();
        const interfaceSymbol = new InterfaceSymbol(this.scope, name);
        try {
            this.symbolTable.getFirstOrThrow(
                this.symbolTable.findInterface(name, new SearchOptions(this.scope, false, false)),
            );
            throw new Error(`Duplicate interface ${name} detected.`);
        } catch (error) {
            // all good
        }
        // TODO
        //node.getProtocol().accept(this);
        this.symbolTable.registerInterface(interfaceSymbol);
        this.symbolTable.symbolToInterface.set(interfaceSymbol, node);
        this.symbolTable.interfaceToSymbol.set(node, interfaceSymbol);
    }
}
