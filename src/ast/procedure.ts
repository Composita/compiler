import { SourceLocation } from '../source-location/location';
import { Optional } from '@composita/ts-utility-types';
import { Visitor } from './visitor';
import { NameNode } from './name';
import { TypeNode } from './type';
import { StatementSequenceNode } from './statement-sequence';
import { ParameterNode } from './parameter';
import { DeclarationNode } from './declaration';
import { Node } from './node';

export class ProcedureNode extends DeclarationNode {
    constructor(
        location: SourceLocation,
        private name: NameNode,
        private params: Array<ProcedureParameterNode>,
        private type: Optional<TypeNode>,
        private declarations: Array<DeclarationNode>,
        private statements: Optional<StatementSequenceNode>,
    ) {
        super(location);
    }

    getName(): NameNode {
        return this.name;
    }

    getParams(): Array<ProcedureParameterNode> {
        return this.params;
    }

    getType(): Optional<TypeNode> {
        return this.type;
    }

    getDeclarations(): Array<DeclarationNode> {
        return this.declarations;
    }

    getStatements(): Optional<StatementSequenceNode> {
        return this.statements;
    }

    accept(visitor: Visitor): void {
        visitor.visitProcedure(this);
    }
}

export class ProcedureParameterNode extends Node {
    constructor(location: SourceLocation, private mutable: boolean, private parameter: ParameterNode) {
        super(location);
    }

    isMutable(): boolean {
        return this.mutable;
    }

    getParameter(): ParameterNode {
        return this.parameter;
    }

    accept(visitor: Visitor): void {
        visitor.visitProcedureParameter(this);
    }
}
