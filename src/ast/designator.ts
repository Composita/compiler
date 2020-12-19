import { Visitor } from './visitor';
import { SourceLocation } from '../source-location/location';
import { NameNode } from './name';
import { NonEmptyArray } from '@composita/ts-utility-types';
import { ExpressionNode } from './expression';
import { TypeNode } from './type';
import { OperandNode } from './operand';

enum DesignatorTag {
    Tag,
}
export abstract class DesignatorNode extends OperandNode {
    protected readonly _tag: DesignatorTag = DesignatorTag.Tag;
}

export class BasicDesignatorNode extends DesignatorNode {
    constructor(location: SourceLocation, private name: NameNode) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    accept(visitor: Visitor): void {
        visitor.visitBasicDesignator(this);
    }
}

export class BasicExpressionDesignatorNode extends DesignatorNode {
    constructor(location: SourceLocation, private name: NameNode, private expressions: NonEmptyArray<ExpressionNode>) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getExpressions(): NonEmptyArray<ExpressionNode> {
        return this.expressions;
    }

    accept(visitor: Visitor): void {
        visitor.visitBasicExpressionDesignator(this);
    }
}

export class BaseTargetDesignatorNode extends DesignatorNode {
    constructor(location: SourceLocation, private base: DesignatorNode, private target: DesignatorNode) {
        super(location);
    }

    getBase(): DesignatorNode {
        return this.base;
    }

    getTarget(): DesignatorNode {
        return this.target;
    }

    accept(visitor: Visitor): void {
        visitor.visitBaseTargetDesignator(this);
    }
}

export class DesignatorTypeNode extends DesignatorNode {
    constructor(location: SourceLocation, private designator: DesignatorNode, private type: TypeNode) {
        super(location);
    }

    getDesignator(): DesignatorNode {
        return this.designator;
    }

    getType(): TypeNode {
        return this.type;
    }

    accept(visitor: Visitor): void {
        visitor.visitDesignatorType(this);
    }
}
