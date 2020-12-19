import {
    TypeSymbol,
    ComponentSymbol,
    InterfaceSymbol,
    BuiltInTypeSymbol,
    MessageSymbol,
    ProcedureSymbol,
    ConstantSymbol,
} from './type-symbols';
import { GlobalScopeSymbol, ScopeSymbolType, NamedScopeSymbol, ImplementationSymbol } from './scope-symbols';
import { GenericSymbol } from './generic-symbols';
import { VariableSymbol, CollectionVariableSymbol } from './variable-symbols';

import {
    ExpressionNode,
    TypeNode,
    DesignatorNode,
    ImplementationNode,
    DeclarationNode,
    ProcedureCallNode,
    FunctionCallNode,
    ReceiveNode,
    SendNode,
    VariableNode,
    ConstantNode,
    ComponentNode,
    InterfaceNode,
    MessagePattern,
    ProcedureNode,
    MessageDeclarationNode,
} from '../ast/ast';
import { Optional } from '@composita/ts-utility-types';

export class SearchOptions {
    constructor(
        public readonly scope: ScopeSymbolType,
        public readonly searchGlobalScope: boolean,
        public readonly searchParentScope: boolean,
    ) {}
}

export class SymbolTable {
    // varia
    public readonly globalScope = new GlobalScopeSymbol();
    public readonly voidType = new BuiltInTypeSymbol(this.globalScope, '@@@__VOID__@@@');
    public readonly anyRequiredInterfaceType = new InterfaceSymbol(
        this.globalScope,
        '@@@__ANY_REQUIRED_INTERFACE__@@@',
    );
    public readonly anyGenericComponentType = new GenericSymbol([], []);
    public readonly anyComponentType = new ComponentSymbol(
        this.globalScope,
        '@@@__ANY_COMPONENT__@@@',
        this.anyGenericComponentType,
        false,
    );
    public readonly anyMessage = new MessageSymbol(this.globalScope, 'ANY', []);
    public readonly finishMessage = new MessageSymbol(this.globalScope, 'FINISH', []);

    // mappings symbol -> node
    public readonly symbolToDeclaration = new Map<NamedScopeSymbol, DeclarationNode>();
    public readonly symbolToImplementation = new Map<ImplementationSymbol, ImplementationNode>();
    public readonly symbolToComponent = new Map<ComponentSymbol, ComponentNode>();
    public readonly symbolToInterface = new Map<InterfaceSymbol, InterfaceNode>();

    // mappings node -> symbol
    public readonly expressionToSymbol = new Map<ExpressionNode, TypeSymbol>();
    public readonly typeToSymbol = new Map<TypeNode, TypeSymbol>();
    public readonly designatorToSymbol = new Map<DesignatorNode, NamedScopeSymbol>();
    public readonly variableToSymbol = new Map<VariableNode | ConstantNode, VariableSymbol>();
    public readonly callToSymbol = new Map<ProcedureCallNode | FunctionCallNode, ProcedureSymbol>();
    public readonly sendReceiveToSymbol = new Map<SendNode | ReceiveNode, MessageSymbol>();
    public readonly patternToSymbol = new Map<MessagePattern, MessageSymbol>();

    public readonly componentToSymbol = new Map<ComponentNode, ComponentSymbol>();
    public readonly messageToSymbol = new Map<MessageDeclarationNode, MessageSymbol>();
    public readonly implementationToSymbol = new Map<ImplementationNode, ImplementationSymbol>();
    public readonly procedureToSymbol = new Map<ProcedureNode, ProcedureSymbol>();
    public readonly interfaceToSymbol = new Map<InterfaceNode, InterfaceSymbol>();

    // types
    public readonly types = new Array<TypeSymbol>();
    public readonly builtins = new Array<BuiltInTypeSymbol>();
    public readonly components = new Array<ComponentSymbol>();
    public readonly interfaces = new Array<InterfaceSymbol>();
    public readonly messages = new Array<MessageSymbol>();

    // lookups
    public readonly constants = new Array<ConstantSymbol>();
    public readonly procedures = new Array<ProcedureSymbol>();
    public readonly impplementations = new Array<ImplementationSymbol>();
    public readonly variables = new Array<VariableSymbol>();
    public readonly collectionVariables = new Array<CollectionVariableSymbol>();

    getMessages(scope: ScopeSymbolType): Array<MessageSymbol> {
        return this.messages.filter((message) => message.scope === scope);
    }

    getSystemProcedures(): Array<ProcedureSymbol> {
        return this.procedures.filter((procedure) => procedure.scope === this.globalScope);
    }

    getProcedures(scope: ScopeSymbolType): Array<ProcedureSymbol> {
        return this.procedures.filter((procedure) => procedure.scope === scope);
    }

    getImplementations(scope: ComponentSymbol): Array<ImplementationSymbol> {
        return this.impplementations.filter((implementation) => implementation.scope === scope);
    }

    getVariables(scope: ScopeSymbolType): Array<VariableSymbol> {
        return this.variables.filter((variable) => variable.scope === scope);
    }

    getCollectionVariables(scope: ScopeSymbolType): Array<CollectionVariableSymbol> {
        return this.collectionVariables.filter((variable) => variable.scope === scope);
    }

    registerBuiltIns(builtin: BuiltInTypeSymbol): void {
        this.builtins.push(builtin);
        this.types.push(builtin);
    }

    registerComponent(component: ComponentSymbol): void {
        this.components.push(component);
        this.types.push(component);
    }

    registerInterface(interfaceSymbol: InterfaceSymbol): void {
        this.interfaces.push(interfaceSymbol);
        this.types.push(interfaceSymbol);
    }

    registerMessage(message: MessageSymbol): void {
        this.messages.push(message);
        this.types.push(message);
    }

    registerProcedure(procedure: ProcedureSymbol): void {
        this.procedures.push(procedure);
    }

    registerImplementation(implementation: ImplementationSymbol): void {
        this.impplementations.push(implementation);
    }

    registerVariable(variable: VariableSymbol): void {
        this.variables.push(variable);
    }

    registerCollectionVariable(variable: CollectionVariableSymbol): void {
        this.collectionVariables.push(variable);
    }

    static componentSatisfiesGeneric(component: ComponentSymbol, generic: GenericSymbol): boolean {
        if (generic.offered.length === 0 && generic.required.length === 0) {
            return true;
        }
        return generic.canBeSubstitutedBy(component.genericType);
    }

    findBuiltIn(name: string): Array<BuiltInTypeSymbol> {
        return this.builtins.filter((builtin) => builtin.identifier === name);
    }

    findProcedure(
        identifier: string,
        params: Array<TypeSymbol>,
        returnType: Optional<TypeSymbol>,
        options: SearchOptions,
    ): Array<ProcedureSymbol> {
        const searchFunction = (procedure: ProcedureSymbol, searchScope: ScopeSymbolType) => {
            return (
                procedure.identifier === identifier &&
                procedure.parameters.length === params.length &&
                procedure.parameters.filter((p, i) => this.isAssignable(p, params[i])).length === params.length &&
                (returnType === undefined || procedure.returnType === returnType) &&
                procedure.scope === searchScope
            );
        };
        return this.findInComponent(this.procedures, searchFunction.bind(this), options);
    }

    private isAssignable(paramA: TypeSymbol, paramB: TypeSymbol) {
        if (paramA instanceof ComponentSymbol && paramB instanceof ComponentSymbol) {
            return paramA.genericType.canBeSubstitutedBy(paramB.genericType);
        }
        return paramA === paramB;
    }

    private findInComponent<T extends ScopeSymbolType>(
        data: Array<T>,
        predicate: (element: T, scope: ScopeSymbolType) => boolean,
        options: SearchOptions,
    ): Array<T> {
        if (!options.searchGlobalScope && options.scope instanceof GlobalScopeSymbol) {
            return new Array<T>();
        }

        const results = data.filter((element) => predicate(element, options.scope));

        if (results.length > 0 || options.scope instanceof GlobalScopeSymbol) {
            return results;
        }

        if (!options.searchGlobalScope && options.scope.scope instanceof GlobalScopeSymbol) {
            return results;
        }

        if (
            !options.searchParentScope &&
            (options.scope instanceof ComponentSymbol || options.scope instanceof InterfaceSymbol)
        ) {
            if (options.searchGlobalScope) {
                return this.findInComponent(
                    data,
                    predicate,
                    new SearchOptions(this.globalScope, options.searchGlobalScope, options.searchParentScope),
                );
            }
            return results;
        }

        return this.findInComponent(
            data,
            predicate,
            new SearchOptions(options.scope.scope, options.searchGlobalScope, options.searchParentScope),
        );
    }

    private findNameInScope<T extends NamedScopeSymbol>(
        data: Array<T>,
        identifier: string,
        options: SearchOptions,
    ): Array<T> {
        const searchFunction = (element: T, searchScope: ScopeSymbolType) =>
            element.identifier === identifier && element.scope === searchScope;
        return this.findInComponent(data, searchFunction.bind(this), options);
    }

    findVariable(identifier: string, options: SearchOptions): Array<VariableSymbol> {
        return this.findNameInScope(this.variables, identifier, options);
    }

    findMessage(
        identifier: string,
        ignoreParams: boolean,
        params: Array<TypeSymbol>,
        options: SearchOptions,
    ): Array<MessageSymbol> {
        const searchFunction = (symbol: MessageSymbol, searchScope: ScopeSymbolType) => {
            return (
                symbol.identifier === identifier &&
                symbol.scope === searchScope &&
                (ignoreParams ||
                    (symbol.parameters.length === params.length &&
                        symbol.parameters.filter((p, i) => this.isAssignable(p, params[i])).length === params.length))
            );
        };
        return this.findInComponent(this.messages, searchFunction.bind(this), options);
    }

    findCollectionVariable(
        identifier: string,
        ignoreParams: boolean,
        params: Array<TypeSymbol>,
        options: SearchOptions,
    ): Array<CollectionVariableSymbol> {
        const searchFunction = (symbol: CollectionVariableSymbol, searchScope: ScopeSymbolType) => {
            return (
                symbol.identifier === identifier &&
                (ignoreParams ||
                    (symbol.parameters.length === params.length &&
                        symbol.parameters.filter((p, i) => this.isAssignable(p, params[i])).length ===
                            params.length)) &&
                symbol.scope === searchScope
            );
        };
        return this.findInComponent(this.collectionVariables, searchFunction.bind(this), options);
    }

    findComponent(identifier: string, options: SearchOptions): Array<ComponentSymbol> {
        return this.findNameInScope(this.components, identifier, options);
    }

    findInterface(identifier: string, options: SearchOptions): Array<InterfaceSymbol> {
        return this.findNameInScope(this.interfaces, identifier, options);
    }

    findType(identifier: string, options: SearchOptions): Array<TypeSymbol> {
        return this.findNameInScope(this.types, identifier, options);
    }

    findImplementation(identifier: string, options: SearchOptions): Array<ImplementationSymbol> {
        const searchFunction = (symbol: ImplementationSymbol, searchScope: ScopeSymbolType) => {
            return symbol.interfaceSymbol.identifier === identifier && symbol.scope === searchScope;
        };
        return this.findInComponent(this.impplementations, searchFunction.bind(this), options);
    }
}
