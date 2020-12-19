import { ProcedureNode, TypeNode, ParameterNode, DesignatorNode, ExpressionNode } from '../ast/ast';
import {
    SymbolTable,
    ScopeSymbolType,
    ComponentSymbol,
    InterfaceSymbol,
    ImplementationSymbol,
    ConstantSymbol,
    VariableSymbol,
    ProcedureSymbol,
    NamedScopeSymbol,
    TypeSymbol,
    SearchOptions,
    GlobalScopeSymbol,
    MessageSymbol,
} from '../symbols/symbols';
import { Optional } from '@composita/ts-utility-types';
import { FixExpressionNodeVisitor } from './fix-expression-node';
import { FixTypeNodeVisitor } from './fix-type-node';

export class CheckerHelper {
    private static checkNotConstantSymbol(name: string, symbolTable: SymbolTable): void {
        const value = symbolTable.constants.filter((constant) => constant.identifier === name);
        if (value.length !== 0) {
            throw new Error(`${name} is a constant variable!`);
        }
    }

    static getComponent(symbolTable: SymbolTable, name: string, options: SearchOptions): ComponentSymbol {
        this.checkNotConstantSymbol(name, symbolTable);
        const components = symbolTable.findComponent(name, options);
        if (components.length > 1) {
            throw new Error(`Component ${name} defined ${components.length} times in the same scope.`);
        }
        if (components.length < 1) {
            throw new Error(`No component ${name} found.`);
        }
        return components[0];
    }

    static getInterface(symbolTable: SymbolTable, name: string, options: SearchOptions): InterfaceSymbol {
        this.checkNotConstantSymbol(name, symbolTable);
        const interfaces = symbolTable.findInterface(name, options);
        if (interfaces.length > 1) {
            throw new Error(`Interface ${name} defined ${interfaces.length} times in the same scope.`);
        }
        if (interfaces.length < 1) {
            throw new Error(`No interface ${name} found.`);
        }
        return interfaces[0];
    }

    static getImplementation(symbolTable: SymbolTable, name: string, options: SearchOptions): ImplementationSymbol {
        this.checkNotConstantSymbol(name, symbolTable);
        if (!(options.scope instanceof ComponentSymbol)) {
            throw new Error(`Failed to locate ${name}, must be inside a component.`);
        }
        const implementations = symbolTable.findImplementation(name, options);
        if (implementations.length > 1) {
            throw new Error(`Implementaiton ${name} defined ${implementations.length} times in the same scope.`);
        }
        if (implementations.length < 1) {
            throw new Error(`No implementation ${name} found.`);
        }
        return implementations[0];
    }

    static getConstant(symbolTable: SymbolTable, name: string): ConstantSymbol {
        const constant = symbolTable.constants.filter((constant) => constant.identifier === name);
        if (constant.length > 1) {
            throw new Error(`Found ${name} multiple times.`);
        }
        if (constant.length < 1) {
            throw new Error(`Failed to find ${name}.`);
        }
        return constant[0];
    }

    static getVariable(symbolTable: SymbolTable, name: string, options: SearchOptions): VariableSymbol {
        const symbol = symbolTable.findVariable(name, options);
        if (symbol.length > 1) {
            throw new Error(`Found ${name} multiple times.`);
        }
        if (symbol.length < 1) {
            throw new Error(`Failed to find ${name}.`);
        }
        return symbol[0];
    }

    static getProcedureParam(symbolTable: SymbolTable, scope: ScopeSymbolType, name: string): VariableSymbol {
        while (!(scope instanceof ProcedureSymbol) && scope instanceof NamedScopeSymbol) {
            // go up to procedure.
            scope = scope.scope;
        }
        if (!(scope instanceof ProcedureSymbol)) {
            throw new Error(`${name} is not a procedure parameter.`);
        }

        const symbol = this.getVariable(symbolTable, name, new SearchOptions(scope, false, false));
        if (!(symbol.scope instanceof ProcedureSymbol)) {
            throw new Error(`Found ${name} outside procedure param.`);
        }
        return symbol;
    }

    static getProcedure(
        name: string,
        symbolTable: SymbolTable,
        params: Array<TypeSymbol>,
        returnType: Optional<TypeSymbol>,
        options: SearchOptions,
    ): ProcedureSymbol {
        this.checkNotConstantSymbol(name, symbolTable);
        const procedures = symbolTable.findProcedure(name, params, returnType, options);

        if (procedures.length > 1) {
            throw new Error(`Procedure ${name} defined ${procedures.length} times in the same scope.`);
        }
        if (procedures.length < 1) {
            throw new Error(`No procedure ${name} found.`);
        }

        return procedures[0];
    }

    static getProcedureFromNode(
        node: ProcedureNode,
        symbolTable: SymbolTable,
        options: SearchOptions,
    ): ProcedureSymbol {
        const name = node.getName().getName();
        this.checkNotConstantSymbol(name, symbolTable);

        let returnType: TypeSymbol = symbolTable.voidType;
        const returnTypeNode = node.getType();
        if (returnTypeNode !== undefined) {
            returnTypeNode.accept(new FixTypeNodeVisitor(symbolTable, options.scope));
            const foundType = symbolTable.typeToSymbol.get(returnTypeNode);
            if (foundType === undefined) {
                throw new Error(`Failed to find procedure ${name} return type.`);
            }
            returnType = foundType;
        }
        const paramTypes = CheckerHelper.convertParamTypes(
            symbolTable,
            options.scope,
            node.getParams().map((param) => param.getParameter()),
        );
        return this.getProcedure(name, symbolTable, paramTypes, returnType, options);
    }

    static getTypeType(symbolTable: SymbolTable, node: TypeNode): TypeSymbol {
        const type = symbolTable.typeToSymbol.get(node);
        if (type === undefined) {
            throw new Error(`Type node type lookup failed.`);
        }
        return type;
    }

    static convertParamTypes(
        symbolTable: SymbolTable,
        scope: ScopeSymbolType,
        params: Array<ParameterNode>,
    ): Array<TypeSymbol> {
        return params.flatMap((param) => {
            param.getType().accept(new FixTypeNodeVisitor(symbolTable, scope));
            const type = this.getTypeType(symbolTable, param.getType());
            return param.getNames().map(() => type);
        });
    }

    static getMessageInImplentation(
        symbolTable: SymbolTable,
        scope: ScopeSymbolType,
        name: string,
        ignoreArgs: boolean,
        args: Array<TypeSymbol>,
    ): MessageSymbol {
        while (!(scope instanceof ImplementationSymbol)) {
            if (scope instanceof GlobalScopeSymbol) {
                throw new Error(`Failed message lookup for ${name}.`);
            }
            scope = scope.scope;
        }
        const messages = symbolTable.findMessage(
            name,
            ignoreArgs,
            args,
            new SearchOptions(scope.interfaceSymbol, false, false),
        );
        if (messages.length > 1) {
            throw new Error(`Ambiguous message lookup for ${name}.`);
        }
        if (messages.length < 1) {
            throw new Error(`Message lookup failed for ${name}.`);
        }
        return messages[0];
    }

    static getMessage(
        symbolTable: SymbolTable,
        scope: ScopeSymbolType,
        interfaceTarget: Optional<DesignatorNode>,
        name: string,
        ignoreArgs: boolean,
        args: Array<ExpressionNode>,
    ): MessageSymbol {
        const argTypes = args.map((argument) => {
            argument.accept(new FixExpressionNodeVisitor(symbolTable, scope));
            const type = symbolTable.expressionToSymbol.get(argument);
            if (type === undefined) {
                throw new Error('Failed argument type lookup.');
            }
            return type;
        });
        interfaceTarget?.accept(new FixExpressionNodeVisitor(symbolTable, scope));
        if (interfaceTarget !== undefined) {
            const type = symbolTable.expressionToSymbol.get(interfaceTarget);
            const messages = new Array<MessageSymbol>();
            if (type instanceof ComponentSymbol) {
                messages.push(
                    ...type.genericType.offered
                        .map((offer) => offer.interfaceSymbol)
                        .flatMap((potentialInterface) =>
                            symbolTable.findMessage(
                                name,
                                ignoreArgs,
                                argTypes,
                                new SearchOptions(potentialInterface, false, false),
                            ),
                        ),
                );
            } else if (type instanceof InterfaceSymbol) {
                messages.push(
                    ...symbolTable.findMessage(name, ignoreArgs, argTypes, new SearchOptions(type, false, false)),
                );
            } else {
                throw new Error(`Failed interface lookup for ${name}.`);
            }
            if (messages.length > 1) {
                throw new Error(`Ambigious message lookup for ${name}.`);
            }
            if (messages.length < 1) {
                throw new Error(`Message lookup failed for ${name}.`);
            }
            return messages[0];
        }
        return this.getMessageInImplentation(symbolTable, scope, name, ignoreArgs, argTypes);
    }
}
