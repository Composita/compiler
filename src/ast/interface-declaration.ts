import { SourceLocation } from '../source-location/location';
import { Optional } from '@composita/ts-utility-types';
import { Node } from './node';
import { Visitor } from './visitor';
import { NameNode } from './name';
import { CardinalityNode } from './cardinality';

export abstract class InterfaceDeclarationNode extends Node {
    constructor(location: SourceLocation, private name: NameNode, private cardinality: Optional<CardinalityNode>) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getCardinality(): Optional<CardinalityNode> {
        return this.cardinality;
    }

    accept(visitor: Visitor): void {
        visitor.visitInterfaceDeclaration(this);
    }
}

enum OfferedInterfaceTag {
    Tag,
}
export class OfferedInterfaceNode extends InterfaceDeclarationNode {
    protected readonly _tag: OfferedInterfaceTag = OfferedInterfaceTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitOfferedInterface(this);
    }
}

enum RequiredInterfaceTag {
    Tag,
}
export class RequiredInterfaceNode extends InterfaceDeclarationNode {
    protected readonly _tag: RequiredInterfaceTag = RequiredInterfaceTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitRequiredInterfface(this);
    }
}
