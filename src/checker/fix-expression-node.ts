import { getFirstOrThrow, getOrThrow } from '@composita/ts-utility-types';
import { type } from 'os';
import {
    Visitor,
    ConstantExpressionNode,
    UnaryExpressionNode,
    BinaryExpressionNode,
    OffersRequiresExpressionNode,
    TypeCheckExpressionNode,
    UnaryTermNode,
    TermChainNode,
    RightTermNode,
    FactorChainNode,
    RightFactorNode,
    UnaryFactorNode,
    ExpressionFactorNode,
    NumberNode,
    ConstantCharacterNode,
    TextNode,
    ReceiveTestNode,
    InputTestNode,
    ExistsTestNode,
    FunctionCallNode,
    ExpressionNode,
    BasicDesignatorNode,
    BasicExpressionDesignatorNode,
    BaseTargetDesignatorNode,
    DesignatorTypeNode,
    LogicalOperator,
    PrefixOperator,
    FactorPrefix,
    NameNode,
    AttributeNode,
    FixedMessagePattern,
    MessagePattern,
} from '../ast/ast';
import {
    SymbolTable,
    ScopeSymbolType,
    TypeSymbol,
    BuiltInTypeSymbol,
    SearchOptions,
    VariableSymbol,
    NamedScopeSymbol,
    ProcedureSymbol,
} from '../symbols/symbols';
import { FixTypeNodeVisitor } from './fix-type-node';
import { CheckerHelper } from './static-helpers';

export class FixExpressionNodeVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    private getType(node: ExpressionNode): TypeSymbol {
        const symbol = this.symbolTable.expressionToSymbol.get(node);
        return getOrThrow(symbol);
    }

    private getBuiltIn(typeName: string): TypeSymbol {
        return getFirstOrThrow(this.symbolTable.findBuiltIn(typeName));
    }

    private visitAttributes(attributes: Array<AttributeNode>): void {
        attributes.forEach((attr) => attr.accept(this));
    }

    visitConstantExpression(node: ConstantExpressionNode): void {
        node.getExpression().accept(this);
    }

    visitUnaryExpression(node: UnaryExpressionNode): void {
        node.getExpression().accept(this);
        this.symbolTable.expressionToSymbol.set(node, this.getType(node.getExpression()));
    }

    visitBinaryExpression(node: BinaryExpressionNode): void {
        node.getLeft().accept(this);
        node.getRight().accept(this);
        const leftType = this.getType(node.getLeft());
        const rightType = this.getType(node.getRight());
        this.checkChainMatch(leftType, rightType);

        if (!(leftType instanceof BuiltInTypeSymbol)) {
            throw new Error(`Cannot compare non number values.`);
        }
        const typeIdentifier = leftType.identifier;
        switch (node.getOp()) {
            case LogicalOperator.Equal:
            case LogicalOperator.NotEqual:
                if (
                    typeIdentifier !== 'REAL' &&
                    typeIdentifier !== 'INTEGER' &&
                    typeIdentifier !== 'BOOLEAN' &&
                    typeIdentifier !== 'CHARACTER' &&
                    typeIdentifier !== 'TEXT'
                ) {
                    throw new Error(`Cannot compare non number values.`);
                }
                break;
            case LogicalOperator.Less:
            case LogicalOperator.LessEqual:
            case LogicalOperator.More:
            case LogicalOperator.MoreEqual:
                if (
                    typeIdentifier !== 'REAL' &&
                    typeIdentifier !== 'INTEGER' &&
                    typeIdentifier !== 'CHARACTER' &&
                    typeIdentifier !== 'TEXT'
                ) {
                    throw new Error(`Cannot compare non number values.`);
                }
                break;
        }
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('BOOLEAN'));
    }

    visitOffersRequiresExpression(node: OffersRequiresExpressionNode): void {
        this.visitAttributes(node.getAttributes());
        node.getInterfaces().forEach((iface) => iface.accept(this));
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('BOOLEAN'));
    }

    visitTypeCheck(node: TypeCheckExpressionNode): void {
        this.visitAttributes(node.getAttributes());
        node.getDesignator().accept(this);
        node.getType().accept(this);
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('BOOLEAN'));
    }

    visitUnaryTermNode(node: UnaryTermNode): void {
        node.getTerm().accept(this);
        const type = this.getType(node.getTerm());
        if (!(type instanceof BuiltInTypeSymbol)) {
            throw new Error(`Cannot apply unary + - op to non builtin type.`);
        }
        const typeIdentifier = type.identifier;
        switch (node.getOp()) {
            case PrefixOperator.Minus:
            case PrefixOperator.Plus:
                if (typeIdentifier !== 'REAL' && typeIdentifier !== 'INTEGER') {
                    throw new Error(`Cannot apply + - to non numbers types.`);
                }
                break;
        }
        this.symbolTable.expressionToSymbol.set(node, this.getType(node.getTerm()));
    }

    checkChainMatch(left: TypeSymbol, ...right: Array<TypeSymbol>): void {
        const unique = new Array<TypeSymbol>(...new Set<TypeSymbol>(right));
        if (unique.length < 1) {
            throw new Error(`Failed right factor type lookup.`);
        }
        if (unique.length > 1) {
            throw new Error(`Ambiguous right factor type lookup.`);
        }
        if (unique[0] !== left) {
            throw new Error(`Factor type missmatch. Left: ${left.identifier}, Right: ${unique[0].identifier}`);
        }
    }

    getChainTypes(node: TermChainNode | FactorChainNode): Array<TypeSymbol> {
        if (node instanceof TermChainNode) {
            return node.getRight().map((right) => this.getType(right.getRight()));
        }
        return node.getRight().map((right) => this.getType(right.getRight()));
    }

    visitChain(node: TermChainNode | FactorChainNode): void {
        node.getLeft().accept(this);
        node.getRight().forEach((term: RightTermNode | RightFactorNode) => term.accept(this));
        const type = this.getType(node.getLeft());
        this.checkChainMatch(type, ...this.getChainTypes(node));
        this.symbolTable.expressionToSymbol.set(node, type);
    }

    visitTermChain(node: TermChainNode): void {
        this.visitChain(node);
    }

    visitRightTerm(node: RightTermNode): void {
        node.getRight().accept(this);
    }

    visitFactorChain(node: FactorChainNode): void {
        this.visitChain(node);
    }

    visitRightFactor(node: RightFactorNode): void {
        node.getRight().accept(this);
    }

    visitUnaryFactor(node: UnaryFactorNode): void {
        node.getFactor().accept(this);
        const type = this.getType(node.getFactor());
        if (!(type instanceof BuiltInTypeSymbol)) {
            throw new Error(`Cannot apply unary not op to non builtin type.`);
        }
        switch (node.getPrefix()) {
            case FactorPrefix.Not:
                if (type.identifier !== 'BOOLEAN') {
                    throw new Error(`Cannot apply not op to non boolean types.`);
                }
                break;
        }
        this.symbolTable.expressionToSymbol.set(node, this.getType(node.getFactor()));
    }

    visitExpressionFactor(node: ExpressionFactorNode): void {
        node.getExpression().accept(this);
        this.symbolTable.expressionToSymbol.set(node, this.getType(node.getExpression()));
    }

    visitIntegerNumber(node: NumberNode): void {
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('INTEGER'));
    }

    visitRealNumber(node: NumberNode): void {
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('REAL'));
    }

    visitConstantCharacter(node: ConstantCharacterNode): void {
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('CHARACTER'));
    }

    visitText(node: TextNode): void {
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('TEXT'));
    }

    getPatternName(pattern: MessagePattern): string {
        if (pattern instanceof NameNode) {
            return pattern.getName();
        }
        switch (pattern) {
            case FixedMessagePattern.Any:
                return this.symbolTable.anyMessage.identifier;
            case FixedMessagePattern.Finish:
                return this.symbolTable.finishMessage.identifier;
            default:
                throw new Error('Unknown message!');
        }
    }

    visitMessageTest(node: ReceiveTestNode | InputTestNode): void {
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('BOOLEAN'));
        node.getDesignator()?.accept(this);
        const pattern = node.getPattern();
        const message = CheckerHelper.getMessage(
            this.symbolTable,
            this.scope,
            node.getDesignator(),
            this.getPatternName(pattern),
            true,
            [],
        );
        this.symbolTable.patternToSymbol.set(pattern, message);
    }

    visitReceiveTest(node: ReceiveTestNode): void {
        this.visitMessageTest(node);
    }

    visitInputTest(node: InputTestNode): void {
        this.visitMessageTest(node);
    }

    visitExistsTest(node: ExistsTestNode): void {
        this.symbolTable.expressionToSymbol.set(node, this.getBuiltIn('BOOLEAN'));
        node.getDesignator()?.accept(this);
    }

    visitFunctionCall(node: FunctionCallNode): void {
        node.getArguments().forEach((expression) => expression.accept(this));
        const params = node.getArguments().map((expression) => this.getType(expression));
        const procedure = getFirstOrThrow(
            this.symbolTable.findProcedure(
                node.getName().getName(),
                params,
                undefined,
                new SearchOptions(this.scope, true, false),
            ),
        );
        this.symbolTable.expressionToSymbol.set(node, procedure.returnType);
        this.symbolTable.callToSymbol.set(node, procedure);
    }

    getProcedureParam(name: string): VariableSymbol {
        let localScope = this.scope;
        while (!(localScope instanceof ProcedureSymbol) && localScope instanceof NamedScopeSymbol) {
            // go up to procedure.
            localScope = localScope.scope;
        }
        if (!(localScope instanceof ProcedureSymbol)) {
            throw new Error(`${name} is not a procedure parameter.`);
        }

        const symbol = getFirstOrThrow(
            this.symbolTable.findVariable(name, new SearchOptions(localScope, false, false)),
        );
        if (!(symbol.scope instanceof ProcedureSymbol)) {
            throw new Error(`Found ${name} outside procedure param.`);
        }
        return symbol;
    }

    visitBasicDesignator(node: BasicDesignatorNode): void {
        const name = node.getName().getName();
        try {
            const variable = CheckerHelper.getVariable(
                this.symbolTable,
                node.getName().getName(),
                new SearchOptions(this.scope, false, true),
            );
            this.symbolTable.expressionToSymbol.set(node, variable.type);
            this.symbolTable.designatorToSymbol.set(node, variable);
            return;
        } catch (error) {
            // let's try something else
        }
        try {
            const constant = getFirstOrThrow(
                this.symbolTable.constants.filter((constant) => constant.identifier === name),
            );
            this.symbolTable.expressionToSymbol.set(node, constant.type);
            this.symbolTable.designatorToSymbol.set(node, constant.type);
            return;
        } catch (error) {
            // let's try somethign else...
        }
        try {
            const symbol = getFirstOrThrow(
                this.symbolTable.findInterface(name, new SearchOptions(this.scope, true, true)),
            );
            this.symbolTable.expressionToSymbol.set(node, symbol);
            this.symbolTable.designatorToSymbol.set(node, symbol);
            return;
        } catch (error) {
            // it must be something different...
        }
        try {
            const symbol = getFirstOrThrow(
                this.symbolTable.findComponent(name, new SearchOptions(this.scope, true, true)),
            );
            this.symbolTable.expressionToSymbol.set(node, symbol);
            this.symbolTable.designatorToSymbol.set(node, symbol);
            return;
        } catch (error) {
            // give it another go...
        }
        try {
            const symbol = getFirstOrThrow(
                this.symbolTable.findCollectionVariable(name, true, [], new SearchOptions(this.scope, true, false)),
            );
            this.symbolTable.expressionToSymbol.set(node, symbol.type);
            this.symbolTable.designatorToSymbol.set(node, symbol);
            return;
        } catch (error) {
            // one last try...
        }
        try {
            const symbol = this.getProcedureParam(name);
            this.symbolTable.expressionToSymbol.set(node, symbol.type);
            this.symbolTable.designatorToSymbol.set(node, symbol);
            return;
        } catch (error) {
            // giving up now..
        }
        throw new Error(`Failed designator type lookup for '${name}'.`);
    }

    visitBasicExpressionDesignator(node: BasicExpressionDesignatorNode): void {
        const name = node.getName().getName();
        try {
            node.getExpressions().forEach((expr) =>
                expr.accept(new FixExpressionNodeVisitor(this.symbolTable, this.scope)),
            );
            const types = node
                .getExpressions()
                .map((expr) => getOrThrow(this.symbolTable.expressionToSymbol.get(expr)));
            const variable = getFirstOrThrow(
                this.symbolTable.findCollectionVariable(name, false, types, new SearchOptions(this.scope, false, true)),
            );
            if (type instanceof BuiltInTypeSymbol && type.identifier === 'TEXT') {
                this.symbolTable.expressionToSymbol.set(
                    node,
                    getFirstOrThrow(this.symbolTable.findBuiltIn('CHARACTER')),
                );
            } else {
                this.symbolTable.expressionToSymbol.set(node, variable.type);
            }
            this.symbolTable.designatorToSymbol.set(node, variable);
            return;
        } catch (error) {
            // one more try...
        }
        try {
            const interfaceSymbol = getFirstOrThrow(
                this.symbolTable.findInterface(name, new SearchOptions(this.scope, true, true)),
            );
            this.symbolTable.expressionToSymbol.set(node, interfaceSymbol);
            this.symbolTable.designatorToSymbol.set(node, interfaceSymbol);
            return;
        } catch (error) {
            // it must be something different...
        }
        throw new Error(`Failed designator type lookup for '${name}'.`);
    }

    visitBaseTargetDesignator(node: BaseTargetDesignatorNode): void {
        const base = node.getBase();
        const target = node.getTarget();
        target.accept(this);
        if (base instanceof BasicDesignatorNode) {
            // potential function call
            const name = base.getName().getName();
            try {
                const procedure = CheckerHelper.getProcedure(
                    name,
                    this.symbolTable,
                    new Array<TypeSymbol>(this.getType(target)),
                    undefined,
                    new SearchOptions(this.scope, true, false),
                );
                this.symbolTable.expressionToSymbol.set(base, procedure);
                this.symbolTable.designatorToSymbol.set(node, procedure);
                this.symbolTable.expressionToSymbol.set(node, procedure.returnType);
                return;
            } catch (error) {
                // it was not a procedure...
            }
        }
        base.accept(this);
        const baseType = this.getType(base);
        this.symbolTable.expressionToSymbol.set(node, baseType);
        this.symbolTable.designatorToSymbol.set(node, baseType);
    }

    visitDesignatorType(node: DesignatorTypeNode): void {
        node.getDesignator().accept(this);
        node.getType().accept(new FixTypeNodeVisitor(this.symbolTable, this.scope));
    }
}
