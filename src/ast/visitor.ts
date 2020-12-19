import { ProgramNode } from './program';
import { ComponentNode, ComponentBodyNode } from './component';
import {
    ProcedureCallNode,
    StatementNode,
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
    ForNode,
    ForeachNode,
    StatementBlockNode,
    ElseIfNode,
} from './statement';
import { AttributeNode } from './attribute';
import { NameNode, IndexedNameNode } from './name';
import { InterfaceNode, ProtocolExpressionNode, ProtocolTermNode, ProtocolNode } from './interface';
import { ParameterNode } from './parameter';
import {
    ExpressionNode,
    AttributedExpressionNode,
    UnaryExpressionNode,
    BinaryExpressionNode,
    OffersRequiresExpressionNode,
    TypeCheckExpressionNode,
} from './expression';
import { TypeNode, BasicTypeNode, AnyTypeNode } from './type';
import { DeclarationNode } from './declaration';
import { ProcedureNode, ProcedureParameterNode } from './procedure';
import { VariableNode, VariableListNode } from './variable';
import { ImplementationNode } from './implementation';
import {
    BasicDesignatorNode,
    BasicExpressionDesignatorNode,
    DesignatorTypeNode,
    BaseTargetDesignatorNode,
    DesignatorNode,
} from './designator';
import {
    FunctionCallNode,
    NumberNode,
    ConstantCharacterNode,
    TextNode,
    InputTestNode,
    ReceiveTestNode,
    ExistsTestNode,
    OperandNode,
    RealNumberNode,
    IntegerNumberNode,
} from './operand';
import { UnaryFactorNode, ExpressionFactorNode, FactorNode } from './factor';
import { TermNode, FactorChainNode, RightFactorNode } from './term';
import { RightTermNode, TermChainNode, UnaryTermNode, SimpleExpressionNode } from './simple-expression';
import { CardinalityNode } from './cardinality';
import { OfferedInterfaceNode, RequiredInterfaceNode, InterfaceDeclarationNode } from './interface-declaration';
import {
    ProtocolFactorNode,
    MessageDeclarationNode,
    ProtocolFactorExpressionNode,
    GroupProtocolExpressionNode,
    RepeatingProtocolExpressionNode,
    OptionalProtocolExpressionNode,
} from './protocol-factor';
import { StatementSequenceNode } from './statement-sequence';
import { ConstantListNode, ConstantNode, ConstantExpressionNode } from './constant';

export abstract class Visitor {
    visitProtocolFactor(node: ProtocolFactorNode): void {
        if (node instanceof MessageDeclarationNode) {
            this.visitMessageDeclaration(node);
            return;
        }
        if (node instanceof ProtocolFactorExpressionNode) {
            this.visitProtocolFactorExpression(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitMessageDeclaration(_node: MessageDeclarationNode): void {}

    visitProtocolFactorExpression(node: ProtocolFactorExpressionNode): void {
        if (node instanceof OptionalProtocolExpressionNode) {
            this.visitOptionalProtocolFactorExpression(node);
            return;
        }
        if (node instanceof RepeatingProtocolExpressionNode) {
            this.visitRepeatingProtocolFactorExpression(node);
            return;
        }
        if (node instanceof GroupProtocolExpressionNode) {
            this.visitGroupProtocolFactorExpression(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitOptionalProtocolFactorExpression(_node: OptionalProtocolExpressionNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitGroupProtocolFactorExpression(_node: GroupProtocolExpressionNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitRepeatingProtocolFactorExpression(_node: RepeatingProtocolExpressionNode): void {}

    visitType(node: TypeNode): void {
        if (node instanceof BasicTypeNode) {
            this.visitBasicType(node);
            return;
        }
        if (node instanceof AnyTypeNode) {
            this.visitAnyType(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitBasicType(_node: BasicTypeNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitAnyType(_node: AnyTypeNode): void {}

    visitDesignator(node: DesignatorNode): void {
        if (node instanceof BasicDesignatorNode) {
            this.visitBasicDesignator(node);
            return;
        }
        if (node instanceof BasicExpressionDesignatorNode) {
            this.visitBasicExpressionDesignator(node);
            return;
        }
        if (node instanceof BaseTargetDesignatorNode) {
            this.visitBaseTargetDesignator(node);
            return;
        }
        if (node instanceof DesignatorTypeNode) {
            this.visitDesignatorType(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitBasicDesignator(_node: BasicDesignatorNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitBasicExpressionDesignator(_node: BasicExpressionDesignatorNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitBaseTargetDesignator(_node: BaseTargetDesignatorNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitDesignatorType(_node: DesignatorTypeNode): void {}

    visitInterfaceDeclaration(node: InterfaceDeclarationNode): void {
        if (node instanceof OfferedInterfaceNode) {
            this.visitOfferedInterface(node);
            return;
        }
        if (node instanceof RequiredInterfaceNode) {
            this.visitRequiredInterfface(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitOfferedInterface(_node: OfferedInterfaceNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitRequiredInterfface(_node: RequiredInterfaceNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitName(_node: NameNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitIndexedName(_node: IndexedNameNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitCardinality(_node: CardinalityNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitProgram(_node: ProgramNode): void {}

    visitDeclaration(node: DeclarationNode): void {
        if (node instanceof ComponentNode) {
            this.visitComponent(node);
            return;
        }
        if (node instanceof InterfaceNode) {
            this.visitInterface(node);
            return;
        }
        if (node instanceof ConstantListNode) {
            this.visitConstantList(node);
            return;
        }
        if (node instanceof VariableListNode) {
            this.visitVariableList(node);
            return;
        }
        if (node instanceof ProcedureNode) {
            this.visitProcedure(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitComponent(_node: ComponentNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitInterface(_node: InterfaceNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitConstantList(_node: ConstantListNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitVariableList(_node: VariableListNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitProcedure(_node: ProcedureNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitProcedureParameter(_node: ProcedureParameterNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitComponentBody(_node: ComponentBodyNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitImplementation(_node: ImplementationNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitProtocol(_node: ProtocolNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitProtocolExpression(_node: ProtocolExpressionNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitProtocolTerm(_node: ProtocolTermNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitAttribute(_node: AttributeNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitStatementSequence(_node: StatementSequenceNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitParameter(_node: ParameterNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitConstant(_node: ConstantNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitConstantExpression(_node: ConstantExpressionNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitVariable(_node: VariableNode): void {}

    visitStatement(node: StatementNode): void {
        if (node instanceof ProcedureCallNode) {
            this.visitProcedureCall(node);
            return;
        }
        if (node instanceof AssignmentNode) {
            this.visitAssignment(node);
            return;
        }
        if (node instanceof NewNode) {
            this.visitNew(node);
            return;
        }
        if (node instanceof ConnectNode) {
            this.visitConnect(node);
            return;
        }
        if (node instanceof DisconnectNode) {
            this.visitDisconnect(node);
            return;
        }
        if (node instanceof SendNode) {
            this.visitSend(node);
            return;
        }
        if (node instanceof ReceiveNode) {
            this.visitReceive(node);
            return;
        }
        if (node instanceof DeleteNode) {
            this.visitDelete(node);
            return;
        }
        if (node instanceof MoveNode) {
            this.visitMove(node);
            return;
        }
        if (node instanceof AwaitNode) {
            this.visitAwait(node);
            return;
        }
        if (node instanceof ReturnNode) {
            this.visitReturn(node);
            return;
        }
        if (node instanceof IfNode) {
            this.visitIf(node);
            return;
        }
        if (node instanceof ElseIfNode) {
            this.visitElseIf(node);
            return;
        }
        if (node instanceof WhileNode) {
            this.visitWhile(node);
            return;
        }
        if (node instanceof RepeatNode) {
            this.visitRepeat(node);
            return;
        }
        if (node instanceof ForNode) {
            this.visitFor(node);
            return;
        }
        if (node instanceof ForeachNode) {
            this.visitForeach(node);
            return;
        }
        if (node instanceof StatementBlockNode) {
            this.visitStatementBlock(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitProcedureCall(_node: ProcedureCallNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitAssignment(_node: AssignmentNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitNew(_node: NewNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitConnect(_node: ConnectNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitDisconnect(_node: DisconnectNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitSend(_node: SendNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitReceive(_node: ReceiveNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitDelete(_node: DeleteNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitMove(_node: MoveNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitAwait(_node: AwaitNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitReturn(_node: ReturnNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitIf(_node: IfNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitElseIf(_node: ElseIfNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitWhile(_node: WhileNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitRepeat(_node: RepeatNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitFor(_node: ForNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitForeach(_node: ForeachNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitStatementBlock(_node: StatementBlockNode): void {}

    visitExpression(node: ExpressionNode): void {
        if (node instanceof SimpleExpressionNode) {
            this.visitSimpleExpression(node);
            return;
        }
        if (node instanceof AttributedExpressionNode) {
            this.visitAttributedExpression(node);
            return;
        }
    }

    visitAttributedExpression(node: AttributedExpressionNode): void {
        if (node instanceof SimpleExpressionNode) {
            this.visitSimpleExpression(node);
            return;
        }
        if (node instanceof UnaryExpressionNode) {
            this.visitUnaryExpression(node);
            return;
        }
        if (node instanceof BinaryExpressionNode) {
            this.visitBinaryExpression(node);
            return;
        }
        if (node instanceof OffersRequiresExpressionNode) {
            this.visitOffersRequiresExpression(node);
            return;
        }
        if (node instanceof TypeCheckExpressionNode) {
            this.visitTypeCheck(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitUnaryExpression(_node: UnaryExpressionNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitBinaryExpression(_node: BinaryExpressionNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitOffersRequiresExpression(_node: OffersRequiresExpressionNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitTypeCheck(_node: TypeCheckExpressionNode): void {}

    visitSimpleExpression(node: SimpleExpressionNode): void {
        if (node instanceof UnaryTermNode) {
            this.visitUnaryTermNode(node);
            return;
        }
        if (node instanceof TermChainNode) {
            this.visitTermChain(node);
            return;
        }
        if (node instanceof TermNode) {
            this.visitTerm(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitUnaryTermNode(_node: UnaryTermNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitTermChain(_node: TermChainNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitRightTerm(_node: RightTermNode): void {}

    visitTerm(node: TermNode): void {
        if (node instanceof FactorNode) {
            this.visitFactor(node);
            return;
        }
        if (node instanceof FactorChainNode) {
            this.visitFactorChain(node);
            return;
        }
        if (node instanceof RightFactorNode) {
            this.visitRightFactor(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitFactorChain(_node: FactorChainNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitRightFactor(_node: RightFactorNode): void {}

    visitFactor(node: FactorNode): void {
        if (node instanceof UnaryFactorNode) {
            this.visitUnaryFactor(node);
            return;
        }
        if (node instanceof ConstantCharacterNode) {
            this.visitConstantCharacter(node);
            return;
        }
        if (node instanceof OperandNode) {
            this.visitOperand(node);
            return;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitUnaryFactor(_node: UnaryFactorNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitExpressionFactor(_node: ExpressionFactorNode): void {}

    visitOperand(node: OperandNode): void {
        if (node instanceof NumberNode) {
            this.visitNumber(node);
            return;
        }
        if (node instanceof ConstantCharacterNode) {
            this.visitConstantCharacter(node);
            return;
        }
        if (node instanceof TextNode) {
            this.visitText(node);
            return;
        }
        if (node instanceof ReceiveTestNode) {
            this.visitReceiveTest(node);
            return;
        }
        if (node instanceof InputTestNode) {
            this.visitInputTest(node);
            return;
        }
        if (node instanceof ExistsTestNode) {
            this.visitExistsTest(node);
            return;
        }
        if (node instanceof FunctionCallNode) {
            this.visitFunctionCall(node);
            return;
        }
        if (node instanceof DesignatorNode) {
            this.visitDesignator(node);
            return;
        }
    }

    visitNumber(node: NumberNode): void {
        if (node instanceof IntegerNumberNode) {
            this.visitIntegerNumber(node);
            return;
        }
        if (node instanceof RealNumberNode) {
            this.visitRealNumber(node);
            return;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitIntegerNumber(_node: IntegerNumberNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitRealNumber(_node: RealNumberNode): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitConstantCharacter(_node: ConstantCharacterNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitText(_node: TextNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitReceiveTest(_node: ReceiveTestNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitInputTest(_node: InputTestNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitExistsTest(_node: ExistsTestNode): void {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    visitFunctionCall(_node: FunctionCallNode): void {}
}
