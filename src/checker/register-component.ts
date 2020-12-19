import { Visitor, ComponentNode } from '../ast/ast';
import { SymbolTable, ScopeSymbolType, ComponentSymbol, GenericSymbol, SearchOptions } from '../symbols/symbols';
import { SymbolConstruction } from './symbol-construction';
import { CheckerHelper } from './static-helpers';

// register components, single layer
export class ComponentRegisterVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    visitComponent(node: ComponentNode): void {
        const name = node.getName().getName();
        const attributes = node.getAttributes();
        const componentSymbol = new ComponentSymbol(
            this.scope,
            name,
            new GenericSymbol(
                node
                    .getOffers()
                    .map((node) =>
                        SymbolConstruction.createInterfaceDeclarationSymbol(this.symbolTable, node, this.scope),
                    ),
                node
                    .getRequires()
                    .map((node) =>
                        SymbolConstruction.createInterfaceDeclarationSymbol(this.symbolTable, node, this.scope),
                    ),
            ),
            attributes.filter((attribute) => attribute.getName().getName() === 'ENTRYPOINT').length > 0,
        );
        try {
            CheckerHelper.getComponent(this.symbolTable, name, new SearchOptions(this.scope, false, false));
            throw new Error(`Duplicate component ${name} detected,`);
        } catch (error) {
            // all good
        }
        if (componentSymbol.isEntryPoint && !this.isEntryPoint(componentSymbol)) {
            throw new Error(
                `Marked entrypoint component ${name}, requires at least one non system interfaces to be connected.`,
            );
        }
        this.symbolTable.registerComponent(componentSymbol);
        this.symbolTable.symbolToComponent.set(componentSymbol, node);
        this.symbolTable.componentToSymbol.set(node, componentSymbol);
    }

    private isEntryPoint(component: ComponentSymbol): boolean {
        const required = component.genericType.required;
        return (
            required.length === 0 ||
            required
                .map((required) => this.isSystemInterface(required.interfaceSymbol.identifier))
                .reduce((prev, current) => prev && current, true)
        );
    }

    private isSystemInterface(name: string): boolean {
        switch (name) {
            case 'SystemTime':
            case 'FileSystem':
            case 'GraphicView':
                return true;
            default:
                return false;
        }
    }
}
