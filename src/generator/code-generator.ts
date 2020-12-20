import {
    Visitor,
    StatementSequenceNode,
    ProcedureCallNode,
    AssignmentNode,
    NewNode,
    ConnectNode,
    DisconnectNode,
    SendNode,
    ReceiveNode,
    DeleteNode,
    MoveNode,
    AwaitNode,
    ReturnNode,
    IfNode,
    WhileNode,
    RepeatNode,
    StatementBlockNode,
    ImplementationNode,
    ComponentBodyNode,
    ProcedureNode,
    IntegerNumberNode,
    RealNumberNode,
    ConstantCharacterNode,
    TextNode,
    UnaryExpressionNode,
    BinaryExpressionNode,
    LogicalOperator,
    UnaryTermNode,
    TermChainNode,
    RightTermNode,
    PrefixOperator,
    InfixTermOperator,
    UnaryFactorNode,
    ExpressionFactorNode,
    FactorPrefix,
    FactorChainNode,
    RightFactorNode,
    InfixFactorOperator,
    FunctionCallNode,
    BasicDesignatorNode,
    TypeCheckExpressionNode,
    AttributeNode,
    ReceiveTestNode,
    ForNode,
    ForeachNode,
    BaseTargetDesignatorNode,
    InputTestNode,
    ExistsTestNode,
    ConstantListNode,
    VariableListNode,
} from '../ast/ast';
import { Instruction, OperatorCode, SystemCallOperator } from '@composita/il';
import {
    SymbolTable,
    ScopeSymbolType,
    ComponentSymbol,
    ProcedureSymbol,
    BuiltInTypeSymbol,
    VariableSymbol,
    InterfaceSymbol,
    CollectionVariableSymbol,
    ImplementationSymbol,
} from '../symbols/symbols';
import { Metadata } from './metadata';
import { ILAssembler } from './il-assembler';
import { getOrThrow } from '@composita/ts-utility-types';
import { Generator } from './generator';

export class CodeGeneratorVisitor extends Visitor {
    constructor(protected symbols: SymbolTable, public scope: ScopeSymbolType, protected metadata: Metadata) {
        super();
    }

    private assembler: ILAssembler = new ILAssembler();

    getInstructions(): Array<Instruction> {
        return this.assembler.complete();
    }

    visitBasicDesignator(node: BasicDesignatorNode): void {
        const name = node.getName().getName();
        const symbol = getOrThrow(this.symbols.designatorToSymbol.get(node));

        if (symbol instanceof BuiltInTypeSymbol && symbol.scope === this.symbols.globalScope) {
            switch (name) {
                case 'FALSE':
                    this.assembler.emitLoadBoolean(false);
                    return;
                case 'TRUE':
                    this.assembler.emitLoadBoolean(true);
                    return;
                case 'PI':
                    this.assembler.emitLoadFloat(Math.PI);
                    return;
            }
        }

        if (symbol instanceof VariableSymbol || symbol instanceof CollectionVariableSymbol) {
            const variable = this.metadata.findVariable(symbol);
            this.assembler.emit(OperatorCode.LoadVariable, variable);
            return;
        }

        if (symbol instanceof InterfaceSymbol) {
            const interfaceDescriptor = this.metadata.findInterface(symbol);
            this.assembler.emit(OperatorCode.LoadService, interfaceDescriptor);
            return;
        }

        throw Error(`Unsupported BasicDesignatorNode ${name}`);
    }

    visitBaseTargetDesignator(node: BaseTargetDesignatorNode): void {
        const symbol = this.symbols.designatorToSymbol.get(node);
        if (symbol === undefined) {
            throw new Error(`Failed base target designator node lookup.`);
        }
        node.getTarget().accept(this);
        if (symbol instanceof ProcedureSymbol) {
            this.handleCall(symbol);
            return;
        }

        node.getBase().accept(this);
    }

    visitAttribute(node: AttributeNode): void {
        switch (node.getName().getName()) {
            case 'SHARED':
                this.assembler.emit(OperatorCode.AcquireShared);
                break;
            case 'EXCLUSIVE':
                this.assembler.emit(OperatorCode.AcquireExclusive);
                break;
        }
    }

    handleLockRelease(node: AttributeNode): void {
        switch (node.getName().getName()) {
            case 'SHARED':
                this.assembler.emit(OperatorCode.ReleaseShared);
                break;
            case 'EXCLUSIVE':
                this.assembler.emit(OperatorCode.ReleaseExclusive);
                break;
        }
    }

    visitStatementSequence(node: StatementSequenceNode): void {
        node.getAttributes().forEach((attribute) => attribute.accept(this));
        node.getStatements().forEach((statement) => statement.accept(this));
        node.getAttributes().forEach((attribute) => this.handleLockRelease(attribute));
    }

    handleSystemCall(procedure: ProcedureSymbol): boolean {
        const name = procedure.identifier;
        const numberOfParams = procedure.parameters.length;
        if (procedure.scope !== this.symbols.globalScope) {
            return false;
        }
        switch (name) {
            case 'WRITELINE':
                this.assembler.emitSystemCall(SystemCallOperator.WriteLine, numberOfParams);
                return true;
            case 'ASSERT':
                this.assembler.emitSystemCall(SystemCallOperator.Assert, numberOfParams);
                return true;
            case 'HALT':
                this.assembler.emitSystemCall(SystemCallOperator.Halt, numberOfParams);
                return true;
            case 'INC':
                this.assembler.emitSystemCall(SystemCallOperator.Inc, numberOfParams);
                return true;
            case 'DEC':
                this.assembler.emitSystemCall(SystemCallOperator.Dec, numberOfParams);
                return true;
            case 'PASSIVATE':
                this.assembler.emitSystemCall(SystemCallOperator.Passivate, numberOfParams);
                return true;
            case 'WRITE':
                this.assembler.emitSystemCall(SystemCallOperator.Write, numberOfParams);
                return true;
            case 'WRITEHEX':
                this.assembler.emitSystemCall(SystemCallOperator.WriteHex, numberOfParams);
                return true;
            case 'COUNT':
                this.assembler.emitSystemCall(SystemCallOperator.Count, numberOfParams);
                return true;
            case 'LENGTH':
                this.assembler.emitSystemCall(SystemCallOperator.Length, numberOfParams);
                return true;
            case 'SQRT':
                this.assembler.emitSystemCall(SystemCallOperator.Sqrt, numberOfParams);
                return true;
            case 'SIN':
                this.assembler.emitSystemCall(SystemCallOperator.Sin, numberOfParams);
                return true;
            case 'COS':
                this.assembler.emitSystemCall(SystemCallOperator.Cos, numberOfParams);
                return true;
            case 'TAN':
                this.assembler.emitSystemCall(SystemCallOperator.Tan, numberOfParams);
                return true;
            case 'ARCSIN':
                this.assembler.emitSystemCall(SystemCallOperator.ArcSin, numberOfParams);
                return true;
            case 'ARCCOS':
                this.assembler.emitSystemCall(SystemCallOperator.ArcCos, numberOfParams);
                return true;
            case 'ARCTAN':
                this.assembler.emitSystemCall(SystemCallOperator.ArcTan, numberOfParams);
                return true;
            case 'MIN':
                this.assembler.emitSystemCall(SystemCallOperator.Min, numberOfParams);
                return true;
            case 'MAX':
                this.assembler.emitSystemCall(SystemCallOperator.Max, numberOfParams);
                return true;
            case 'CHARACTER':
                this.assembler.emitSystemCall(SystemCallOperator.ToCharacter, numberOfParams);
                return true;
            case 'INTEGER':
                this.assembler.emitSystemCall(SystemCallOperator.ToInteger, numberOfParams);
                return true;
            case 'REAL':
                this.assembler.emitSystemCall(SystemCallOperator.ToReal, numberOfParams);
                return true;
            case 'TEXT':
                this.assembler.emitSystemCall(SystemCallOperator.ToText, numberOfParams);
                return true;
            case 'RANDOM':
                this.assembler.emitSystemCall(SystemCallOperator.Random, numberOfParams);
                return true;
        }
        return false;
    }

    handleCall(procedure: ProcedureSymbol): void {
        if (this.handleSystemCall(procedure)) {
            return;
        }
        this.assembler.emit(OperatorCode.ProcedureCall, this.metadata.findProcedure(procedure));
    }

    visitProcedureCall(node: ProcedureCallNode): void {
        node.getParams().forEach((param) => {
            param.accept(this);
        });
        this.handleCall(getOrThrow(this.symbols.callToSymbol.get(node)));
    }

    visitAssignment(node: AssignmentNode): void {
        node.getDesignator().accept(this);
        node.getExpression().accept(this);
        this.assembler.emit(OperatorCode.StoreVariable);
    }

    visitConstantList(node: ConstantListNode): void {
        node.getConstants().forEach((constant) => {
            const symbol = getOrThrow(this.symbols.variableToSymbol.get(constant));
            const variable = this.metadata.findVariable(symbol);
            this.assembler.emit(OperatorCode.LoadVariable, variable);
            constant.getExpression().getExpression().accept(this);
            this.assembler.emit(OperatorCode.StoreVariable);
        });
    }

    visitNew(node: NewNode): void {
        const designatorNode = node.getDesignator();
        const designator = this.symbols.designatorToSymbol.get(designatorNode);
        node.getArgs().forEach((arg) => arg.accept(this));
        designatorNode.accept(this);
        if (designator instanceof VariableSymbol || designator instanceof CollectionVariableSymbol) {
            const type = designator.type;
            if (type instanceof ComponentSymbol) {
                this.assembler.emit(OperatorCode.New, this.metadata.findComponent(type));
                return;
            }
            if (type instanceof BuiltInTypeSymbol) {
                this.assembler.emit(OperatorCode.New, this.metadata.builtInTypeDescriptor(type));
                return;
            }
        }
        throw new Error(`Unsupported new statement.`);
    }

    visitConnect(node: ConnectNode): void {
        node.getWhat().accept(this);
        node.getTo().accept(this);
        this.assembler.emit(OperatorCode.Connect);
    }

    visitDisconnect(node: DisconnectNode): void {
        node.getWhat().accept(this);
        this.assembler.emit(OperatorCode.Disconnect);
    }

    visitSend(node: SendNode): void {
        node.getArgs().forEach((arg) => arg.accept(this));
        const from = node.getFrom();
        if (from === undefined || from instanceof BasicDesignatorNode) {
            this.assembler.emit(OperatorCode.LoadThis);
        }
        from?.accept(this);
        const message = this.metadata.findMessage(getOrThrow(this.symbols.sendReceiveToSymbol.get(node)));
        this.assembler.emit(OperatorCode.Send, message);
    }

    visitReceive(node: ReceiveNode): void {
        node.getTargets().forEach((arg) => arg.accept(this));
        const from = node.getFrom();
        if (from === undefined || from instanceof BasicDesignatorNode) {
            this.assembler.emit(OperatorCode.LoadThis);
        }
        from?.accept(this);
        const message = this.metadata.findMessage(getOrThrow(this.symbols.sendReceiveToSymbol.get(node)));
        this.assembler.emit(OperatorCode.Receive, message);
    }

    visitDelete(node: DeleteNode): void {
        node.getTarget().accept(this);
        this.assembler.emit(OperatorCode.Delete);
    }

    visitMove(node: MoveNode): void {
        node.getFrom().accept(this);
        node.getTo().accept(this);
        this.assembler.emit(OperatorCode.Move);
    }

    visitAwait(node: AwaitNode): void {
        const startAwait = this.assembler.createLabel();
        const endAwait = this.assembler.createLabel();
        this.assembler.setLabel(startAwait);
        node.getExpression().accept(this);
        this.assembler.emitBranchFalse(endAwait);
        this.assembler.emitBranch(startAwait);
        this.assembler.setLabel(endAwait);
    }

    visitReturn(node: ReturnNode): void {
        node.getExpression()?.accept(this);
        this.assembler.emit(OperatorCode.Return);
    }

    visitIf(node: IfNode): void {
        const endIfLabel = this.assembler.createLabel();
        const elseIfLabels = node.getElseIfs().map(() => this.assembler.createLabel());
        const elseLabel = this.assembler.createLabel();
        node.getExpression().accept(this);

        if (node.getElseIfs().length > 0) {
            this.assembler.emitBranchFalse(elseIfLabels[0]);
            node.getThen().accept(this);
            node.getElseIfs().forEach((elseIf, i) => {
                this.assembler.emitBranch(endIfLabel);
                this.assembler.setLabel(elseIfLabels[i]);
                elseIf.getExpression().accept(this);
                this.assembler.emitBranchFalse(
                    i + 1 < node.getElseIfs().length
                        ? elseIfLabels[i + 1]
                        : node.getElse() !== undefined
                        ? elseLabel
                        : endIfLabel,
                );
                elseIf.getThen().accept(this);
            });
        }
        if (node.getElse() !== undefined) {
            this.assembler.emitBranchFalse(elseLabel);
            node.getThen().accept(this);
            this.assembler.emitBranch(endIfLabel);
            this.assembler.setLabel(elseLabel);
            node.getElse()?.accept(this);
        }
        if (node.getElseIfs().length === 0 && node.getElse() === undefined) {
            this.assembler.emitBranchFalse(endIfLabel);
            node.getThen().accept(this);
        }
        this.assembler.setLabel(endIfLabel);
    }

    visitWhile(node: WhileNode): void {
        const conditionLabel = this.assembler.createLabel();
        const endWhile = this.assembler.createLabel();
        this.assembler.setLabel(conditionLabel);
        node.getExpresssion().accept(this);
        this.assembler.emitBranchFalse(endWhile);
        node.getBody().accept(this);
        this.assembler.emitBranch(conditionLabel);
        this.assembler.setLabel(endWhile);
    }

    visitRepeat(node: RepeatNode): void {
        const repeatStart = this.assembler.createLabel();
        const repeatEnd = this.assembler.createLabel();
        this.assembler.setLabel(repeatStart);
        node.getBody().accept(this);
        node.getExpresssion().accept(this);
        this.assembler.emitBranchFalse(repeatEnd);
        this.assembler.emitBranch(repeatStart);
        this.assembler.setLabel(repeatEnd);
    }

    visitFor(node: ForNode): void {
        const conditionLabel = this.assembler.createLabel();
        const forEnd = this.assembler.createLabel();
        const designator = node.getDesignator();
        designator.accept(this);
        node.getExpression().accept(this);
        this.assembler.emit(OperatorCode.StoreVariable);
        this.assembler.setLabel(conditionLabel);
        designator.accept(this);
        node.getTo().accept(this);
        const increment = node.getBy();
        if (increment !== undefined) {
            const decrement = this.assembler.createLabel();
            const body = this.assembler.createLabel();
            const constExpr = increment.getExpression();
            constExpr.accept(this);
            this.assembler.emitLoadInteger(0);
            this.assembler.emit(OperatorCode.Greater); // is BY > 0
            this.assembler.emitBranchFalse(decrement);
            this.assembler.emit(OperatorCode.LessEqual);
            this.assembler.emitBranchFalse(forEnd);
            this.assembler.emitBranch(body);
            this.assembler.setLabel(decrement);
            this.assembler.emit(OperatorCode.GreaterEqual);
            this.assembler.emitBranchFalse(forEnd);
            this.assembler.setLabel(body);
            node.getStatements().accept(this);
            designator.accept(this);
            constExpr.accept(this);
            this.assembler.emitSystemCall(SystemCallOperator.Inc, 2);
        } else {
            this.assembler.emit(OperatorCode.LessEqual);
            this.assembler.emitBranchFalse(forEnd);
            node.getStatements().accept(this);
            designator.accept(this);
            this.assembler.emitSystemCall(SystemCallOperator.Inc, 1);
        }
        this.assembler.emitBranch(conditionLabel);
        this.assembler.setLabel(forEnd);
    }

    visitForeach(node: ForeachNode): void {
        console.warn('FOREACH is not yet fully supported by the code generator and runtime.');
        const conditionLabel = this.assembler.createLabel();
        const forEnd = this.assembler.createLabel();
        this.assembler.setLabel(conditionLabel);
        node.getDesignators().forEach((designator) => designator.accept(this));
        node.getOf().accept(this);
        this.assembler.emitSystemCall(SystemCallOperator.LoadForEachDesignators, node.getDesignators().length);
        this.assembler.emitBranchFalse(forEnd);
        node.getBody().accept(this);
        this.assembler.emitBranch(conditionLabel);
        this.assembler.setLabel(forEnd);
    }

    visitStatementBlock(node: StatementBlockNode): void {
        node.getStatements().accept(this);
    }

    // EXPRESSIONS:
    visitUnaryExpression(node: UnaryExpressionNode): void {
        node.getExpression().accept(this);
    }

    visitBinaryExpression(node: BinaryExpressionNode): void {
        node.getLeft().accept(this);
        node.getRight().accept(this);
        switch (node.getOp()) {
            case LogicalOperator.Equal:
                this.assembler.emit(OperatorCode.Equal);
                break;
            case LogicalOperator.Less:
                this.assembler.emit(OperatorCode.Less);
                break;
            case LogicalOperator.LessEqual:
                this.assembler.emit(OperatorCode.LessEqual);
                break;
            case LogicalOperator.More:
                this.assembler.emit(OperatorCode.Greater);
                break;
            case LogicalOperator.MoreEqual:
                this.assembler.emit(OperatorCode.GreaterEqual);
                break;
            case LogicalOperator.NotEqual:
                this.assembler.emit(OperatorCode.NotEqual);
                break;
        }
    }

    // TODO
    //visitOffersRequiresExpression(_node: OffersRequiresExpressionNode): void {
    //}

    visitTypeCheck(node: TypeCheckExpressionNode): void {
        node.getDesignator().accept(this);
        node.getType().accept(this);
        this.assembler.emit(OperatorCode.IsType);
    }

    visitUnaryTermNode(node: UnaryTermNode): void {
        node.getTerm().accept(this);
        switch (node.getOp()) {
            case PrefixOperator.Minus:
                this.assembler.emit(OperatorCode.Negate);
        }
    }

    visitTermChain(node: TermChainNode): void {
        node.getLeft().accept(this);
        node.getRight().forEach((right) => right.accept(this));
    }

    visitRightTerm(node: RightTermNode): void {
        node.getRight().accept(this);
        switch (node.getOp()) {
            case InfixTermOperator.Minus:
                this.assembler.emit(OperatorCode.Subtract);
                break;
            case InfixTermOperator.Or:
                this.assembler.emit(OperatorCode.LogicOr);
                break;
            case InfixTermOperator.Plus:
                this.assembler.emit(OperatorCode.Add);
                break;
        }
    }

    visitFactorChain(node: FactorChainNode): void {
        node.getLeft().accept(this);
        node.getRight().forEach((right) => right.accept(this));
    }

    visitRightFactor(node: RightFactorNode): void {
        node.getRight().accept(this);
        switch (node.getOp()) {
            case InfixFactorOperator.AndText:
                this.assembler.emit(OperatorCode.LogicAnd);
                break;
            case InfixFactorOperator.Div:
            case InfixFactorOperator.DivText:
                this.assembler.emit(OperatorCode.Divide);
                break;
            case InfixFactorOperator.Times:
                this.assembler.emit(OperatorCode.Multiply);
                break;
            case InfixFactorOperator.ModText:
                this.assembler.emit(OperatorCode.Modulo);
                break;
        }
    }

    visitUnaryFactor(node: UnaryFactorNode): void {
        node.getFactor().accept(this);
        switch (node.getPrefix()) {
            case FactorPrefix.Not:
                this.assembler.emit(OperatorCode.Not);
        }
    }

    visitExpressionFactor(node: ExpressionFactorNode): void {
        node.getExpression().accept(this);
    }

    visitIntegerNumber(node: IntegerNumberNode): void {
        this.assembler.emitLoadInteger(node.getValue());
    }

    visitRealNumber(node: RealNumberNode): void {
        this.assembler.emitLoadFloat(node.getValue());
    }

    visitConstantCharacter(node: ConstantCharacterNode): void {
        this.assembler.emitLoadCharacter(node.getCharacter());
    }

    visitText(node: TextNode): void {
        this.assembler.emitLoadText(node.getText());
    }

    visitReceiveTest(node: ReceiveTestNode): void {
        const message = getOrThrow(this.symbols.patternToSymbol.get(node.getPattern()));
        // this should probably be handled in the runtime
        //const block = this.assembler.createLabel();
        //this.assembler.setLabel(block);
        const designator = node.getDesignator();
        this.assembler.emit(OperatorCode.LoadThis);
        designator?.accept(this);
        this.assembler.emit(OperatorCode.ReceiveTest, this.metadata.findMessage(message));
        //this.assembler.emitBranchFalse(block);
    }

    visitInputTest(node: InputTestNode): void {
        const designator = node.getDesignator();
        this.assembler.emit(OperatorCode.LoadThis);
        designator?.accept(this);
        this.assembler.emit(OperatorCode.InputTest);
    }

    visitExistsTest(node: ExistsTestNode): void {
        node.getDesignator().accept(this);
        this.assembler.emit(OperatorCode.ExistsTest);
    }

    visitFunctionCall(node: FunctionCallNode): void {
        node.getArguments().forEach((arg) => arg.accept(this));
        this.handleCall(getOrThrow(this.symbols.callToSymbol.get(node)));
    }

    visitProcedure(node: ProcedureNode): void {
        const symbol = getOrThrow(this.symbols.procedureToSymbol.get(node));
        const visitor = new CodeGeneratorVisitor(this.symbols, symbol, this.metadata);
        const descriptor = this.metadata.findProcedure(symbol);
        node.getDeclarations()
            .filter((declaration) => declaration instanceof VariableListNode || declaration instanceof ConstantListNode)
            .forEach((declaration) => declaration.accept(visitor));
        descriptor.declarations.init.instructions.push(...visitor.getInstructions());
        Generator.fillDeclarations(descriptor.declarations, symbol, this.metadata, this.symbols);
        node.getStatements()?.accept(visitor);
        descriptor.begin.instructions.push(...visitor.getInstructions());
    }
}

export class ImplementationGeneratorVisitor extends Visitor {
    constructor(private symbol: ImplementationSymbol, private metadata: Metadata, private symbols: SymbolTable) {
        super();
    }

    visitImplementation(node: ImplementationNode): void {
        const descriptor = this.metadata.findImplementation(this.symbol);
        let visitor = new CodeGeneratorVisitor(this.symbols, this.symbol, this.metadata);
        Generator.fillDeclarations(descriptor.declarations, this.symbol, this.metadata, this.symbols);
        node.getDeclarations()
            .filter((declaration) => declaration instanceof VariableListNode || declaration instanceof ConstantListNode)
            .forEach((declaration) => declaration.accept(visitor));
        descriptor.declarations.init.instructions.push(...visitor.getInstructions());
        visitor = new CodeGeneratorVisitor(this.symbols, this.symbol, this.metadata);
        node.getStatements()?.accept(visitor);
        descriptor.begin.instructions.push(...visitor.getInstructions());
    }
}
export class ComponentGeneratorVisitor extends Visitor {
    constructor(private symbol: ComponentSymbol, private metadata: Metadata, private symbols: SymbolTable) {
        super();
    }

    visitComponentBody(node: ComponentBodyNode): void {
        const descriptor = this.metadata.findComponent(this.symbol);
        let visitor = new CodeGeneratorVisitor(this.symbols, this.symbol, this.metadata);
        node.getDeclarations()
            .filter((declaration) => declaration instanceof VariableListNode || declaration instanceof ConstantListNode)
            .forEach((declaration) => declaration.accept(visitor));
        descriptor.declarations.init.instructions.push(...visitor.getInstructions());
        node.getImplementations().forEach((declaration) => {
            const implSymbol = getOrThrow(this.symbols.implementationToSymbol.get(declaration));
            const implVisitor = new ImplementationGeneratorVisitor(implSymbol, this.metadata, this.symbols);
            declaration.accept(implVisitor);
        });
        visitor = new CodeGeneratorVisitor(this.symbols, this.symbol, this.metadata);
        node.getBeginBlock()?.accept(visitor);
        descriptor.begin.instructions.push(...visitor.getInstructions());
        visitor = new CodeGeneratorVisitor(this.symbols, this.symbol, this.metadata);
        node.getActivityBlock()?.accept(visitor);
        descriptor.activity.instructions.push(...visitor.getInstructions());
        visitor = new CodeGeneratorVisitor(this.symbols, this.symbol, this.metadata);
        node.getFinallyBlock()?.accept(visitor);
        descriptor.finally.instructions.push(...visitor.getInstructions());
    }
}
