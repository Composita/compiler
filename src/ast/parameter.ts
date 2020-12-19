import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';
import { NonEmptyArray } from '@composita/ts-utility-types';
import { NameNode } from './name';
import { TypeNode } from './type';

export class ParameterNode extends Node {
    constructor(location: SourceLocation, private names: NonEmptyArray<NameNode>, private type: TypeNode) {
        super(location);
    }

    getNames(): NonEmptyArray<NameNode> {
        return this.names;
    }

    getType(): TypeNode {
        return this.type;
    }

    accept(visitor: Visitor): void {
        visitor.visitParameter(this);
    }
}
