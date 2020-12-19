import { SourceLocation } from '../source-location/location';
import { Visitor } from './visitor';

export abstract class Node {
    constructor(private location: SourceLocation) {}

    abstract accept(visitor: Visitor): void;

    getLocation(): SourceLocation {
        return this.location;
    }
}
