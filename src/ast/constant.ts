import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { ExpressionNode } from './expression';
import { NameNode } from './name';
import { Visitor } from './visitor';
import { DeclarationNode } from './declaration';
import { NonEmptyArray } from '@composita/ts-utility-types';

export class ConstantNode extends Node {
    constructor(location: SourceLocation, private name: NameNode, private expression: ConstantExpressionNode) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getExpression(): ConstantExpressionNode {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitConstant(this);
    }
}

export class ConstantExpressionNode extends Node {
    constructor(location: SourceLocation, private expression: ExpressionNode) {
        super(location);
    }

    getExpression(): ExpressionNode {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitConstantExpression(this);
    }
}

export class ConstantListNode extends DeclarationNode {
    constructor(location: SourceLocation, private constants: NonEmptyArray<ConstantNode>) {
        super(location);
    }

    getConstants(): NonEmptyArray<ConstantNode> {
        return this.constants;
    }

    accept(visitor: Visitor): void {
        visitor.visitConstantList(this);
    }
}
