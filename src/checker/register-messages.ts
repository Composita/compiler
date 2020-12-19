import {
    Visitor,
    MessageDeclarationNode,
    OptionalProtocolExpressionNode,
    GroupProtocolExpressionNode,
    RepeatingProtocolExpressionNode,
    ProtocolExpressionNode,
    ProtocolNode,
    ProtocolTermNode,
} from '../ast/ast';
import { SymbolTable, TypeSymbol, MessageSymbol, ScopeSymbolType } from '../symbols/symbols';
import { FixTypeNodeVisitor } from './fix-type-node';

export class MessageRegisterVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private readonly scope: ScopeSymbolType) {
        super();
    }

    visitProtocol(node: ProtocolNode): void {
        node.getExpression()?.accept(this);
    }

    visitProtocolTerm(node: ProtocolTermNode): void {
        node.getFactors().forEach((factor) => factor.accept(this));
    }

    visitMessageDeclaration(node: MessageDeclarationNode): void {
        const name = node.getName().getName();
        const paramSymbols: Array<TypeSymbol> = node.getParams().flatMap((param) => {
            param.getType().accept(new FixTypeNodeVisitor(this.symbolTable, this.scope));
            const type = this.symbolTable.typeToSymbol.get(param.getType());
            if (type === undefined) {
                throw new Error(`Type lookup for message '${name}' param failed.`);
            }
            return param.getNames().map(() => type);
        });
        const message = new MessageSymbol(this.scope, name, paramSymbols);
        this.symbolTable.registerMessage(message);
        this.symbolTable.messageToSymbol.set(node, message);
    }

    visitOptionalProtocolFactorExpression(node: OptionalProtocolExpressionNode): void {
        node.getExpression().accept(this);
    }

    visitGroupProtocolFactorExpression(node: GroupProtocolExpressionNode): void {
        node.getExpression().accept(this);
    }

    visitRepeatingProtocolFactorExpression(node: RepeatingProtocolExpressionNode): void {
        node.getExpression().accept(this);
    }

    visitProtocolExpression(node: ProtocolExpressionNode): void {
        node.getTerms().forEach((term) => term.accept(this));
    }
}
