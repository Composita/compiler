import { SourceLocation } from '../source-location/location';
import { Optional } from '@composita/ts-utility-types';
import { Node } from './node';
import { Visitor } from './visitor';
import { NameNode } from './name';
import { DeclarationNode } from './declaration';
import { StatementSequenceNode } from './statement-sequence';

export class ImplementationNode extends Node {
    constructor(
        location: SourceLocation,
        private name: NameNode,
        private declarations: Array<DeclarationNode>,
        private statements: Optional<StatementSequenceNode>,
    ) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getDeclarations(): Array<DeclarationNode> {
        return this.declarations;
    }

    getStatements(): Optional<StatementSequenceNode> {
        return this.statements;
    }

    accept(visitor: Visitor): void {
        visitor.visitImplementation(this);
    }
}
