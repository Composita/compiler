import { Visitor, ImplementationNode } from '../ast/ast';
import { SymbolTable, ComponentSymbol, ImplementationSymbol, SearchOptions } from '../symbols/symbols';
import { CheckerHelper } from './static-helpers';

// implementations, single layer
export class ImplementationRegisterVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ComponentSymbol) {
        super();
    }

    visitImplementation(node: ImplementationNode): void {
        const name = node.getName().getName();
        const interfaceSymbols = this.scope.genericType.offered
            .filter((symbol) => symbol.interfaceSymbol.identifier === name)
            .map((symbol) => symbol.interfaceSymbol);
        if (interfaceSymbols.length !== 1) {
            throw new Error(`Could not find interface for '${name}' implementation.`);
        }
        try {
            CheckerHelper.getImplementation(this.symbolTable, name, new SearchOptions(this.scope, false, false));
            throw new Error(`Duplicate '${name}' implementation detected.`);
        } catch (error) {
            // all good
        }
        const implementationSymbol = new ImplementationSymbol(this.scope, interfaceSymbols[0]);
        this.symbolTable.registerImplementation(implementationSymbol);
        this.symbolTable.symbolToImplementation.set(implementationSymbol, node);
        this.symbolTable.implementationToSymbol.set(node, implementationSymbol);
    }
}
