import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';
import { NonEmptyArray, Optional } from '@composita/ts-utility-types';
import { NameNode } from './name';
import { DeclarationNode } from './declaration';
import { ProtocolFactorNode } from './protocol-factor';

export class InterfaceNode extends DeclarationNode {
    constructor(location: SourceLocation, private name: NameNode, private protocol: ProtocolNode) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getProtocol(): ProtocolNode {
        return this.protocol;
    }

    accept(visitor: Visitor): void {
        visitor.visitInterface(this);
    }
}

export class ProtocolNode extends Node {
    constructor(location: SourceLocation, private expression: Optional<ProtocolExpressionNode>) {
        super(location);
    }

    getExpression(): Optional<ProtocolExpressionNode> {
        return this.expression;
    }

    accept(visitor: Visitor): void {
        visitor.visitProtocol(this);
    }
}

export class ProtocolExpressionNode extends Node {
    constructor(location: SourceLocation, private terms: NonEmptyArray<ProtocolTermNode>) {
        super(location);
    }

    getTerms(): NonEmptyArray<ProtocolTermNode> {
        return this.terms;
    }

    accept(visitor: Visitor): void {
        visitor.visitProtocolExpression(this);
    }
}

export class ProtocolTermNode extends Node {
    constructor(location: SourceLocation, private factors: NonEmptyArray<ProtocolFactorNode>) {
        super(location);
    }

    getFactors(): NonEmptyArray<ProtocolFactorNode> {
        return this.factors;
    }

    accept(visitor: Visitor): void {
        visitor.visitProtocolTerm(this);
    }
}
