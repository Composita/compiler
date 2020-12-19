import { SourceLocation } from '../source-location/location';
import { Node } from './node';
import { Visitor } from './visitor';
import { ComponentNode } from './component';
import { InterfaceNode } from './interface';

export class ProgramNode extends Node {
    constructor(
        location: SourceLocation,
        private components: Array<ComponentNode>,
        private interfaces: Array<InterfaceNode>,
    ) {
        super(location);
    }

    getComponents(): Array<ComponentNode> {
        return this.components;
    }

    getInterfaces(): Array<InterfaceNode> {
        return this.interfaces;
    }

    accept(visitor: Visitor): void {
        visitor.visitProgram(this);
    }
}
