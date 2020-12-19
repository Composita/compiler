import { SourceLocation } from '../source-location/location';
import { Visitor } from './visitor';
import { NameNode } from './name';
import { DesignatorNode } from './designator';
import { Optional } from '@composita/ts-utility-types';
import { FactorNode } from './factor';
import { ExpressionNode } from './expression';

export abstract class OperandNode extends FactorNode {
    constructor(location: SourceLocation) {
        super(location);
    }

    accept(visitor: Visitor): void {
        visitor.visitOperand(this);
    }
}

export abstract class NumberNode extends OperandNode {
    constructor(location: SourceLocation, private value: number) {
        super(location);
    }

    getValue(): number {
        return this.value;
    }

    accept(visitor: Visitor): void {
        visitor.visitNumber(this);
    }
}

enum IntegerNumberTag {
    Tag,
}
export class IntegerNumberNode extends NumberNode {
    protected readonly _integerNumberTag: IntegerNumberTag = IntegerNumberTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitIntegerNumber(this);
    }
}

enum RealNumberTag {
    Tag,
}
export class RealNumberNode extends NumberNode {
    protected readonly _realNumberTag: RealNumberTag = RealNumberTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitRealNumber(this);
    }
}

export class ConstantCharacterNode extends OperandNode {
    constructor(location: SourceLocation, private character: string) {
        super(location);
    }

    getCharacter(): string {
        return this.character;
    }

    accept(visitor: Visitor): void {
        visitor.visitConstantCharacter(this);
    }
}

export class TextNode extends OperandNode {
    constructor(location: SourceLocation, private text: string) {
        super(location);
    }

    getText(): string {
        return this.text;
    }

    accept(visitor: Visitor): void {
        visitor.visitText(this);
    }
}

export enum FixedMessagePattern {
    Any,
    Finish,
}
export type MessagePattern = NameNode | FixedMessagePattern;

export abstract class InputReceiveTestNode extends OperandNode {
    constructor(
        location: SourceLocation,
        private designator: Optional<DesignatorNode>,
        private pattern: MessagePattern,
    ) {
        super(location);
    }

    getDesignator(): Optional<DesignatorNode> {
        return this.designator;
    }

    getPattern(): MessagePattern {
        return this.pattern;
    }
}

enum ReceiveTestTag {
    Tag,
}
export class ReceiveTestNode extends InputReceiveTestNode {
    protected readonly _tag: ReceiveTestTag = ReceiveTestTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitReceiveTest(this);
    }
}

enum InputTestTag {
    Tag,
}
export class InputTestNode extends InputReceiveTestNode {
    protected readonly _tag: InputTestTag = InputTestTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitInputTest(this);
    }
}

export class ExistsTestNode extends OperandNode {
    constructor(location: SourceLocation, private designator: DesignatorNode) {
        super(location);
    }

    getDesignator(): DesignatorNode {
        return this.designator;
    }

    accept(visitor: Visitor): void {
        visitor.visitExistsTest(this);
    }
}

export class FunctionCallNode extends OperandNode {
    constructor(location: SourceLocation, private name: NameNode, private args: Array<ExpressionNode>) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getArguments(): Array<ExpressionNode> {
        return this.args;
    }

    accept(visitor: Visitor): void {
        visitor.visitFunctionCall(this);
    }
}
