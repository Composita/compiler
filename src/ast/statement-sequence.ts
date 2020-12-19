import { SourceLocation } from '../source-location/location';
import { NonEmptyArray } from '@composita/ts-utility-types';
import { AttributeNode } from './attribute';
import { Node } from './node';
import { StatementNode } from './statement';
import { Visitor } from './visitor';

export class StatementSequenceNode extends Node {
    constructor(
        location: SourceLocation,
        private attributes: Array<AttributeNode>,
        private statements: NonEmptyArray<StatementNode>,
    ) {
        super(location);
    }

    getAttributes(): Array<AttributeNode> {
        return this.attributes;
    }

    getStatements(): NonEmptyArray<StatementNode> {
        return this.statements;
    }

    accept(visitor: Visitor): void {
        visitor.visitStatementSequence(this);
    }
}
