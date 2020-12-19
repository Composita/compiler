import { SourceLocation } from '../source-location/location';
import { Visitor } from './visitor';
import { ExpressionNode } from './expression';
import { TermNode } from './term';

enum FactorTag {
    Tag,
}
export abstract class FactorNode extends TermNode {
    constructor(location: SourceLocation) {
        super(location);
    }

    accept(visitor: Visitor): void {
        visitor.visitFactor(this);
    }

    protected readonly _factorTag: FactorTag = FactorTag.Tag;
}

export enum FactorPrefix {
    Not,
}

export class UnaryFactorNode extends FactorNode {
    constructor(location: SourceLocation, private prefix: FactorPrefix, private factor: FactorNode) {
        super(location);
    }

    getPrefix(): FactorPrefix {
        return this.prefix;
    }

    getFactor(): FactorNode {
        return this.factor;
    }

    accept(visitor: Visitor): void {
        visitor.visitUnaryFactor(this);
    }
}

export class ExpressionFactorNode extends FactorNode {
    constructor(location: SourceLocation, private expresion: ExpressionNode) {
        super(location);
    }

    getExpression(): ExpressionNode {
        return this.expresion;
    }

    accept(visitor: Visitor): void {
        visitor.visitExpressionFactor(this);
    }
}
