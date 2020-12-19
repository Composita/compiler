import { SourceLocation } from '../source-location/location';
import { Optional, NonEmptyArray } from '@composita/ts-utility-types';
import { Node } from './node';
import { Visitor } from './visitor';
import { NameNode } from './name';
import { ExpressionNode } from './expression';
import { DesignatorNode } from './designator';
import { StatementSequenceNode } from './statement-sequence';
import { ConstantExpressionNode } from './constant';

enum StatementTag {
    Tag,
}
export abstract class StatementNode extends Node {
    protected readonly _statementTag: StatementTag = StatementTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitStatement(this);
    }
}

export class ProcedureCallNode extends StatementNode {
    constructor(location: SourceLocation, private name: NameNode, private params: Array<ExpressionNode>) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getParams(): Array<ExpressionNode> {
        return this.params;
    }

    accept(visitor: Visitor): void {
        visitor.visitProcedureCall(this);
    }
}

export class AssignmentNode extends StatementNode {
    constructor(location: SourceLocation, private designator: DesignatorNode, private expression: ExpressionNode) {
        super(location);
    }

    getDesignator(): DesignatorNode {
        return this.designator;
    }

    getExpression(): ExpressionNode {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitAssignment(this);
    }
}

export class NewNode extends StatementNode {
    constructor(location: SourceLocation, private designator: DesignatorNode, private args: Array<ExpressionNode>) {
        super(location);
    }

    getDesignator(): DesignatorNode {
        return this.designator;
    }

    getArgs(): Array<ExpressionNode> {
        return this.args;
    }

    accept(visitor: Visitor): void {
        visitor.visitNew(this);
    }
}

export class ConnectNode extends StatementNode {
    constructor(location: SourceLocation, private what: DesignatorNode, private to: DesignatorNode) {
        super(location);
    }

    getWhat(): DesignatorNode {
        return this.what;
    }

    getTo(): DesignatorNode {
        return this.to;
    }

    accept(visitor: Visitor): void {
        visitor.visitConnect(this);
    }
}

export class DisconnectNode extends StatementNode {
    constructor(location: SourceLocation, private what: DesignatorNode) {
        super(location);
    }

    getWhat(): DesignatorNode {
        return this.what;
    }

    accept(visitor: Visitor): void {
        visitor.visitDisconnect(this);
    }
}

export class SendNode extends StatementNode {
    constructor(
        location: SourceLocation,
        private from: Optional<DesignatorNode>,
        private target: NameNode,
        private args: Array<ExpressionNode>,
    ) {
        super(location);
    }

    getFrom(): Optional<DesignatorNode> {
        return this.from;
    }

    getTarget(): NameNode {
        return this.target;
    }

    getArgs(): Array<ExpressionNode> {
        return this.args;
    }

    accept(visitor: Visitor): void {
        visitor.visitSend(this);
    }
}

export class ReceiveNode extends StatementNode {
    constructor(
        location: SourceLocation,
        private from: Optional<DesignatorNode>,
        private receiver: NameNode,
        private targets: Array<DesignatorNode>,
    ) {
        super(location);
    }

    getFrom(): Optional<DesignatorNode> {
        return this.from;
    }

    getReceiver(): NameNode {
        return this.receiver;
    }

    getTargets(): Array<DesignatorNode> {
        return this.targets;
    }

    accept(visitor: Visitor): void {
        visitor.visitReceive(this);
    }
}

export class DeleteNode extends StatementNode {
    constructor(location: SourceLocation, private target: DesignatorNode) {
        super(location);
    }

    getTarget(): DesignatorNode {
        return this.target;
    }

    accept(visitor: Visitor): void {
        visitor.visitDelete(this);
    }
}

export class MoveNode extends StatementNode {
    constructor(location: SourceLocation, private from: DesignatorNode, private to: DesignatorNode) {
        super(location);
    }

    getFrom(): DesignatorNode {
        return this.from;
    }

    getTo(): DesignatorNode {
        return this.to;
    }

    accept(visitor: Visitor): void {
        visitor.visitMove(this);
    }
}

export class AwaitNode extends StatementNode {
    constructor(location: SourceLocation, private expression: ExpressionNode) {
        super(location);
    }

    getExpression(): ExpressionNode {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitAwait(this);
    }
}

export class ReturnNode extends StatementNode {
    constructor(location: SourceLocation, private expression: Optional<ExpressionNode>) {
        super(location);
    }

    getExpression(): Optional<ExpressionNode> {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitReturn(this);
    }
}

export class IfNode extends StatementNode {
    constructor(
        location: SourceLocation,
        private expression: ExpressionNode,
        private then: StatementSequenceNode,
        private elseIfs: Array<ElseIfNode>,
        private elseNode: Optional<StatementSequenceNode>,
    ) {
        super(location);
    }

    getExpression(): ExpressionNode {
        return this.expression;
    }

    getThen(): StatementSequenceNode {
        return this.then;
    }

    getElseIfs(): Array<ElseIfNode> {
        return this.elseIfs;
    }

    getElse(): Optional<StatementSequenceNode> {
        return this.elseNode;
    }

    accept(visitor: Visitor): void {
        visitor.visitIf(this);
    }
}

export class ElseIfNode extends StatementNode {
    constructor(location: SourceLocation, private expression: ExpressionNode, private then: StatementSequenceNode) {
        super(location);
    }

    getExpression(): ExpressionNode {
        return this.expression;
    }

    getThen(): StatementSequenceNode {
        return this.then;
    }

    accept(visitor: Visitor): void {
        visitor.visitElseIf(this);
    }
}

export class WhileNode extends StatementNode {
    constructor(location: SourceLocation, private expression: ExpressionNode, private body: StatementSequenceNode) {
        super(location);
    }

    getExpresssion(): ExpressionNode {
        return this.expression;
    }

    getBody(): StatementSequenceNode {
        return this.body;
    }

    accept(visitor: Visitor): void {
        visitor.visitWhile(this);
    }
}

export class RepeatNode extends StatementNode {
    constructor(location: SourceLocation, private body: StatementSequenceNode, private expression: ExpressionNode) {
        super(location);
    }

    getBody(): StatementSequenceNode {
        return this.body;
    }

    getExpresssion(): ExpressionNode {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitRepeat(this);
    }
}

export class ForNode extends StatementNode {
    constructor(
        location: SourceLocation,
        private designator: DesignatorNode,
        private expression: ExpressionNode,
        private to: ExpressionNode,
        private by: Optional<ConstantExpressionNode>,
        private statements: StatementSequenceNode,
    ) {
        super(location);
    }

    getDesignator(): DesignatorNode {
        return this.designator;
    }

    getExpression(): ExpressionNode {
        return this.expression;
    }

    getTo(): ExpressionNode {
        return this.to;
    }

    getBy(): Optional<ConstantExpressionNode> {
        return this.by;
    }

    getStatements(): StatementSequenceNode {
        return this.statements;
    }

    accept(visitor: Visitor): void {
        visitor.visitFor(this);
    }
}

export class ForeachNode extends StatementNode {
    constructor(
        location: SourceLocation,
        private designators: NonEmptyArray<DesignatorNode>,
        private of: DesignatorNode,
        private body: StatementSequenceNode,
    ) {
        super(location);
    }

    getDesignators(): NonEmptyArray<DesignatorNode> {
        return this.designators;
    }

    getOf(): DesignatorNode {
        return this.of;
    }

    getBody(): StatementSequenceNode {
        return this.body;
    }

    accept(visitor: Visitor): void {
        visitor.visitForeach(this);
    }
}

export class StatementBlockNode extends StatementNode {
    constructor(location: SourceLocation, private statements: StatementSequenceNode) {
        super(location);
    }

    getStatements(): StatementSequenceNode {
        return this.statements;
    }

    accept(visitor: Visitor): void {
        visitor.visitStatementBlock(this);
    }
}
