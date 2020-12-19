import {
    SymbolTable,
    ProcedureSymbol,
    InterfaceSymbol,
    BuiltInTypeSymbol,
    ConstantSymbol,
    InterfaceDeclarationSymbol,
    CardinalitySymbol,
    ScopeSymbolType,
    TypeSymbol,
    VariableSymbol,
    ProgramScopeSymbol,
    ComponentSymbol,
    SearchOptions,
} from '../symbols/symbols';
import { ProgramNode, InterfaceDeclarationNode } from '../ast/ast';
import { TypeRegisterVisitor } from './register-types';

export class SymbolConstruction {
    private constructor(private symbolTable: SymbolTable, private programScope: ProgramScopeSymbol) {
        const bool_t = new BuiltInTypeSymbol(this.symbolTable.globalScope, 'BOOLEAN');
        const char_t = new BuiltInTypeSymbol(this.symbolTable.globalScope, 'CHARACTER');
        const text_t = new BuiltInTypeSymbol(this.symbolTable.globalScope, 'TEXT');
        const int_t = new BuiltInTypeSymbol(this.symbolTable.globalScope, 'INTEGER');
        const real_t = new BuiltInTypeSymbol(this.symbolTable.globalScope, 'REAL');

        this.builtInTypes = new Array<BuiltInTypeSymbol>(bool_t, char_t, text_t, int_t, real_t);

        this.constants = new Map<string, BuiltInTypeSymbol>([
            ['TRUE', bool_t],
            ['FALSE', bool_t],
            ['PI', real_t],
        ]);

        this.variables = new Map<string, BuiltInTypeSymbol>([['TIME', int_t]]);

        this.systemProcedures = new Array<[string, [BuiltInTypeSymbol, Array<TypeSymbol>]]>(
            // propper procedures
            ['ASSERT', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(bool_t)]],
            ['ASSERT', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(bool_t, int_t)]],
            ['HALT', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t)]],
            ['INC', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t)]],
            ['INC', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t, int_t)]],
            ['DEC', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t)]],
            ['DEC', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t, int_t)]],
            ['PASSIVATE', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t)]],
            ['WRITE', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(text_t)]],
            ['WRITE', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t)]],
            ['WRITE', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(real_t)]],
            ['WRITE', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(char_t)]],
            ['WRITEHEX', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t)]],
            ['WRITELINE', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>()]],
            // alloc and dealloc
            ['NEW', [this.symbolTable.voidType, new Array<ComponentSymbol>(this.symbolTable.anyComponentType)]],
            ['NEW', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t)]],
            ['NEW', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t, int_t)]],
            ['NEW', [this.symbolTable.voidType, new Array<BuiltInTypeSymbol>(int_t, int_t, int_t)]],
            ['DELETE', [this.symbolTable.voidType, new Array<ComponentSymbol>(this.symbolTable.anyComponentType)]],
            // function procedures
            ['COUNT', [int_t, new Array<InterfaceSymbol>(this.symbolTable.anyRequiredInterfaceType)]],
            ['LENGTH', [int_t, new Array<BuiltInTypeSymbol>(text_t)]],
            ['SQRT', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['SIN', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['COS', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['TAN', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['ARCSIN', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['ARCCOS', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['ARCTAN', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['RANDOM', [int_t, new Array<BuiltInTypeSymbol>(int_t, int_t)]],
            ['MIN', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['MIN', [int_t, new Array<BuiltInTypeSymbol>(int_t)]],
            ['MAX', [real_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['MAX', [int_t, new Array<BuiltInTypeSymbol>(int_t)]],
            // type conversion
            ['CHARACTER', [char_t, new Array<BuiltInTypeSymbol>(int_t)]],
            ['INTEGER', [int_t, new Array<BuiltInTypeSymbol>(real_t)]],
            ['INTEGER', [int_t, new Array<BuiltInTypeSymbol>(char_t)]],
            ['REAL', [real_t, new Array<BuiltInTypeSymbol>(int_t)]],
            ['TEXT', [text_t, new Array<BuiltInTypeSymbol>(char_t)]],
        );
    }

    private readonly builtInTypes: Array<BuiltInTypeSymbol>;
    // name, type
    private readonly constants: Map<string, BuiltInTypeSymbol>;

    // name, type
    private readonly variables: Map<string, BuiltInTypeSymbol>;

    // name, [return type, param types]
    private readonly systemProcedures: Array<[string, [BuiltInTypeSymbol, Array<TypeSymbol>]]>;

    static run(symbolTable: SymbolTable, program: ProgramNode, scope: ProgramScopeSymbol): void {
        const construction = new SymbolConstruction(symbolTable, scope);
        construction.register(program);
    }

    private register(program: ProgramNode): void {
        this.registerBuiltIns();
        program.accept(new TypeRegisterVisitor(this.symbolTable, this.programScope));
    }

    private registerBuiltIns(): void {
        this.registerBuiltInTypes();
        this.registerBuiltInProcedures();
        this.registerBuiltInConstants();
        this.registerBuiltInVariables();
    }

    private registerBuiltInTypes(): void {
        this.builtInTypes.forEach((value) => this.symbolTable.registerBuiltIns(value));
    }

    private registerBuiltInProcedures(): void {
        this.systemProcedures.forEach((value) => {
            const procedure = new ProcedureSymbol(this.symbolTable.globalScope, value[0], value[1][1], value[1][0]);
            this.symbolTable.registerProcedure(procedure);
        });
    }

    private registerBuiltInConstants(): void {
        this.constants.forEach((value, key) => this.symbolTable.constants.push(new ConstantSymbol(key, value)));
    }

    private registerBuiltInVariables(): void {
        this.variables.forEach((value, key) =>
            this.symbolTable.registerVariable(new VariableSymbol(this.symbolTable.globalScope, key, false, value)),
        );
    }

    static createInterfaceDeclarationSymbol(
        symbolTable: SymbolTable,
        node: InterfaceDeclarationNode,
        scope: ScopeSymbolType,
    ): InterfaceDeclarationSymbol {
        const name = node.getName().getName();
        const interfaces = symbolTable.findInterface(name, new SearchOptions(scope, true, true));
        if (interfaces.length === 0) {
            throw new Error(`Interface ${name} not defined.`);
        }
        if (interfaces.length > 1) {
            throw new Error(`Interface ${name} multiple times defined.`);
        }
        const cardinality = node.getCardinality();
        return new InterfaceDeclarationSymbol(
            interfaces[0],
            new CardinalitySymbol(cardinality?.getMin() ?? 1, cardinality?.getMax()),
        );
    }
}
