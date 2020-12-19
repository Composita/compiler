import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';
import { NameNode } from './name';

export class AttributeNode extends Node {
    constructor(location: SourceLocation, private name: NameNode) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    accept(visitor: Visitor): void {
        visitor.visitAttribute(this);
    }
}
