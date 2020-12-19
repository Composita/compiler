import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';

export class CardinalityNode extends Node {
    constructor(location: SourceLocation, private min: number, private max: number) {
        super(location);
    }

    getMin(): number {
        return this.min;
    }

    getMax(): number {
        return this.max;
    }

    accept(visitor: Visitor): void {
        visitor.visitCardinality(this);
    }
}
