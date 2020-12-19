import {
    Visitor,
    ProgramNode,
    ComponentNode,
    InterfaceNode,
    ComponentBodyNode,
    ProtocolNode,
    ProcedureNode,
    DeclarationNode,
    ImplementationNode,
    VariableListNode,
    ConstantListNode,
} from '../ast/ast';
import { SymbolTable, ScopeSymbolType, ComponentSymbol, SearchOptions } from '../symbols/symbols';
import { ComponentRegisterVisitor } from './register-component';
import { InterfaceRegisterVisitor } from './register-interface';
import { MessageRegisterVisitor } from './register-messages';
import { ProcedureRegisterVisitor } from './register-procedure';
import { ImplementationRegisterVisitor } from './register-implementation';
import { ConstantListRegisterVisitor } from './register-constant-list';
import { VariableListRegisterVisitor } from './register-variable-list';
import { CheckerHelper } from './static-helpers';

export class TypeRegisterVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    visitProgram(node: ProgramNode): void {
        node.getInterfaces().forEach((interfaceNode) =>
            interfaceNode.accept(new InterfaceRegisterVisitor(this.symbolTable, this.scope)),
        );
        node.getComponents().forEach((component) =>
            component.accept(new ComponentRegisterVisitor(this.symbolTable, this.scope)),
        );
        node.getInterfaces().forEach((interfaceNode) =>
            interfaceNode.accept(new TypeRegisterVisitor(this.symbolTable, this.scope)),
        );
        node.getComponents().forEach((component) =>
            component.accept(new TypeRegisterVisitor(this.symbolTable, this.scope)),
        );
    }

    visitComponent(node: ComponentNode): void {
        const name = node.getName().getName();
        const components = this.symbolTable.findComponent(name, new SearchOptions(this.scope, false, false));
        if (components.length !== 1) {
            throw new Error(`Failed lookup for component ${name}.`);
        }
        node.getBody()?.accept(new TypeRegisterVisitor(this.symbolTable, components[0]));
    }

    visitInterface(node: InterfaceNode): void {
        const name = node.getName().getName();
        const interfaces = this.symbolTable.findInterface(name, new SearchOptions(this.scope, false, false));
        if (interfaces.length !== 1) {
            throw new Error(`Failed to lookup interface ${name}.`);
        }
        node.getProtocol().accept(new MessageRegisterVisitor(this.symbolTable, interfaces[0]));
    }

    visitProtocol(node: ProtocolNode): void {
        node.getExpression()?.accept(new MessageRegisterVisitor(this.symbolTable, this.scope));
    }

    visitProcedure(node: ProcedureNode): void {
        const procedure = CheckerHelper.getProcedureFromNode(
            node,
            this.symbolTable,
            new SearchOptions(this.scope, false, false),
        );
        this.registerLayer(node.getDeclarations(), procedure);
    }

    registerLayer(
        declarations: Array<DeclarationNode>,
        currentScope: ScopeSymbolType,
        processAddtionalLayer?: () => void,
        processAddtionalSubLayer?: (visitor: Visitor) => void,
    ): void {
        const components = declarations
            .filter((declaration) => declaration instanceof ComponentNode)
            .map((declaration) => declaration as ComponentNode);
        const interfaces = declarations
            .filter((declaration) => declaration instanceof InterfaceNode)
            .map((declaration) => declaration as InterfaceNode);
        const procedures = declarations
            .filter((declaration) => declaration instanceof ProcedureNode)
            .map((declaration) => declaration as ProcedureNode);
        const variables = declarations
            .filter((declaration) => declaration instanceof VariableListNode)
            .map((declaration) => declaration as VariableListNode);
        const constants = declarations
            .filter((declaration) => declaration instanceof ConstantListNode)
            .map((declaration) => declaration as ConstantListNode);
        interfaces.forEach((declaration) =>
            declaration.accept(new InterfaceRegisterVisitor(this.symbolTable, currentScope)),
        );
        components.forEach((declaration) =>
            declaration.accept(new ComponentRegisterVisitor(this.symbolTable, currentScope)),
        );
        procedures.forEach((declaration) =>
            declaration.accept(new ProcedureRegisterVisitor(this.symbolTable, currentScope)),
        );
        variables.forEach((declaration) =>
            declaration.accept(new VariableListRegisterVisitor(this.symbolTable, currentScope)),
        );
        constants.forEach((declaration) =>
            declaration.accept(new ConstantListRegisterVisitor(this.symbolTable, currentScope)),
        );
        if (processAddtionalLayer !== undefined) {
            processAddtionalLayer();
        }
        interfaces.forEach((interfaceNode) =>
            interfaceNode.accept(new TypeRegisterVisitor(this.symbolTable, currentScope)),
        );
        components.forEach((component) => component.accept(new TypeRegisterVisitor(this.symbolTable, currentScope)));
        procedures.forEach((procedure) => procedure.accept(new TypeRegisterVisitor(this.symbolTable, currentScope)));
        if (processAddtionalSubLayer !== undefined) {
            processAddtionalSubLayer(new TypeRegisterVisitor(this.symbolTable, currentScope));
        }
    }

    visitImplementation(node: ImplementationNode): void {
        const name = node.getName().getName();
        if (!(this.scope instanceof ComponentSymbol)) {
            throw new Error('Implementation must be in a component scope!');
        }
        const implementations = this.symbolTable.findImplementation(name, new SearchOptions(this.scope, false, false));
        if (implementations.length !== 1) {
            throw new Error(`Failed to lookup interface ${name}.`);
        }
        this.registerLayer(node.getDeclarations(), implementations[0]);
    }

    visitComponentBody(node: ComponentBodyNode): void {
        if (!(this.scope instanceof ComponentSymbol)) {
            throw new Error('Component body must be a component scope!');
        }
        const localScope = this.scope;
        this.registerLayer(
            node.getDeclarations(),
            localScope,
            () => {
                node.getImplementations().forEach((implementation) =>
                    implementation.accept(new ImplementationRegisterVisitor(this.symbolTable, localScope)),
                );
            },
            (visitor) => {
                node.getImplementations().forEach((implementation) => implementation.accept(visitor));
            },
        );
    }
}
