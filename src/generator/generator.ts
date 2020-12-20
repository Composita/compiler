import {
    IL,
    ComponentDescriptor,
    ImplementationDescriptor,
    ProcedureDescriptor,
    VariableDescriptor,
    TypeDescriptor,
    InterfaceDescriptor,
    MessageDescriptor,
    TextDescriptor,
    IntegerDescriptor,
    DeclarationDescriptor,
} from '@composita/il';
import {
    SymbolTable,
    ComponentSymbol,
    BuiltInTypeSymbol,
    TypeSymbol,
    InterfaceSymbol,
    ScopeSymbolType,
} from '../symbols/symbols';
import { ComponentGeneratorVisitor } from './code-generator';
import { Metadata } from './metadata';
import { ComponentNode } from '../ast/ast';

export class Generator {
    generate(symbols: SymbolTable): IL {
        const il = new IL();
        const metadata = this.generateMetadata(symbols);
        //metadata.findMessage(symbols.finishMessage);
        //metadata.findMessage(symbols.finishMessage);
        symbols.components.forEach((component) => this.generateComponent(component, symbols, il, metadata));
        return il;
    }

    private generateMetadata(symbols: SymbolTable): Metadata {
        const metadata = new Metadata();
        metadata.pushComponent(symbols.anyComponentType, new ComponentDescriptor(symbols.anyComponentType.identifier));
        metadata.pushInterface(
            symbols.anyRequiredInterfaceType,
            new InterfaceDescriptor(symbols.anyRequiredInterfaceType.identifier),
        );
        metadata.pushMessage(symbols.finishMessage, new MessageDescriptor(symbols.finishMessage.identifier));
        metadata.pushMessage(symbols.anyMessage, new MessageDescriptor(symbols.anyMessage.identifier));
        symbols.getSystemProcedures().forEach((procedure) => {
            const descriptor = new ProcedureDescriptor(procedure.identifier, undefined);
            descriptor.parameters.push(
                ...procedure.parameters.map((type) => {
                    return new VariableDescriptor(
                        type.identifier,
                        this.convertSymbolToDescriptor(type, metadata),
                        true,
                    );
                }),
            );
            metadata.pushProcedure(procedure, descriptor);
        });
        symbols.interfaces.forEach((symbol) =>
            metadata.pushInterface(symbol, new InterfaceDescriptor(symbol.identifier)),
        );
        symbols.components.forEach((component) =>
            metadata.pushComponent(component, new ComponentDescriptor(component.identifier)),
        );
        symbols.messages.forEach((symbol) => {
            const message = new MessageDescriptor(symbol.identifier);
            symbol.parameters.forEach((value) => {
                message.data.push(this.convertSymbolToDescriptor(value, metadata));
            });
            metadata.pushMessage(symbol, message);
        });
        symbols.interfaces.forEach((component) => this.fillInterface(component, metadata, symbols));
        symbols.impplementations.forEach((implementation) => {
            const implementationDescriptor = new ImplementationDescriptor(
                metadata.findInterface(implementation.interfaceSymbol),
            );
            metadata.pushImplementation(implementation, implementationDescriptor);
        });
        symbols.variables.forEach((variable) => {
            const typeDescriptor = this.convertSymbolToDescriptor(variable.type, metadata);
            const varDescriptor = new VariableDescriptor(variable.identifier, typeDescriptor, true);
            if (typeDescriptor instanceof TextDescriptor) {
                varDescriptor.indexTypes.push(new IntegerDescriptor());
            }
            metadata.pushVariable(variable, varDescriptor);
        });
        symbols.collectionVariables.forEach((variable) => {
            const typeDescriptor = this.convertSymbolToDescriptor(variable.type, metadata);
            const varDescriptor = new VariableDescriptor(variable.identifier, typeDescriptor, true);
            varDescriptor.indexTypes.push(
                ...variable.parameters.map((type) => this.convertSymbolToDescriptor(type, metadata)),
            );
            metadata.pushVariable(variable, varDescriptor);
        });
        symbols.procedures.forEach((procedure) => {
            const returnType = procedure.returnType;
            const returnTypeDescriptor =
                returnType === symbols.voidType ? undefined : this.convertSymbolToDescriptor(returnType, metadata);
            const procedureDescriptor = new ProcedureDescriptor(procedure.identifier, returnTypeDescriptor);
            procedureDescriptor.parameters.push(
                ...procedure.parameters.map((type) => {
                    return new VariableDescriptor(
                        type.identifier,
                        this.convertSymbolToDescriptor(type, metadata),
                        true,
                    );
                }),
            );
            metadata.pushProcedure(procedure, procedureDescriptor);
        });
        symbols.components.forEach((component) => this.fillComponent(component, metadata, symbols));
        return metadata;
    }

    private convertSymbolToDescriptor(symbol: TypeSymbol, metadata: Metadata): TypeDescriptor {
        if (symbol instanceof BuiltInTypeSymbol) {
            return metadata.builtInTypeDescriptor(symbol);
        }
        if (symbol instanceof ComponentSymbol) {
            return metadata.findComponent(symbol);
        }
        if (symbol instanceof InterfaceSymbol) {
            return metadata.findInterface(symbol);
        }
        throw new Error('Cannot convert to descriptor');
    }

    private fillInterface(interfaceSymbol: InterfaceSymbol, metadata: Metadata, symbols: SymbolTable): void {
        // TODO
        metadata.findInterface(interfaceSymbol);
        symbols;
    }

    static fillDeclarations(
        declarations: DeclarationDescriptor,
        symbol: ScopeSymbolType,
        metadata: Metadata,
        symbols: SymbolTable,
    ): void {
        symbols
            .getVariables(symbol)
            .forEach((variable) => declarations.variables.push(metadata.findVariable(variable)));
        symbols
            .getCollectionVariables(symbol)
            .forEach((variable) => declarations.variables.push(metadata.findVariable(variable)));
        symbols
            .getProcedures(symbol)
            .forEach((procedure) => declarations.procedures.push(metadata.findProcedure(procedure)));
    }

    private fillComponent(component: ComponentSymbol, metadata: Metadata, symbols: SymbolTable): void {
        const descriptor = metadata.findComponent(component);
        component.genericType.offered.forEach((interfaceDeclaration) =>
            descriptor.offers.push(metadata.findInterface(interfaceDeclaration.interfaceSymbol)),
        );
        component.genericType.required.forEach((interfaceDeclaration) =>
            descriptor.requires.push(metadata.findInterface(interfaceDeclaration.interfaceSymbol)),
        );
        symbols
            .getImplementations(component)
            .forEach((implementation) => descriptor.implementations.push(metadata.findImplementation(implementation)));
        Generator.fillDeclarations(descriptor.declarations, component, metadata, symbols);
    }

    private generateComponent(component: ComponentSymbol, symbols: SymbolTable, il: IL, metadata: Metadata): void {
        const node = symbols.symbolToComponent.get(component);
        if (node === undefined || !(node instanceof ComponentNode)) {
            throw new Error(`Failed node lookup for component ${component.identifier}`);
        }
        node.getBody()?.accept(new ComponentGeneratorVisitor(component, metadata, symbols));
        const descriptor = metadata.findComponent(component);
        il.components.push(descriptor);
        if (component.isEntryPoint) {
            il.entryPoints.push(descriptor);
        }
    }
}
