import { default as tape } from 'tape';
import { CardinalitySymbol, GenericSymbol, InterfaceDeclarationSymbol } from '../src/symbols/generic-symbols';
import { InterfaceSymbol } from '../src/symbols/type-symbols';
import { SymbolTable } from '../src/symbols/symbols';

tape('Simple generic symbol compare', async (test) => {
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(),
        new Array<InterfaceDeclarationSymbol>(),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(),
        new Array<InterfaceDeclarationSymbol>(),
    );
    test.ok(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.ok(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});

tape('Generic one offered', async (test) => {
    const symbolTable = new SymbolTable();
    const interfaceA = new InterfaceSymbol(symbolTable.globalScope, 'Test');
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(1))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(1))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    test.ok(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.ok(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});

tape('Generic one offered', async (test) => {
    const symbolTable = new SymbolTable();
    const interfaceA = new InterfaceSymbol(symbolTable.globalScope, 'Test1');
    const interfaceB = new InterfaceSymbol(symbolTable.globalScope, 'Test2');
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(
            new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(1)),
            new InterfaceDeclarationSymbol(interfaceB, new CardinalitySymbol(1)),
        ),
        new Array<InterfaceDeclarationSymbol>(),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(1))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    test.notOk(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.ok(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});

tape('Generic one offered with range', async (test) => {
    const symbolTable = new SymbolTable();
    const interfaceA = new InterfaceSymbol(symbolTable.globalScope, 'Test');
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(1, 3))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(1))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    test.ok(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.notOk(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});

tape('Generic one offered with two ranges B := A', async (test) => {
    const symbolTable = new SymbolTable();
    const interfaceA = new InterfaceSymbol(symbolTable.globalScope, 'Test');
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(3, 5))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(2, 5))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    test.ok(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.notOk(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});

tape('Generic one offered with two ranges A := B', async (test) => {
    const symbolTable = new SymbolTable();
    const interfaceA = new InterfaceSymbol(symbolTable.globalScope, 'Test');
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(3, 5))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(3, 6))),
        new Array<InterfaceDeclarationSymbol>(),
    );
    test.notOk(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.ok(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});

tape('Generic one required with range', async (test) => {
    const symbolTable = new SymbolTable();
    const interfaceA = new InterfaceSymbol(symbolTable.globalScope, 'Test');
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(),
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(1, 3))),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(),
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(1))),
    );
    test.notOk(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.ok(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});

tape('Generic one required with two ranges B := A', async (test) => {
    const symbolTable = new SymbolTable();
    const interfaceA = new InterfaceSymbol(symbolTable.globalScope, 'Test');
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(),
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(3, 5))),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(),
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(2, 5))),
    );
    test.notOk(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.ok(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});

tape('Generic one required with two ranges A := B', async (test) => {
    const symbolTable = new SymbolTable();
    const interfaceA = new InterfaceSymbol(symbolTable.globalScope, 'Test');
    const genericA = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(),
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(3, 5))),
    );
    const genericB = new GenericSymbol(
        new Array<InterfaceDeclarationSymbol>(),
        new Array<InterfaceDeclarationSymbol>(new InterfaceDeclarationSymbol(interfaceA, new CardinalitySymbol(3, 6))),
    );
    test.ok(genericA.canBeSubstitutedBy(genericB), 'A := B.');
    test.notOk(genericA.canSubstitute(genericB), 'B := A.');
    test.end();
});
