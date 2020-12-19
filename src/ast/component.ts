import { SourceLocation } from '../source-location/location';
import { Optional } from '@composita/ts-utility-types';
import { Visitor } from './visitor';
import { Node } from './node';
import { NameNode } from './name';
import { DeclarationNode } from './declaration';
import { StatementSequenceNode } from './statement-sequence';
import { ImplementationNode } from './implementation';
import { OfferedInterfaceNode, RequiredInterfaceNode } from './interface-declaration';
import { AttributeNode } from './attribute';

export class ComponentNode extends DeclarationNode {
    constructor(
        location: SourceLocation,
        private name: NameNode,
        private attributes: Array<AttributeNode>,
        private offers: Array<OfferedInterfaceNode>,
        private requires: Array<RequiredInterfaceNode>,
        private body: Optional<ComponentBodyNode>,
    ) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getAttributes(): Array<AttributeNode> {
        return this.attributes;
    }

    getOffers(): Array<OfferedInterfaceNode> {
        return this.offers;
    }

    getRequires(): Array<RequiredInterfaceNode> {
        return this.requires;
    }

    getBody(): Optional<ComponentBodyNode> {
        return this.body;
    }

    accept(visitor: Visitor): void {
        visitor.visitComponent(this);
    }
}

export class ComponentBodyNode extends Node {
    constructor(
        location: SourceLocation,
        private declarations: Array<DeclarationNode>,
        private implementations: Array<ImplementationNode>,
        private beginBlock: Optional<StatementSequenceNode>,
        private activityBlock: Optional<StatementSequenceNode>,
        private finallyBlock: Optional<StatementSequenceNode>,
    ) {
        super(location);
    }

    getDeclarations(): Array<DeclarationNode> {
        return this.declarations;
    }

    getImplementations(): Array<ImplementationNode> {
        return this.implementations;
    }

    getBeginBlock(): Optional<StatementSequenceNode> {
        return this.beginBlock;
    }

    getActivityBlock(): Optional<StatementSequenceNode> {
        return this.activityBlock;
    }

    getFinallyBlock(): Optional<StatementSequenceNode> {
        return this.finallyBlock;
    }

    accept(visitor: Visitor): void {
        visitor.visitComponentBody(this);
    }
}
