import {
    Visitor,
    StatementSequenceNode,
    ProcedureCallNode,
    AssignmentNode,
    NewNode,
    ConnectNode,
    DisconnectNode,
    SendNode,
    ReceiveNode,
    DeleteNode,
    MoveNode,
    AwaitNode,
    ReturnNode,
    IfNode,
    ElseIfNode,
    WhileNode,
    RepeatNode,
    ForNode,
    ForeachNode,
    StatementBlockNode,
    ProgramNode,
    ComponentNode,
    ComponentBodyNode,
    ImplementationNode,
    ProcedureNode,
    DesignatorNode,
    BasicDesignatorNode,
    BasicExpressionDesignatorNode,
} from '../ast/ast';
import {
    SymbolTable,
    ScopeSymbolType,
    BlockScopeSymbol,
    CollectionVariableSymbol,
    VariableSymbol,
    SearchOptions,
} from '../symbols/symbols';
import { FixExpressionNodeVisitor } from './fix-expression-node';
import { CheckerHelper } from './static-helpers';

export class FixStatementNodeVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    private findCollectionVariable(node: DesignatorNode): CollectionVariableSymbol {
        if (node instanceof BasicExpressionDesignatorNode || node instanceof BasicDesignatorNode) {
            const name = node.getName().getName();
            const symbol = this.symbolTable.findCollectionVariable(
                name,
                true,
                [],
                new SearchOptions(this.scope, false, false),
            );
            if (symbol.length > 1) {
                throw new Error(`Found ${name} multiple times.`);
            }
            if (symbol.length < 1) {
                throw new Error(`Failed to find ${name}.`);
            }
            return symbol[0];
        }
        // TODO
        throw new Error('Not implemented yet.');
    }

    visitProgram(node: ProgramNode): void {
        node.getComponents().forEach((component) => component.accept(this));
    }

    visitComponent(node: ComponentNode): void {
        const component = CheckerHelper.getComponent(
            this.symbolTable,
            node.getName().getName(),
            new SearchOptions(this.scope, true, true),
        );
        node.getBody()?.accept(new FixStatementNodeVisitor(this.symbolTable, component));
    }

    visitComponentBody(node: ComponentBodyNode): void {
        node.getDeclarations().forEach((declaration) => declaration.accept(this));
        node.getImplementations().forEach((implementation) => implementation.accept(this));
        node.getBeginBlock()?.accept(new FixStatementNodeVisitor(this.symbolTable, this.scope));
        node.getActivityBlock()?.accept(new FixStatementNodeVisitor(this.symbolTable, this.scope));
        node.getFinallyBlock()?.accept(new FixStatementNodeVisitor(this.symbolTable, this.scope));
    }

    visitImplementation(node: ImplementationNode): void {
        const implementation = CheckerHelper.getImplementation(
            this.symbolTable,
            node.getName().getName(),
            new SearchOptions(this.scope, true, false),
        );
        node.getDeclarations().forEach((declaration) =>
            declaration.accept(new FixStatementNodeVisitor(this.symbolTable, implementation)),
        );
        node.getStatements()?.accept(new FixStatementNodeVisitor(this.symbolTable, implementation));
    }

    visitProcedure(node: ProcedureNode): void {
        const procedure = CheckerHelper.getProcedureFromNode(
            node,
            this.symbolTable,
            new SearchOptions(this.scope, true, false),
        );
        node.getDeclarations().forEach((declaration) =>
            declaration.accept(new FixStatementNodeVisitor(this.symbolTable, procedure)),
        );
        node.getStatements()?.accept(new FixStatementNodeVisitor(this.symbolTable, procedure));
    }

    visitStatementSequence(node: StatementSequenceNode): void {
        node.getStatements().forEach((statement) =>
            statement.accept(new FixStatementNodeVisitor(this.symbolTable, new BlockScopeSymbol(this.scope))),
        );
    }

    visitProcedureCall(node: ProcedureCallNode): void {
        const params = node.getParams().map((param) => {
            param.accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
            return this.symbolTable.getOrThrow(this.symbolTable.expressionToSymbol.get(param));
        });
        const procedure = CheckerHelper.getProcedure(
            node.getName().getName(),
            this.symbolTable,
            params,
            undefined,
            new SearchOptions(this.scope, true, false),
        );
        this.symbolTable.callToSymbol.set(node, procedure);
    }

    visitAssignment(node: AssignmentNode): void {
        node.getDesignator().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
        const symbol = this.symbolTable.getOrThrow(this.symbolTable.designatorToSymbol.get(node.getDesignator()));
        if (!(symbol instanceof VariableSymbol && symbol.mutable) && !(symbol instanceof CollectionVariableSymbol)) {
            throw new Error('Cannot asign to to a constant variable.');
        }
        node.getExpression().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
    }

    visitNew(node: NewNode): void {
        // TODO check if valid
        node.getDesignator().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
        node.getArgs().forEach((argument) =>
            argument.accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope)),
        );
    }

    visitConnect(node: ConnectNode): void {
        // TODO check if connection is even possible
        node.getTo().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
        node.getWhat().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
    }

    visitDisconnect(node: DisconnectNode): void {
        // TODO validity check
        node.getWhat().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
    }

    visitSend(node: SendNode): void {
        if (node.getTarget().getName() === 'FINISHED') {
            throw new Error('foo');
        }
        this.symbolTable.sendReceiveToSymbol.set(
            node,
            CheckerHelper.getMessage(
                this.symbolTable,
                this.scope,
                node.getFrom(),
                node.getTarget().getName(),
                false,
                node.getArgs(),
            ),
        );
    }

    visitReceive(node: ReceiveNode): void {
        this.symbolTable.sendReceiveToSymbol.set(
            node,
            CheckerHelper.getMessage(
                this.symbolTable,
                this.scope,
                node.getFrom(),
                node.getReceiver().getName(),
                false,
                node.getTargets(),
            ),
        );
    }

    visitDelete(node: DeleteNode): void {
        node.getTarget().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
    }

    visitMove(node: MoveNode): void {
        node.getFrom().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
        node.getTo().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
    }

    visitAwait(node: AwaitNode): void {
        node.getExpression().accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
    }

    visitReturn(node: ReturnNode): void {
        node.getExpression()?.accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope));
    }

    visitIf(node: IfNode): void {
        const newScope = new BlockScopeSymbol(this.scope);
        node.getExpression().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        node.getThen().accept(new FixStatementNodeVisitor(this.symbolTable, newScope));
        node.getElseIfs().forEach((elseif) => elseif.accept(new FixStatementNodeVisitor(this.symbolTable, newScope)));
        node.getElse()?.accept(new FixStatementNodeVisitor(this.symbolTable, newScope));
    }

    visitElseIf(node: ElseIfNode): void {
        const newScope = new BlockScopeSymbol(this.scope);
        node.getExpression().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        node.getThen().accept(new FixStatementNodeVisitor(this.symbolTable, newScope));
    }

    visitWhile(node: WhileNode): void {
        const newScope = new BlockScopeSymbol(this.scope);
        node.getExpresssion().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        node.getBody().accept(new FixStatementNodeVisitor(this.symbolTable, newScope));
    }

    visitRepeat(node: RepeatNode): void {
        const newScope = new BlockScopeSymbol(this.scope);
        node.getExpresssion().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        node.getBody().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
    }

    visitFor(node: ForNode): void {
        const newScope = new BlockScopeSymbol(this.scope);
        node.getExpression().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        const designator = node.getDesignator();
        if (!(designator instanceof BasicDesignatorNode)) {
            throw new Error('Only basic designators currently supported.');
        }
        node.getDesignator().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        node.getTo().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        node.getBy()?.accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        node.getStatements().accept(new FixStatementNodeVisitor(this.symbolTable, newScope));
    }

    visitForeach(node: ForeachNode): void {
        const newScope = new BlockScopeSymbol(this.scope);
        node.getOf().accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        const variable = this.findCollectionVariable(node.getOf());
        if (variable.parameters.length < node.getDesignators().length) {
            throw new Error('Foreach designator match error.');
        }
        node.getDesignators().forEach((designator, index) => {
            if (!(designator instanceof BasicDesignatorNode)) {
                throw new Error('Only basic designators supported.');
            }
            this.symbolTable.registerVariable(
                new VariableSymbol(this.scope, designator.getName().getName(), true, variable.parameters[index]),
            );
            designator.accept(new FixExpressionNodeVisitor(this.symbolTable, newScope));
        });
        node.getBody().accept(new FixStatementNodeVisitor(this.symbolTable, newScope));
    }

    visitStatementBlock(node: StatementBlockNode): void {
        node.getStatements().accept(this);
    }
}
