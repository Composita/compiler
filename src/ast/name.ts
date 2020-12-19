import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';
import { ParameterNode } from './parameter';

export class NameNode extends Node {
    constructor(location: SourceLocation, private name: string) {
        super(location);
    }

    getName(): string {
        return this.name;
    }

    accept(visitor: Visitor): void {
        visitor.visitName(this);
    }
}

export class IndexedNameNode extends Node {
    constructor(location: SourceLocation, private name: string, private params: Array<ParameterNode>) {
        super(location);
    }

    getName(): string {
        return this.name;
    }

    getParams(): Array<ParameterNode> {
        return this.params;
    }

    accept(visitor: Visitor): void {
        visitor.visitIndexedName(this);
    }
}
