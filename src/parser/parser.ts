import { Lexer } from '../lexer/lexer';
import {
    ProgramNode,
    ComponentNode,
    OfferedInterfaceNode,
    RequiredInterfaceNode,
    ComponentBodyNode,
    ImplementationNode,
    InterfaceNode,
    NameNode,
    StatementSequenceNode,
    AttributeNode,
    StatementNode,
    ProcedureCallNode,
    DeclarationNode,
    ExpressionNode,
    TextNode,
    ProtocolNode,
    ProtocolExpressionNode,
    ProtocolTermNode,
    ProtocolFactorNode,
    MessageDeclarationNode,
    MessageDirection,
    ParameterNode,
    GroupProtocolExpressionNode,
    CardinalityNode,
    InterfaceDeclarationNode,
    OptionalProtocolExpressionNode,
    RepeatingProtocolExpressionNode,
    TypeNode,
    BasicTypeNode,
    ProtocolFactorExpressionNode,
    ConstantListNode,
    VariableListNode,
    ProcedureNode,
    ConstantNode,
    ConstantExpressionNode,
    VariableNode,
    IndexedNameNode,
    ProcedureParameterNode,
    AnyTypeNode,
    DesignatorNode,
    BasicExpressionDesignatorNode,
    BasicDesignatorNode,
    DesignatorTypeNode,
    BaseTargetDesignatorNode,
    NewNode,
    ConnectNode,
    DisconnectNode,
    DeleteNode,
    AwaitNode,
    MoveNode,
    SendNode,
    ReceiveNode,
    AssignmentNode,
    IfNode,
    ForeachNode,
    StatementBlockNode,
    ReturnNode,
    WhileNode,
    RepeatNode,
    ForNode,
    ElseIfNode,
    ConstantCharacterNode,
    ExistsTestNode,
    InputTestNode,
    FunctionCallNode,
    MessagePattern,
    FixedMessagePattern,
    ReceiveTestNode,
    OperandNode,
    FactorNode,
    UnaryFactorNode,
    FactorPrefix,
    ExpressionFactorNode,
    SimpleExpressionNode,
    UnaryExpressionNode,
    UnaryTermNode,
    TermNode,
    InfixFactorOperator,
    FactorChainNode,
    RightFactorNode,
    RightTermNode,
    InfixTermOperator,
    PrefixOperator,
    LogicalOperator,
    BinaryExpressionNode,
    TermChainNode,
    OffersRequiresExpressionNode,
    OffersRequiresOperator,
    TypeCheckExpressionNode,
    RealNumberNode,
    IntegerNumberNode,
} from '../ast/ast';
import {
    FixToken,
    IdentifierToken,
    TextToken,
    Tag,
    IntegerNumberToken,
    Token,
    FloatNumberToken,
    HexNumberToken,
} from '../tokens/tokens';
import { SourceLocation } from '../source-location/location';
import { Optional, NonEmptyArray, Constructable3, Constructable2 } from '@composita/ts-utility-types';
import { Diagnosis, CompilerDiagnostic } from '../diagnosis/diagnosis';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { IdentifierKeywords } from './keywords';

export class Parser {
    constructor(private readonly diagnosis: Diagnosis, private lexer: Lexer) {}

    private hasTag(tag: Tag, n = 1): boolean {
        const token = this.lexer.peek(n);
        return this.isTaggedFixToken(token, tag);
    }

    private isTaggedFixToken(token: Token, tag: Tag) {
        return token instanceof FixToken && token.getTag() === tag;
    }

    private hasIdentifier(identifier: string): boolean {
        const token = this.lexer.peek(1);
        return token instanceof IdentifierToken && token.getIdentifier() === identifier;
    }

    private isComponent(): boolean {
        return this.hasTag(Tag.Component);
    }

    private isInterface(): boolean {
        return this.hasTag(Tag.Interface);
    }

    private isEOT(): boolean {
        return this.hasTag(Tag.EOT);
    }

    private error<T = void>(msg: string): T {
        const range = this.lexer.peek(1).getLocation().range;
        this.diagnosis.log(new CompilerDiagnostic(range, DiagnosticSeverity.Error, msg));
        throw new Error(
            `[${range.start.line},${range.start.character}:${range.end.line},${range.end.character}]: ${msg}`,
        );
    }

    private loop(predicate: () => boolean, body: () => void): void {
        while (predicate() && !this.isEOT()) {
            body();
        }
    }

    private expectConsumeFixToken(tag: Tag): void {
        if (!this.tryConsumeFixToken(tag)) {
            const msg = `Expected FixToken with Tag ${tag}`;
            this.error(msg);
        }
    }

    private tryConsumeFixToken(tag: Tag): boolean {
        if (!this.hasTag(tag)) {
            return false;
        }
        this.lexer.next();
        return true;
    }

    private expectConsumeIdentifierToken(identifier: string): void {
        if (!this.tryConsumeIdentifierToken(identifier)) {
            const msg = `Expected IdentifierToken with Identifier ${identifier}`;
            this.error(msg);
        }
    }

    private tryParse<T>(parser: () => T): Optional<T> {
        try {
            this.diagnosis.saveState();
            this.lexer.saveState();
            const variable = parser();
            this.lexer.popSaveState();
            return variable;
        } catch (error) {
            this.diagnosis.restoreState();
            this.lexer.restoreState();
            return undefined;
        }
    }

    private tryConsumeIdentifierToken(identifier: string): boolean {
        if (!this.hasIdentifier(identifier)) {
            return false;
        }
        this.lexer.next();
        return true;
    }

    private parseName(): NameNode {
        const next = this.lexer.peek(1);
        if (next instanceof IdentifierToken) {
            this.lexer.next();
            return new NameNode(next.getLocation(), next.getIdentifier());
        }
        const msg = 'Failed to parse identifier name';
        return this.error(msg);
    }

    private parseIndexedName(): IndexedNameNode {
        const next = this.lexer.peek(1);
        if (!(next instanceof IdentifierToken)) {
            return this.error('Failed to parse indexed name.');
        }
        this.lexer.next();
        if (this.tryConsumeFixToken(Tag.OpenSquareBracket)) {
            const params = this.parseParameterList();
            const end = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(Tag.CloseSquareBracket);
            return new IndexedNameNode(SourceLocation.merge(next.getLocation(), end), next.getIdentifier(), params);
        }
        return new IndexedNameNode(next.getLocation(), next.getIdentifier(), new Array<ParameterNode>());
    }

    private parseCardinality(): Optional<CardinalityNode> {
        if (!this.hasTag(Tag.OpenSquareBracket)) {
            return undefined;
        }
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.OpenSquareBracket);
        let next = this.lexer.next();
        if (!(next instanceof IntegerNumberToken)) {
            return this.error('Expected number token.');
        }
        const min = next.getNumber();
        let max: number = min;
        if (this.tryConsumeFixToken(Tag.Ellipsis)) {
            next = this.lexer.peek(1);
            if (next instanceof IntegerNumberToken) {
                this.lexer.next();
                max = next.getNumber();
            } else if (this.hasTag(Tag.Asterisk)) {
                this.lexer.next();
                max = Infinity;
            } else {
                this.error('Expected number or "*".');
            }
        }
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseSquareBracket);
        return new CardinalityNode(SourceLocation.merge(start, end), min, max);
    }

    private parseInterfaceDeclaration<T extends InterfaceDeclarationNode>(
        InterfaceDeclaration: Constructable3<T, SourceLocation, NameNode, Optional<CardinalityNode>>,
    ): T {
        const name = this.parseName();
        const cardinality = this.parseCardinality();
        const location =
            cardinality === undefined
                ? name.getLocation()
                : SourceLocation.merge(name.getLocation(), cardinality.getLocation());
        return new InterfaceDeclaration(location, name, cardinality);
    }

    private parseOfferedInterfaceDeclaration(): OfferedInterfaceNode {
        return this.parseInterfaceDeclaration(OfferedInterfaceNode);
    }

    private parseRequiredInterfaceDeclaration(): RequiredInterfaceNode {
        return this.parseInterfaceDeclaration(RequiredInterfaceNode);
    }

    private parseOffers(): Array<OfferedInterfaceNode> {
        const offered = new Array<OfferedInterfaceNode>();
        if (this.tryConsumeFixToken(Tag.Offers)) {
            offered.push(...this.parseOfferedInterfaceDeclarationList());
        }
        return offered;
    }

    private parseRequires(): Array<RequiredInterfaceNode> {
        const required = new Array<RequiredInterfaceNode>();
        if (this.tryConsumeFixToken(Tag.Requires)) {
            required.push(...this.parseRequiredInterfaceDeclarationList());
        }
        return required;
    }

    private parseFunctionCall(): FunctionCallNode {
        const name = this.parseName();
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const args = new Array<ExpressionNode>();
        if (!this.hasTag(Tag.CloseParentheses)) {
            args.push(...this.parseExpressionList());
        }
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new FunctionCallNode(SourceLocation.merge(name.getLocation(), end), name, args);
    }

    private parseMessagePattern(): MessagePattern {
        if (this.tryConsumeFixToken(Tag.Any)) {
            return FixedMessagePattern.Any;
        }
        if (this.tryConsumeFixToken(Tag.Finish)) {
            return FixedMessagePattern.Finish;
        }
        return this.parseName();
    }

    private tryParseExpression(): Optional<ExpressionNode> {
        return this.tryParse(this.parseExpression.bind(this));
    }

    private parseReceiveTestExpression(designator: Optional<DesignatorNode>): ReceiveTestNode {
        const start = designator?.getLocation() ?? this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.QuestionMark);
        const end = this.lexer.peek(1).getLocation();
        const pattern = this.parseMessagePattern();
        return new ReceiveTestNode(SourceLocation.merge(start, end), designator, pattern);
    }

    private parseInputTestExpression(): InputTestNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeIdentifierToken(IdentifierKeywords.Input);
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const designator = this.parseDesignator();
        if (!this.hasTag(Tag.Comma)) {
            if (designator instanceof BasicDesignatorNode) {
                const end = this.lexer.peek(1).getLocation();
                this.expectConsumeFixToken(Tag.CloseParentheses);
                return new InputTestNode(SourceLocation.merge(start, end), undefined, designator.getName());
            }
            this.error('Failed parsing input test node.');
        }
        this.expectConsumeFixToken(Tag.Comma);
        const pattern = this.parseMessagePattern();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new InputTestNode(SourceLocation.merge(start, end), designator, pattern);
    }

    private parseExistsExpression(): ExistsTestNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeIdentifierToken(IdentifierKeywords.Exists);
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const designator = this.parseDesignator();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new ExistsTestNode(SourceLocation.merge(start, end), designator);
    }

    private parseOperand(): OperandNode {
        const token = this.lexer.peek(1);
        if (token instanceof TextToken) {
            this.lexer.next();
            const text = token.getText();
            if (text.length === 1) {
                return new ConstantCharacterNode(token.getLocation(), text);
            }
            return new TextNode(token.getLocation(), text);
        }
        if (token instanceof IntegerNumberToken) {
            this.lexer.next();
            return new IntegerNumberNode(token.getLocation(), token.getNumber());
        }
        if (token instanceof HexNumberToken) {
            this.lexer.next();
            return new IntegerNumberNode(token.getLocation(), token.getNumber());
        }
        if (token instanceof FloatNumberToken) {
            this.lexer.next();
            return new RealNumberNode(token.getLocation(), token.getNumber());
        }
        if (this.hasIdentifier(IdentifierKeywords.Input)) {
            return this.parseInputTestExpression();
        }
        if (this.hasIdentifier(IdentifierKeywords.Exists)) {
            return this.parseExistsExpression();
        }
        const designator = this.tryParseDesignator();
        if (this.hasTag(Tag.QuestionMark)) {
            return this.parseReceiveTestExpression(designator);
        }
        if (designator === undefined) {
            return this.parseFunctionCall();
        }
        // we could still have a function call here, let this the checker handle.
        return designator;
    }

    private parseFactor(): FactorNode {
        const start = this.lexer.peek(1).getLocation();
        if (this.tryConsumeFixToken(Tag.Tilde)) {
            const node = this.parseFactor();
            return new UnaryFactorNode(SourceLocation.merge(start, node.getLocation()), FactorPrefix.Not, node);
        }
        if (this.tryConsumeFixToken(Tag.OpenParentheses)) {
            const expression = this.parseExpression();
            const end = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(Tag.CloseParentheses);
            return new ExpressionFactorNode(SourceLocation.merge(start, end), expression);
        }
        return this.parseOperand();
    }

    private isFactorInfix(): boolean {
        return (
            this.hasTag(Tag.Asterisk) ||
            this.hasTag(Tag.Slash) ||
            this.hasTag(Tag.Div) ||
            this.hasTag(Tag.Mod) ||
            this.hasTag(Tag.And)
        );
    }

    private parseFactorInfix(): InfixFactorOperator {
        if (this.tryConsumeFixToken(Tag.Asterisk)) {
            return InfixFactorOperator.Times;
        }
        if (this.tryConsumeFixToken(Tag.Slash)) {
            return InfixFactorOperator.Div;
        }
        if (this.tryConsumeFixToken(Tag.Div)) {
            return InfixFactorOperator.DivText;
        }
        if (this.tryConsumeFixToken(Tag.Mod)) {
            return InfixFactorOperator.ModText;
        }
        if (this.tryConsumeFixToken(Tag.And)) {
            return InfixFactorOperator.AndText;
        }
        return this.error('Failed to parse factor infix.');
    }

    private parseRightFactor(): RightFactorNode {
        const start = this.lexer.peek(1).getLocation();
        const op = this.parseFactorInfix();
        const rightFactor = this.parseFactor();
        return new RightFactorNode(SourceLocation.merge(start, rightFactor.getLocation()), op, rightFactor);
    }

    private parseTerm(): TermNode {
        const factor = this.parseFactor();
        if (!this.isFactorInfix()) {
            return factor;
        }

        const rightFactors = this.parseListWithPredicate(
            this.parseRightFactor.bind(this),
            this.isFactorInfix.bind(this),
        );

        return new FactorChainNode(
            SourceLocation.merge(factor.getLocation(), rightFactors[rightFactors.length - 1].getLocation()),
            factor,
            rightFactors,
        );
    }

    private isTermInfix(): boolean {
        return this.hasTag(Tag.Plus) || this.hasTag(Tag.Minus) || this.hasTag(Tag.Or);
    }

    private parseTermInfix(): InfixTermOperator {
        if (this.tryConsumeFixToken(Tag.Plus)) {
            return InfixTermOperator.Plus;
        }
        if (this.tryConsumeFixToken(Tag.Minus)) {
            return InfixTermOperator.Minus;
        }
        if (this.tryConsumeFixToken(Tag.Or)) {
            return InfixTermOperator.Or;
        }
        return this.error('Failed to parse term infix.');
    }

    private parseRightTerm(): RightTermNode {
        const start = this.lexer.peek(1).getLocation();
        const op = this.parseTermInfix();
        const rightTerm = this.parseTerm();
        return new RightTermNode(SourceLocation.merge(start, rightTerm.getLocation()), op, rightTerm);
    }

    private isTermPrefix(): boolean {
        return this.hasTag(Tag.Plus) || this.hasTag(Tag.Minus);
    }

    private parseUnaryPrefix(): PrefixOperator {
        if (this.tryConsumeFixToken(Tag.Plus)) {
            return PrefixOperator.Plus;
        }
        if (this.tryConsumeFixToken(Tag.Minus)) {
            return PrefixOperator.Minus;
        }
        return this.error('Failed to parse prefix operator.');
    }

    private parseUnaryTerm(): UnaryTermNode {
        const start = this.lexer.peek(1).getLocation();
        const op = this.parseUnaryPrefix();
        const term = this.parseTerm();
        return new UnaryTermNode(SourceLocation.merge(start, term.getLocation()), op, term);
    }

    private parseSimpleExpression(): SimpleExpressionNode {
        const left = this.isTermPrefix() ? this.parseUnaryTerm() : this.parseTerm();
        if (!this.isTermInfix()) {
            return left;
        }

        const rightTerms = this.parseListWithPredicate(this.parseRightTerm.bind(this), this.isTermInfix.bind(this));

        return new TermChainNode(
            SourceLocation.merge(left.getLocation(), rightTerms[rightTerms.length - 1].getLocation()),
            left,
            rightTerms,
        );
    }

    private isBinaryExpressionOperator(): boolean {
        return (
            this.hasTag(Tag.Equal) ||
            this.hasTag(Tag.NumberSign) ||
            this.hasTag(Tag.Less) ||
            this.hasTag(Tag.LessEqual) ||
            this.hasTag(Tag.Greater) ||
            this.hasTag(Tag.GreaterEqual)
        );
    }

    private parseBinaryExpressionOperator(): LogicalOperator {
        if (this.tryConsumeFixToken(Tag.Equal)) {
            return LogicalOperator.Equal;
        }
        if (this.tryConsumeFixToken(Tag.NumberSign)) {
            return LogicalOperator.NotEqual;
        }
        if (this.tryConsumeFixToken(Tag.Less)) {
            return LogicalOperator.Less;
        }
        if (this.tryConsumeFixToken(Tag.LessEqual)) {
            return LogicalOperator.LessEqual;
        }
        if (this.tryConsumeFixToken(Tag.Greater)) {
            return LogicalOperator.More;
        }
        if (this.tryConsumeFixToken(Tag.GreaterEqual)) {
            return LogicalOperator.MoreEqual;
        }
        return this.error('Failed to parse term infix.');
    }

    private parseBinaryExpression(
        start: SourceLocation,
        attributes: Array<AttributeNode>,
        left: SimpleExpressionNode,
    ): BinaryExpressionNode {
        const op = this.parseBinaryExpressionOperator();
        const right = this.parseSimpleExpression();
        return new BinaryExpressionNode(SourceLocation.merge(start, right.getLocation()), attributes, left, op, right);
    }

    private parseExpression(): ExpressionNode {
        const attributes = this.parseAttributeList();
        const simpleExpression = this.parseSimpleExpression();
        if (simpleExpression instanceof DesignatorNode) {
            const start = attributes.length === 0 ? simpleExpression.getLocation() : attributes[0].getLocation();
            if (this.tryConsumeFixToken(Tag.Offers)) {
                const offeredList = this.parseOfferedInterfaceDeclarationList();
                return new OffersRequiresExpressionNode(
                    SourceLocation.merge(start, offeredList[offeredList.length - 1].getLocation()),
                    attributes,
                    OffersRequiresOperator.Offers,
                    offeredList,
                );
            }
            if (this.tryConsumeFixToken(Tag.Requires)) {
                const requiredList = this.parseRequiredInterfaceDeclarationList();
                return new OffersRequiresExpressionNode(
                    SourceLocation.merge(start, requiredList[requiredList.length - 1].getLocation()),
                    attributes,
                    OffersRequiresOperator.Requires,
                    requiredList,
                );
            }
            if (this.tryConsumeFixToken(Tag.Is)) {
                const type = this.parseType();
                return new TypeCheckExpressionNode(
                    SourceLocation.merge(start, type.getLocation()),
                    attributes,
                    simpleExpression,
                    type,
                );
            }
            if (this.isBinaryExpressionOperator()) {
                return this.parseBinaryExpression(start, attributes, simpleExpression);
            }
            return simpleExpression;
        }

        const start = attributes.length === 0 ? simpleExpression.getLocation() : attributes[0].getLocation();
        if (!this.isBinaryExpressionOperator()) {
            return new UnaryExpressionNode(
                SourceLocation.merge(start, simpleExpression.getLocation()),
                attributes,
                simpleExpression,
            );
        }
        return this.parseBinaryExpression(start, attributes, simpleExpression);
    }

    private parseProcedureCall(): ProcedureCallNode {
        const name = this.parseName();
        const expressions = new Array<ExpressionNode>();
        let end = name.getLocation();
        if (this.tryConsumeFixToken(Tag.OpenParentheses)) {
            expressions.push(...this.parseExpressionList());
            end = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(Tag.CloseParentheses);
        }
        return new ProcedureCallNode(SourceLocation.merge(name.getLocation(), end), name, expressions);
    }

    private parseStatementSequenceBlock(tag: Tag): Optional<StatementSequenceNode> {
        let statements: Optional<StatementSequenceNode> = undefined;
        if (this.hasTag(tag)) {
            const beginStart = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(tag);
            statements = this.parseStatementSequence(beginStart);
        }
        return statements;
    }

    private parseBasicDesignator(): DesignatorNode {
        const name = this.parseName();
        if (this.tryConsumeFixToken(Tag.OpenSquareBracket)) {
            const expressions = this.parseExpressionList();
            const end = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(Tag.CloseSquareBracket);
            return new BasicExpressionDesignatorNode(SourceLocation.merge(name.getLocation(), end), name, expressions);
        }
        return new BasicDesignatorNode(name.getLocation(), name);
    }

    private parseDesignator(): DesignatorNode {
        const designator = this.parseBasicDesignator();
        if (this.tryConsumeFixToken(Tag.OpenParentheses)) {
            // if ANY we assume type otherwise designator.
            // see original CCParser implementation
            if (this.hasTag(Tag.Any)) {
                const type = this.parseType();
                const end = this.lexer.peek(1).getLocation();
                this.expectConsumeFixToken(Tag.CloseParentheses);
                return new DesignatorTypeNode(SourceLocation.merge(designator.getLocation(), end), designator, type);
            }
            const target = this.parseDesignator();
            const end = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(Tag.CloseParentheses);
            return new BaseTargetDesignatorNode(
                SourceLocation.merge(designator.getLocation(), end),
                designator,
                target,
            );
        }
        return designator;
    }

    private tryParseDesignator(): Optional<DesignatorNode> {
        return this.tryParse(this.parseDesignator.bind(this));
    }

    private parseStatementSequence(start: SourceLocation): StatementSequenceNode {
        const attributes = this.parseAttributeList();
        const statements = this.parseStatementList();
        const end = statements[statements.length - 1].getLocation();
        return new StatementSequenceNode(SourceLocation.merge(start, end), attributes, statements);
    }

    private parseNewStatement(): NewNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeIdentifierToken(IdentifierKeywords.New);
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const designator = this.parseDesignator();
        const args = new Array<ExpressionNode>();
        if (this.tryConsumeFixToken(Tag.Comma)) {
            args.push(...this.parseExpressionList());
        }
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new NewNode(SourceLocation.merge(start, end), designator, args);
    }

    private parseDeleteStatement(): DeleteNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeIdentifierToken(IdentifierKeywords.Delete);
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const designator = this.parseDesignator();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new DeleteNode(SourceLocation.merge(start, end), designator);
    }

    private parseConnectStatement(): ConnectNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeIdentifierToken(IdentifierKeywords.Conncet);
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const designator = this.parseDesignator();
        this.expectConsumeFixToken(Tag.Comma);
        const target = this.parseDesignator();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new ConnectNode(SourceLocation.merge(start, end), designator, target);
    }

    private parseDisconnectStatement(): DisconnectNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeIdentifierToken(IdentifierKeywords.Disconnect);
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const designator = this.parseDesignator();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new DisconnectNode(SourceLocation.merge(start, end), designator);
    }

    private parseMoveStatement(): MoveNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeIdentifierToken(IdentifierKeywords.Move);
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const designator = this.parseDesignator();
        this.expectConsumeFixToken(Tag.Comma);
        const target = this.parseDesignator();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new MoveNode(SourceLocation.merge(start, end), designator, target);
    }

    private parseAwaitStatement(): AwaitNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeIdentifierToken(IdentifierKeywords.Await);
        this.expectConsumeFixToken(Tag.OpenParentheses);
        const expression = this.parseExpression();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.CloseParentheses);
        return new AwaitNode(SourceLocation.merge(start, end), expression);
    }

    private parseSendStatement(designator: Optional<DesignatorNode>): SendNode {
        const start = designator?.getLocation() ?? this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.ExclamationMark);
        const name = this.parseName();
        const expressions = new Array<ExpressionNode>();
        let end = name.getLocation();
        if (this.tryConsumeFixToken(Tag.OpenParentheses)) {
            expressions.push(...this.parseExpressionList());
            end = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(Tag.CloseParentheses);
        }
        return new SendNode(SourceLocation.merge(start, end), designator, name, expressions);
    }

    private parseReceiveStatement(designator: Optional<DesignatorNode>): ReceiveNode {
        const start = designator?.getLocation() ?? this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.QuestionMark);
        const name = this.parseName();
        const designators = new Array<DesignatorNode>();
        let end = name.getLocation();
        if (this.tryConsumeFixToken(Tag.OpenParentheses)) {
            designators.push(...this.parseDesignatorList());
            end = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(Tag.CloseParentheses);
        }
        return new ReceiveNode(SourceLocation.merge(start, end), designator, name, designators);
    }

    private parseAssignmentStatement(designator: DesignatorNode): AssignmentNode {
        this.expectConsumeFixToken(Tag.ColonEqual);
        const expression = this.parseExpression();
        return new AssignmentNode(
            SourceLocation.merge(designator.getLocation(), expression.getLocation()),
            designator,
            expression,
        );
    }

    private parseReturnStatement(): ReturnNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Return);
        const expression = this.tryParseExpression();
        return new ReturnNode(SourceLocation.merge(start, expression?.getLocation() ?? start), expression);
    }

    private parseIfStatement(): IfNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.If);
        const expression = this.parseExpression();
        this.expectConsumeFixToken(Tag.Then);
        const sequence = this.parseStatementSequence(this.lexer.peek(1).getLocation());
        const elsIfs = new Array<ElseIfNode>();
        this.loop(
            () => this.hasTag(Tag.Elsif),
            () => {
                const start = this.lexer.peek(1).getLocation();
                this.expectConsumeFixToken(Tag.Elsif);
                const expression = this.parseExpression();
                this.expectConsumeFixToken(Tag.Then);
                const sequence = this.parseStatementSequence(this.lexer.peek(1).getLocation());
                elsIfs.push(new ElseIfNode(SourceLocation.merge(start, sequence.getLocation()), expression, sequence));
            },
        );
        let elseSequence: Optional<StatementSequenceNode> = undefined;
        if (this.tryConsumeFixToken(Tag.Else)) {
            elseSequence = this.parseStatementSequence(this.lexer.peek(1).getLocation());
        }
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.End);
        return new IfNode(SourceLocation.merge(start, end), expression, sequence, elsIfs, elseSequence);
    }

    private parseWhileStatement(): WhileNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.While);
        const expression = this.parseExpression();
        this.expectConsumeFixToken(Tag.Do);
        const sequence = this.parseStatementSequence(this.lexer.peek(1).getLocation());
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.End);
        return new WhileNode(SourceLocation.merge(start, end), expression, sequence);
    }

    private parseRepeatStatement(): RepeatNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Repeat);
        const sequence = this.parseStatementSequence(this.lexer.peek(1).getLocation());
        this.expectConsumeFixToken(Tag.Until);
        const expression = this.parseExpression();
        return new RepeatNode(SourceLocation.merge(start, expression.getLocation()), sequence, expression);
    }

    private parseForStatement(): ForNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.For);
        const designator = this.parseDesignator();
        this.expectConsumeFixToken(Tag.ColonEqual);
        const assignExpression = this.parseExpression();
        this.expectConsumeFixToken(Tag.To);
        const expression = this.parseExpression();
        let stride: Optional<ConstantExpressionNode> = undefined;
        if (this.tryConsumeFixToken(Tag.By)) {
            stride = this.parseConstantExpression();
        }
        this.expectConsumeFixToken(Tag.Do);
        const sequence = this.parseStatementSequence(this.lexer.peek(1).getLocation());
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.End);
        return new ForNode(
            SourceLocation.merge(start, end),
            designator,
            assignExpression,
            expression,
            stride,
            sequence,
        );
    }

    private parseForeachStatement(): ForeachNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Foreach);
        const designators = this.parseDesignatorList();
        this.expectConsumeFixToken(Tag.Of);
        const designator = this.parseDesignator();
        this.expectConsumeFixToken(Tag.Do);
        const sequence = this.parseStatementSequence(this.lexer.peek(1).getLocation());
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.End);
        return new ForeachNode(SourceLocation.merge(start, end), designators, designator, sequence);
    }

    private parseStatementBlock(): StatementBlockNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Begin);
        const sequence = this.parseStatementSequence(this.lexer.peek(1).getLocation());
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.End);
        return new StatementBlockNode(SourceLocation.merge(start, end), sequence);
    }

    private parseStatement(): StatementNode {
        if (this.hasIdentifier(IdentifierKeywords.New)) {
            return this.parseNewStatement();
        }
        if (this.hasIdentifier(IdentifierKeywords.Delete)) {
            return this.parseDeleteStatement();
        }
        if (this.hasIdentifier(IdentifierKeywords.Conncet)) {
            return this.parseConnectStatement();
        }
        if (this.hasIdentifier(IdentifierKeywords.Disconnect)) {
            return this.parseDisconnectStatement();
        }
        if (this.hasIdentifier(IdentifierKeywords.Move)) {
            return this.parseMoveStatement();
        }
        if (this.hasIdentifier(IdentifierKeywords.Await)) {
            return this.parseAwaitStatement();
        }
        if (this.hasTag(Tag.Return)) {
            return this.parseReturnStatement();
        }
        if (this.hasTag(Tag.If)) {
            return this.parseIfStatement();
        }
        if (this.hasTag(Tag.While)) {
            return this.parseWhileStatement();
        }
        if (this.hasTag(Tag.Repeat)) {
            return this.parseRepeatStatement();
        }
        if (this.hasTag(Tag.For)) {
            return this.parseForStatement();
        }
        if (this.hasTag(Tag.Foreach)) {
            return this.parseForeachStatement();
        }
        if (this.hasTag(Tag.Begin)) {
            return this.parseStatementBlock();
        }
        const designator = this.tryParseDesignator();
        if (this.hasTag(Tag.ExclamationMark)) {
            return this.parseSendStatement(designator);
        }
        if (this.hasTag(Tag.QuestionMark)) {
            return this.parseReceiveStatement(designator);
        }
        if (designator === undefined) {
            return this.parseProcedureCall();
        }
        if (this.hasTag(Tag.ColonEqual)) {
            return this.parseAssignmentStatement(designator);
        }
        if (designator instanceof BasicDesignatorNode) {
            return new ProcedureCallNode(designator.getLocation(), designator.getName(), new Array<ExpressionNode>());
        }
        if (designator instanceof BaseTargetDesignatorNode) {
            const base = designator.getBase();
            if (base instanceof BasicDesignatorNode) {
                return new ProcedureCallNode(
                    designator.getLocation(),
                    base.getName(),
                    new Array<ExpressionNode>(designator.getTarget()),
                );
            }
        }
        return this.error('Failed to parse statement. Unknown statement.');
    }

    private parseConstantExpression(): ConstantExpressionNode {
        const expression = this.parseExpression();
        return new ConstantExpressionNode(expression.getLocation(), expression);
    }

    private parseConstant(): ConstantNode {
        const name = this.parseName();
        this.expectConsumeFixToken(Tag.Equal);
        const expression = this.parseConstantExpression();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Semicolon);
        return new ConstantNode(SourceLocation.merge(name.getLocation(), end), name, expression);
    }

    private tryParseConstant(): Optional<ConstantNode> {
        return this.tryParse(this.parseConstant.bind(this));
    }

    private parseConstantList(): ConstantListNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Constant);
        const constants = new NonEmptyArray<ConstantNode>(this.parseConstant());
        let parsedConstant = true;
        this.loop(
            () => parsedConstant,
            () => {
                const constant = this.tryParseConstant();
                if (constant === undefined) {
                    parsedConstant = false;
                    return;
                }
                constants.push(constant);
            },
        );
        return new ConstantListNode(
            SourceLocation.merge(start, constants[constants.length - 1].getLocation()),
            constants,
        );
    }

    private parseVariable(): VariableNode {
        const start = this.lexer.peek(1).getLocation();
        const names = this.parseIndexedIdentifierList();
        this.expectConsumeFixToken(Tag.Colon);
        const type = this.parseType();
        const attributes = this.parseAttributeList();
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Semicolon);
        return new VariableNode(SourceLocation.merge(start, end), names, type, attributes);
    }

    private tryParseVariable(): Optional<VariableNode> {
        return this.tryParse(this.parseVariable.bind(this));
    }

    private parseVariableList(): VariableListNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Variable);
        const variables = new NonEmptyArray<VariableNode>(this.parseVariable());

        let parsedVariable = true;
        this.loop(
            () => parsedVariable,
            () => {
                const variable = this.tryParseVariable();
                if (variable === undefined) {
                    parsedVariable = false;
                    return;
                }
                variables.push(variable);
            },
        );

        return new VariableListNode(
            SourceLocation.merge(start, variables[variables.length - 1].getLocation()),
            variables,
        );
    }

    private parseProcedure(): ProcedureNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Procedure);
        const name = this.parseName();
        const params = new Array<ProcedureParameterNode>();
        if (this.tryConsumeFixToken(Tag.OpenParentheses)) {
            if (!this.hasTag(Tag.CloseParentheses)) {
                params.push(...this.parseProcedureParameterList());
            }
            this.expectConsumeFixToken(Tag.CloseParentheses);
        }
        const type = this.tryConsumeFixToken(Tag.Colon) ? this.parseType() : undefined;
        this.expectConsumeFixToken(Tag.Semicolon);
        const declarations = new Array<DeclarationNode>();
        let beginBlock: Optional<StatementSequenceNode> = undefined;
        let breakLoop = false;
        this.loop(
            () => !this.hasTag(Tag.End) && !breakLoop,
            () => {
                const declaration = this.parseDeclaration();
                if (declaration !== undefined) {
                    declarations.push(declaration);
                    return;
                }
                if (beginBlock === undefined) {
                    beginBlock = this.parseStatementSequenceBlock(Tag.Begin);
                    return;
                }
                breakLoop = true;
            },
        );
        const end = this.consumeEnd(name);
        return new ProcedureNode(SourceLocation.merge(start, end), name, params, type, declarations, beginBlock);
    }

    private parseDeclaration(): Optional<DeclarationNode> {
        if (this.hasTag(Tag.Component)) {
            return this.parseComponent();
        }
        if (this.hasTag(Tag.Interface)) {
            return this.parseInterface();
        }
        if (this.hasTag(Tag.Constant)) {
            return this.parseConstantList();
        }
        if (this.hasTag(Tag.Variable)) {
            return this.parseVariableList();
        }
        if (this.hasTag(Tag.Procedure)) {
            return this.parseProcedure();
        }
        return undefined;
    }

    private parseComponentBody(): Optional<ComponentBodyNode> {
        const start = this.lexer.peek(1).getLocation();
        let beginBlock: Optional<StatementSequenceNode> = undefined;
        let activityBlock: Optional<StatementSequenceNode> = undefined;
        let finallyBlock: Optional<StatementSequenceNode> = undefined;
        const declarations = new Array<DeclarationNode>();
        const implementations = new Array<ImplementationNode>();
        let end = start;
        let breakLoop = false;
        this.loop(
            () => !this.hasTag(Tag.End) && !breakLoop,
            () => {
                const declaration = this.parseDeclaration();
                if (declaration !== undefined) {
                    declarations.push(declaration);
                    return;
                }
                if (this.hasTag(Tag.Implementation)) {
                    implementations.push(this.parseImplementation());
                    return;
                }
                if (beginBlock !== undefined && this.hasTag(Tag.Begin)) {
                    this.error('Cannot have more than one begin per component.');
                }
                if (beginBlock === undefined && this.hasTag(Tag.Begin)) {
                    beginBlock = this.parseStatementSequenceBlock(Tag.Begin);
                    if (beginBlock !== undefined) {
                        end = beginBlock.getLocation();
                    }
                    return;
                }
                if (activityBlock !== undefined && this.hasTag(Tag.Activity)) {
                    this.error('Cannot have more than one activity per component.');
                }
                if (activityBlock === undefined && this.hasTag(Tag.Activity)) {
                    activityBlock = this.parseStatementSequenceBlock(Tag.Activity);
                    if (activityBlock !== undefined) {
                        end = activityBlock.getLocation();
                    }
                    return;
                }
                if (finallyBlock !== undefined && this.hasTag(Tag.Finally)) {
                    this.error('Cannot have more than one finally per component.');
                }
                if (finallyBlock === undefined && this.hasTag(Tag.Finally)) {
                    finallyBlock = this.parseStatementSequenceBlock(Tag.Finally);
                    if (finallyBlock !== undefined) {
                        end = finallyBlock.getLocation();
                    }
                    return;
                }
                if (this.hasTag(Tag.Component)) {
                    const component = this.parseComponent();
                    if (component !== undefined) {
                        declarations.push(component);
                    }
                    return;
                }
                if (this.hasTag(Tag.Implementation)) {
                    const implementation = this.parseImplementation();
                    if (implementation !== undefined) {
                        implementations.push(implementation);
                    }
                    return;
                }
                breakLoop = true;
            },
        );
        return new ComponentBodyNode(
            SourceLocation.merge(start, end),
            declarations,
            implementations,
            beginBlock,
            activityBlock,
            finallyBlock,
        );
    }

    private consumeEnd(name: NameNode): SourceLocation {
        this.expectConsumeFixToken(Tag.End);
        const endName = this.parseName();
        if (endName.getName() !== name.getName()) {
            this.error('Name missmatch.');
        }
        const end = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Semicolon);
        return end;
    }

    private parseComponent(): ComponentNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Component);
        const attributes = this.parseAttributeList();
        const name = this.parseName();
        const offers = this.parseOffers();
        const requires = this.parseRequires();
        this.expectConsumeFixToken(Tag.Semicolon);
        const body = this.parseComponentBody();
        const end = this.consumeEnd(name);
        return new ComponentNode(SourceLocation.merge(start, end), name, attributes, offers, requires, body);
    }

    private parseImplementation(): ImplementationNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Implementation);
        const name = this.parseName();
        this.expectConsumeFixToken(Tag.Semicolon);
        const declarations = this.parseDeclarationList();
        const statements = this.parseStatementSequenceBlock(Tag.Begin);
        const end = this.consumeEnd(name);
        return new ImplementationNode(SourceLocation.merge(start, end), name, declarations, statements);
    }

    private parseListWithPredicate<T>(parseFunction: () => T, pred: () => boolean): NonEmptyArray<T> {
        const list = new NonEmptyArray<T>(parseFunction());
        this.loop(
            () => pred(),
            () => {
                list.push(parseFunction());
            },
        );
        return list;
    }

    private parseList<T>(parseFunction: () => T, separator: Tag): NonEmptyArray<T> {
        const list = new NonEmptyArray<T>(parseFunction());
        this.loop(
            () => this.hasTag(separator),
            () => {
                this.expectConsumeFixToken(separator);
                list.push(parseFunction());
            },
        );
        return list;
    }

    private parseIdentifierList(): NonEmptyArray<NameNode> {
        return this.parseList<NameNode>(this.parseName.bind(this), Tag.Comma);
    }

    private parseParameterList(): NonEmptyArray<ParameterNode> {
        return this.parseList<ParameterNode>(this.parseParameter.bind(this), Tag.Semicolon);
    }

    private parseProcedureParameterList(): NonEmptyArray<ProcedureParameterNode> {
        return this.parseList<ProcedureParameterNode>(this.parseProcedureParameter.bind(this), Tag.Semicolon);
    }

    private parseIndexedIdentifierList(): NonEmptyArray<IndexedNameNode> {
        return this.parseList<IndexedNameNode>(this.parseIndexedName.bind(this), Tag.Comma);
    }

    private parseExpressionList(): NonEmptyArray<ExpressionNode> {
        return this.parseList<ExpressionNode>(this.parseExpression.bind(this), Tag.Comma);
    }

    private parseDesignatorList(): NonEmptyArray<DesignatorNode> {
        return this.parseList<DesignatorNode>(this.parseDesignator.bind(this), Tag.Comma);
    }

    private parseOfferedInterfaceDeclarationList(): NonEmptyArray<OfferedInterfaceNode> {
        return this.parseList<OfferedInterfaceNode>(this.parseOfferedInterfaceDeclaration.bind(this), Tag.Comma);
    }
    private parseRequiredInterfaceDeclarationList(): NonEmptyArray<RequiredInterfaceNode> {
        return this.parseList<RequiredInterfaceNode>(this.parseRequiredInterfaceDeclaration.bind(this), Tag.Comma);
    }

    private parseStatementList(): NonEmptyArray<StatementNode> {
        return this.parseList<StatementNode>(this.parseStatement.bind(this), Tag.Semicolon);
    }

    private parseAttributeList(): Array<AttributeNode> {
        if (!this.hasTag(Tag.OpenBrace)) {
            return new Array<AttributeNode>();
        }
        this.expectConsumeFixToken(Tag.OpenBrace);
        const names = this.parseIdentifierList();
        this.expectConsumeFixToken(Tag.CloseBrace);
        return names.map((name) => new AttributeNode(name.getLocation(), name));
    }

    private parseDeclarationList(): Array<DeclarationNode> {
        const declarations = new Array<DeclarationNode>();
        let foundDeclaration = true;
        this.loop(
            () => foundDeclaration,
            () => {
                const declaration = this.parseDeclaration();
                if (declaration === undefined) {
                    foundDeclaration = false;
                    return;
                }
                declarations.push(declaration);
            },
        );
        return declarations;
    }

    private parseType(): TypeNode {
        const next = this.lexer.peek(1);
        if (next instanceof IdentifierToken) {
            this.lexer.next();
            return new BasicTypeNode(next.getLocation(), next.getIdentifier());
        }
        this.expectConsumeFixToken(Tag.Any);
        const offered = new Array<OfferedInterfaceNode>();
        const required = new Array<RequiredInterfaceNode>();
        if (this.tryConsumeFixToken(Tag.OpenParentheses)) {
            offered.push(...this.parseOfferedInterfaceDeclarationList());
            if (this.tryConsumeFixToken(Tag.Pipe)) {
                required.push(...this.parseRequiredInterfaceDeclarationList());
            }
            this.expectConsumeFixToken(Tag.CloseParentheses);
        }
        return new AnyTypeNode(next.getLocation(), offered, required);
    }

    private parseParameter(): ParameterNode {
        const names = this.parseIdentifierList();
        this.expectConsumeFixToken(Tag.Colon);
        const type = this.parseType();
        return new ParameterNode(SourceLocation.merge(names[0].getLocation(), type.getLocation()), names, type);
    }

    private parseProcedureParameter(): ProcedureParameterNode {
        const mutable = this.hasTag(Tag.Variable);
        const start = this.lexer.peek(1).getLocation();
        if (mutable) {
            this.expectConsumeFixToken(Tag.Variable);
        }
        const param = this.parseParameter();
        return new ProcedureParameterNode(SourceLocation.merge(start, param.getLocation()), mutable, param);
    }

    private parseMessageParameters(): Array<ParameterNode> {
        if (this.tryConsumeFixToken(Tag.OpenParentheses)) {
            const params = this.parseParameterList();
            this.expectConsumeFixToken(Tag.CloseParentheses);
            return params;
        }
        return new Array<ParameterNode>();
    }

    private parseMessageDeclaration(): MessageDeclarationNode {
        const start = this.lexer.peek(1).getLocation();
        let direction: Optional<MessageDirection> = undefined;
        if (this.tryConsumeFixToken(Tag.In)) {
            direction = MessageDirection.IN;
        }
        if (this.tryConsumeFixToken(Tag.Out)) {
            direction = MessageDirection.OUT;
        }
        if (direction === undefined) {
            return this.error('Message declarations must have a direction.');
        }
        const name = this.parseName();
        const params = this.parseMessageParameters();
        return new MessageDeclarationNode(start, direction, name, params);
    }

    private parseProtocolTermExpression<T extends ProtocolFactorExpressionNode>(
        TermExpression: Constructable2<T, SourceLocation, ProtocolExpressionNode>,
        startTag: Tag,
        endTag: Tag,
    ): T {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(startTag);
        const expression = this.parseProtocolExpression();
        if (expression !== undefined) {
            const end = this.lexer.peek(1).getLocation();
            this.expectConsumeFixToken(endTag);
            return new TermExpression(SourceLocation.merge(start, end), expression);
        }
        return this.error('Failed to parse protocol term expression.');
    }

    private parseProtocolTerm(): ProtocolTermNode {
        const start = this.lexer.peek(1).getLocation();
        const factors = new Array<ProtocolFactorNode>();
        this.loop(
            () =>
                this.hasTag(Tag.In) ||
                this.hasTag(Tag.Out) ||
                this.hasTag(Tag.OpenSquareBracket) ||
                this.hasTag(Tag.OpenParentheses) ||
                this.hasTag(Tag.OpenBrace),
            () => {
                if (this.hasTag(Tag.In) || this.hasTag(Tag.Out)) {
                    factors.push(this.parseMessageDeclaration());
                    return;
                }
                if (this.hasTag(Tag.OpenSquareBracket)) {
                    const factor = this.parseProtocolTermExpression(
                        OptionalProtocolExpressionNode,
                        Tag.OpenSquareBracket,
                        Tag.CloseSquareBracket,
                    );
                    factors.push(factor);
                    return;
                }
                if (this.hasTag(Tag.OpenParentheses)) {
                    const factor = this.parseProtocolTermExpression(
                        GroupProtocolExpressionNode,
                        Tag.OpenParentheses,
                        Tag.CloseParentheses,
                    );
                    factors.push(factor);
                    return;
                }
                if (this.hasTag(Tag.OpenBrace)) {
                    const factor = this.parseProtocolTermExpression(
                        RepeatingProtocolExpressionNode,
                        Tag.OpenBrace,
                        Tag.CloseBrace,
                    );
                    factors.push(factor);
                    return;
                }
            },
        );
        const termFactors = NonEmptyArray.fromArray<ProtocolFactorNode>(factors);
        if (termFactors === undefined) {
            return this.error('At least one term factor needed.');
        }
        return new ProtocolTermNode(start, termFactors);
    }

    private parseProtocolExpression(): Optional<ProtocolExpressionNode> {
        const start = this.lexer.peek(1).getLocation();
        if (this.hasTag(Tag.End)) {
            return undefined;
        }
        const terms = new NonEmptyArray<ProtocolTermNode>(this.parseProtocolTerm());
        this.loop(
            () => this.hasTag(Tag.Pipe),
            () => {
                this.expectConsumeFixToken(Tag.Pipe);
                terms.push(this.parseProtocolTerm());
            },
        );
        return new ProtocolExpressionNode(start, terms);
    }

    private parseProtocol(): ProtocolNode {
        const start = this.lexer.peek(1).getLocation();
        const expression = this.parseProtocolExpression();
        return new ProtocolNode(
            expression === undefined ? start : SourceLocation.merge(start, expression.getLocation()),
            expression,
        );
    }

    private parseInterface(): InterfaceNode {
        const start = this.lexer.peek(1).getLocation();
        this.expectConsumeFixToken(Tag.Interface);
        const name = this.parseName();
        this.expectConsumeFixToken(Tag.Semicolon);
        const protocol = this.parseProtocol();
        const end = this.consumeEnd(name);
        return new InterfaceNode(SourceLocation.merge(start, end), name, protocol);
    }

    parse(): ProgramNode {
        const start = this.lexer.peek(1).getLocation();
        const components = new Array<ComponentNode>();
        const interfaces = new Array<InterfaceNode>();
        let breakLoop = false;
        this.loop(
            () => !breakLoop,
            () => {
                if (this.isComponent()) {
                    const component = this.parseComponent();
                    if (component !== undefined) {
                        components.push(component);
                    }
                    return;
                }
                if (this.isInterface()) {
                    const interfaceDeclaration = this.parseInterface();
                    if (interfaceDeclaration !== undefined) {
                        interfaces.push(interfaceDeclaration);
                    }
                    return;
                }
                this.error('Invalid top level node.');
                breakLoop = true;
            },
        );
        const end = this.lexer.peek(1).getLocation();
        return new ProgramNode(SourceLocation.merge(start, end), components, interfaces);
    }
}
