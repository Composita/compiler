import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';
import { AttributeNode } from './attribute';
import { SimpleExpressionNode } from './simple-expression';
import { NonEmptyArray } from '@composita/ts-utility-types';
import { InterfaceDeclarationNode } from './interface-declaration';
import { DesignatorNode } from './designator';
import { TypeNode } from './type';

enum ExpressionTag {
    Tag,
}
export abstract class ExpressionNode extends Node {
    protected readonly _expressionTag: ExpressionTag = ExpressionTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitExpression(this);
    }
}

enum AttributedExpressionTag {
    Tag,
}
export abstract class AttributedExpressionNode extends ExpressionNode {
    constructor(location: SourceLocation, private attributes: Array<AttributeNode>) {
        super(location);
    }

    getAttributes(): Array<AttributeNode> {
        return this.attributes;
    }

    accept(visitor: Visitor): void {
        visitor.visitAttributedExpression(this);
    }

    protected readonly _attributedExpressionTag: AttributedExpressionTag = AttributedExpressionTag.Tag;
}

export class UnaryExpressionNode extends AttributedExpressionNode {
    constructor(location: SourceLocation, attributes: Array<AttributeNode>, private expression: SimpleExpressionNode) {
        super(location, attributes);
    }

    getExpression(): SimpleExpressionNode {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitUnaryExpression(this);
    }
}

export enum LogicalOperator {
    Equal,
    NotEqual,
    Less,
    LessEqual,
    More,
    MoreEqual,
}

export class BinaryExpressionNode extends AttributedExpressionNode {
    constructor(
        location: SourceLocation,
        attributes: Array<AttributeNode>,
        private left: SimpleExpressionNode,
        private op: LogicalOperator,
        private right: SimpleExpressionNode,
    ) {
        super(location, attributes);
    }

    getLeft(): SimpleExpressionNode {
        return this.left;
    }

    getOp(): LogicalOperator {
        return this.op;
    }

    getRight(): SimpleExpressionNode {
        return this.right;
    }

    accept(visitor: Visitor): void {
        visitor.visitBinaryExpression(this);
    }
}

export enum OffersRequiresOperator {
    Offers,
    Requires,
}

export class OffersRequiresExpressionNode extends AttributedExpressionNode {
    constructor(
        location: SourceLocation,
        attributes: Array<AttributeNode>,
        private op: OffersRequiresOperator,
        private interfaces: NonEmptyArray<InterfaceDeclarationNode>,
    ) {
        super(location, attributes);
    }

    getOp(): OffersRequiresOperator {
        return this.op;
    }

    getInterfaces(): NonEmptyArray<InterfaceDeclarationNode> {
        return this.interfaces;
    }

    accept(visitor: Visitor): void {
        visitor.visitOffersRequiresExpression(this);
    }
}

export class TypeCheckExpressionNode extends AttributedExpressionNode {
    constructor(
        location: SourceLocation,
        attributes: Array<AttributeNode>,
        private designator: DesignatorNode,
        private type: TypeNode,
    ) {
        super(location, attributes);
    }

    getDesignator(): DesignatorNode {
        return this.designator;
    }

    getType(): TypeNode {
        return this.type;
    }

    accept(visitor: Visitor): void {
        visitor.visitTypeCheck(this);
    }
}
