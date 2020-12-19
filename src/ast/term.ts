import { SourceLocation } from '../source-location/location';
import { NonEmptyArray } from '@composita/ts-utility-types';
import { Node } from './node';
import { Visitor } from './visitor';
import { FactorNode } from './factor';
import { SimpleExpressionNode } from './simple-expression';

enum TermTag {
    Tag,
}
export abstract class TermNode extends SimpleExpressionNode {
    constructor(location: SourceLocation) {
        super(location);
    }

    accept(visitor: Visitor): void {
        visitor.visitTerm(this);
    }

    protected readonly _termTag: TermTag = TermTag.Tag;
}

export class FactorChainNode extends TermNode {
    constructor(location: SourceLocation, private left: FactorNode, private right: NonEmptyArray<RightFactorNode>) {
        super(location);
    }

    getLeft(): FactorNode {
        return this.left;
    }

    getRight(): NonEmptyArray<RightFactorNode> {
        return this.right;
    }

    accept(visitor: Visitor): void {
        visitor.visitFactorChain(this);
    }
}

export enum InfixFactorOperator {
    Times,
    Div,
    DivText,
    ModText,
    AndText,
}

export class RightFactorNode extends Node {
    constructor(location: SourceLocation, private op: InfixFactorOperator, private right: FactorNode) {
        super(location);
    }

    getOp(): InfixFactorOperator {
        return this.op;
    }

    getRight(): FactorNode {
        return this.right;
    }

    accept(visitor: Visitor): void {
        visitor.visitRightFactor(this);
    }
}
