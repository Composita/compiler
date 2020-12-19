import { Visitor, ProcedureNode } from '../ast/ast';
import {
    SymbolTable,
    TypeSymbol,
    ProcedureSymbol,
    ScopeSymbolType,
    VariableSymbol,
    SearchOptions,
} from '../symbols/symbols';
import { FixTypeNodeVisitor } from './fix-type-node';
import { CheckerHelper } from './static-helpers';

// register all procedures, single layer
export class ProcedureRegisterVisitor extends Visitor {
    constructor(private symbolTable: SymbolTable, private scope: ScopeSymbolType) {
        super();
    }

    visitProcedure(node: ProcedureNode): void {
        const name = node.getName().getName();
        const params: Array<TypeSymbol> = CheckerHelper.convertParamTypes(
            this.symbolTable,
            this.scope,
            node.getParams().map((param) => param.getParameter()),
        );
        let returnType: TypeSymbol = this.symbolTable.voidType;

        const returnTypeNode = node.getType();
        if (returnTypeNode !== undefined) {
            returnTypeNode.accept(new FixTypeNodeVisitor(this.symbolTable, this.scope));
            const foundType = this.symbolTable.typeToSymbol.get(returnTypeNode);
            if (foundType === undefined) {
                throw new Error(`Failed to find procedure return type for ${name}.`);
            }
            returnType = foundType;
        }
        try {
            CheckerHelper.getProcedureFromNode(node, this.symbolTable, new SearchOptions(this.scope, false, false));
            throw new Error('Duplicate procedure detected.');
        } catch (error) {
            // all good
        }
        const procedure = new ProcedureSymbol(this.scope, name, params, returnType);
        node.getParams().forEach((param) => {
            const innerParam = param.getParameter();
            innerParam
                .getNames()
                .forEach((name) =>
                    this.symbolTable.registerVariable(
                        new VariableSymbol(
                            procedure,
                            name.getName(),
                            param.isMutable(),
                            CheckerHelper.getTypeType(this.symbolTable, innerParam.getType()),
                        ),
                    ),
                );
        });
        this.symbolTable.registerProcedure(procedure);
        this.symbolTable.procedureToSymbol.set(node, procedure);
    }
}
