import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';
import { RequiredInterfaceNode, OfferedInterfaceNode } from './interface-declaration';

enum TypeTag {
    Tag,
}
export abstract class TypeNode extends Node {
    protected readonly _tag: TypeTag = TypeTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitType(this);
    }
}

export class BasicTypeNode extends TypeNode {
    constructor(location: SourceLocation, private identifier: string) {
        super(location);
    }

    getIdentifier(): string {
        return this.identifier;
    }

    accept(visitor: Visitor): void {
        visitor.visitBasicType(this);
    }
}

export class AnyTypeNode extends TypeNode {
    constructor(
        location: SourceLocation,
        private offered: Array<OfferedInterfaceNode>,
        private required: Array<RequiredInterfaceNode>,
    ) {
        super(location);
    }

    getOffered(): Array<OfferedInterfaceNode> {
        return this.offered;
    }

    getRequired(): Array<RequiredInterfaceNode> {
        return this.required;
    }

    accept(visitor: Visitor): void {
        visitor.visitAnyType(this);
    }
}
