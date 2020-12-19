import { SourceLocation } from '../source-location/location';
import { NonEmptyArray } from '@composita/ts-utility-types';
import { Node } from './node';
import { Visitor } from './visitor';
import { TermNode } from './term';
import { ExpressionNode } from './expression';

enum SimpleExpressionTag {
    Tag,
}
export abstract class SimpleExpressionNode extends ExpressionNode {
    constructor(location: SourceLocation) {
        super(location);
    }

    accept(visitor: Visitor): void {
        visitor.visitSimpleExpression(this);
    }

    protected readonly _simpleExpressionTag: SimpleExpressionTag = SimpleExpressionTag.Tag;
}

export enum PrefixOperator {
    Plus,
    Minus,
}

export class UnaryTermNode extends SimpleExpressionNode {
    constructor(location: SourceLocation, private op: PrefixOperator, private term: TermNode) {
        super(location);
    }

    getOp(): PrefixOperator {
        return this.op;
    }

    getTerm(): TermNode {
        return this.term;
    }

    accept(visitor: Visitor): void {
        visitor.visitUnaryTermNode(this);
    }
}

export enum InfixTermOperator {
    Plus,
    Minus,
    Or,
}

export class TermChainNode extends SimpleExpressionNode {
    constructor(
        location: SourceLocation,
        private left: SimpleExpressionNode,
        private right: NonEmptyArray<RightTermNode>,
    ) {
        super(location);
    }

    getLeft(): SimpleExpressionNode {
        return this.left;
    }

    getRight(): NonEmptyArray<RightTermNode> {
        return this.right;
    }

    accept(visitor: Visitor): void {
        visitor.visitTermChain(this);
    }
}

export class RightTermNode extends Node {
    constructor(location: SourceLocation, private op: InfixTermOperator, private right: TermNode) {
        super(location);
    }

    getOp(): InfixTermOperator {
        return this.op;
    }

    getRight(): TermNode {
        return this.right;
    }

    accept(visitor: Visitor): void {
        visitor.visitRightTerm(this);
    }
}
