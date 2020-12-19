import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';
import { NameNode } from './name';
import { ParameterNode } from './parameter';
import { ProtocolExpressionNode } from './interface';

enum ProtocolFactorTag {
    Tag,
}
export abstract class ProtocolFactorNode extends Node {
    constructor(location: SourceLocation) {
        super(location);
    }

    accept(visitor: Visitor): void {
        visitor.visitProtocolFactor(this);
    }

    protected readonly _protocolFactorTag: ProtocolFactorTag = ProtocolFactorTag.Tag;
}

export enum MessageDirection {
    IN,
    OUT,
}
export class MessageDeclarationNode extends ProtocolFactorNode {
    constructor(
        location: SourceLocation,
        private direction: MessageDirection,
        private name: NameNode,
        private params: Array<ParameterNode>,
    ) {
        super(location);
    }

    getDirection(): MessageDirection {
        return this.direction;
    }

    getName(): NameNode {
        return this.name;
    }

    getParams(): Array<ParameterNode> {
        return this.params;
    }

    accept(visitor: Visitor): void {
        visitor.visitMessageDeclaration(this);
    }
}

enum ProtocolFactorExpressionTag {
    Tag,
}
export abstract class ProtocolFactorExpressionNode extends ProtocolFactorNode {
    constructor(location: SourceLocation, private expression: ProtocolExpressionNode) {
        super(location);
    }

    getExpression(): ProtocolExpressionNode {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitProtocolFactorExpression(this);
    }

    protected readonly _protocolFactorExpressionTag: ProtocolFactorExpressionTag = ProtocolFactorExpressionTag.Tag;
}

enum OptionalProtocolExpressionTag {
    Tag,
}
export class OptionalProtocolExpressionNode extends ProtocolFactorExpressionNode {
    protected readonly _tag: OptionalProtocolExpressionTag = OptionalProtocolExpressionTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitOptionalProtocolFactorExpression(this);
    }
}

enum RepeatingProtocolExpressionTag {
    Tag,
}
export class RepeatingProtocolExpressionNode extends ProtocolFactorExpressionNode {
    protected readonly _tag: RepeatingProtocolExpressionTag = RepeatingProtocolExpressionTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitRepeatingProtocolFactorExpression(this);
    }
}

enum GroupProtocolExpressionTag {
    Tag,
}
export class GroupProtocolExpressionNode extends ProtocolFactorExpressionNode {
    protected readonly _tag: GroupProtocolExpressionTag = GroupProtocolExpressionTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitGroupProtocolFactorExpression(this);
    }
}
