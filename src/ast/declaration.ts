import { Node } from './node';
import { Visitor } from './visitor';

enum DeclarationNodeTag {
    Tag,
}
export abstract class DeclarationNode extends Node {
    protected readonly _tag: DeclarationNodeTag = DeclarationNodeTag.Tag;

    accept(visitor: Visitor): void {
        visitor.visitDeclaration(this);
    }
}
