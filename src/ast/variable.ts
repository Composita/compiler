import { SourceLocation } from '../source-location/location';
import { NonEmptyArray } from '@composita/ts-utility-types';
import { Node } from './node';
import { Visitor } from './visitor';
import { TypeNode } from './type';
import { DeclarationNode } from './declaration';
import { IndexedNameNode } from './name';
import { AttributeNode } from './attribute';

export class VariableNode extends Node {
    constructor(
        location: SourceLocation,
        private names: NonEmptyArray<IndexedNameNode>,
        private type: TypeNode,
        private attributes: Array<AttributeNode>,
    ) {
        super(location);
    }

    getNames(): NonEmptyArray<IndexedNameNode> {
        return this.names;
    }

    getType(): TypeNode {
        return this.type;
    }

    getAttributes(): Array<AttributeNode> {
        return this.attributes;
    }

    accept(visitor: Visitor): void {
        visitor.visitVariable(this);
    }
}

export class VariableListNode extends DeclarationNode {
    constructor(location: SourceLocation, private variables: NonEmptyArray<VariableNode>) {
        super(location);
    }

    getVariables(): NonEmptyArray<VariableNode> {
        return this.variables;
    }

    accept(visitor: Visitor): void {
        visitor.visitVariableList(this);
    }
}
