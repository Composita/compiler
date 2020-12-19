import { default as tape } from 'tape';
import {
    IL,
    ComponentDescriptor,
    Instruction,
    OperatorCode,
    VariableDescriptor,
    TextDescriptor,
    SystemCallDescriptor,
    IntegerDescriptor,
    SystemCallOperator,
    BooleanDescriptor,
    JumpDescriptor,
    FloatDescriptor,
    CharacterDescriptor,
    InterfaceDescriptor,
    ImplementationDescriptor,
    MessageDescriptor,
    ProtocolDescriptor,
    ProtocolType,
} from '@composita/il';
import { Lexer } from '../src/lexer/lexer';
import { CompilerDiagnosis } from '../src/diagnosis/diagnosis';
import { Parser } from '../src/parser/parser';
import { Checker } from '../src/checker/checker';
import { Generator } from '../src/generator/generator';

tape('Generator Hello World', (test) => {
    const code = `COMPONENT { ENTRYPOINT } HelloWorld;
  BEGIN
    WRITE("Hello World"); WRITELINE
END HelloWorld;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('HelloWorld');
    entry.begin.instructions.push(
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('Hello World')),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Write, new IntegerDescriptor(1)),
        ),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.WriteLine, new IntegerDescriptor(0)),
        ),
    );
    expectedIL.components.push(entry);
    expectedIL.entryPoints.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const symbols = checker.check(uri, parser.parse());
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Basic IL Compare');
    test.end();
});

tape('Generator Binary Expression', (test) => {
    const code = `COMPONENT Expr;
  VARIABLE v: INTEGER;
  BEGIN
    v := 5 - 3 * 7 + 8
END Expr;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('Expr');
    const variableV = new VariableDescriptor('v', new IntegerDescriptor(), true);
    entry.begin.instructions.push(
        new Instruction(OperatorCode.LoadVariable, variableV),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(5)),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(3)),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(7)),
        new Instruction(OperatorCode.Multiply),
        new Instruction(OperatorCode.Subtract),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(8)),
        new Instruction(OperatorCode.Add),
        new Instruction(OperatorCode.StoreVariable),
    );
    entry.declarations.variables.push(variableV);
    expectedIL.components.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Basic Expression Compare');
    test.end();
});

tape('Generate For By Loop', (test) => {
    const code = `COMPONENT Expr;
  VARIABLE v: INTEGER;
  BEGIN
    FOR v := 1 TO 10 BY 3 DO
      WRITE("A")
    END
END Expr;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('Expr');
    const variableV = new VariableDescriptor('v', new IntegerDescriptor(), true);
    entry.begin.instructions.push(
        new Instruction(OperatorCode.LoadVariable, variableV),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(1)),
        new Instruction(OperatorCode.StoreVariable),
        new Instruction(OperatorCode.LoadVariable, variableV),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(10)),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(3)),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(0)),
        new Instruction(OperatorCode.Greater),
        new Instruction(OperatorCode.BranchFalse, new JumpDescriptor(3)), // dec
        new Instruction(OperatorCode.LessEqual),
        new Instruction(OperatorCode.BranchFalse, new JumpDescriptor(9)), // end
        new Instruction(OperatorCode.Branch, new JumpDescriptor(2)), // body
        new Instruction(OperatorCode.GreaterEqual),
        new Instruction(OperatorCode.BranchFalse, new JumpDescriptor(6)), // end
        new Instruction(OperatorCode.LoadConstantCharacter, new CharacterDescriptor('A')),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Write, new IntegerDescriptor(1)),
        ),
        new Instruction(OperatorCode.LoadVariable, variableV),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(3)),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Inc, new IntegerDescriptor(2)),
        ),
        new Instruction(OperatorCode.Branch, new JumpDescriptor(-17)), // cond
    );
    entry.declarations.variables.push(variableV);
    expectedIL.components.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'For By Loop Compare');
    test.end();
});

tape('Generator Binary Expression in Activity', (test) => {
    const code = `COMPONENT Expr;
  VARIABLE v: INTEGER;
  ACTIVITY
    v := 5 - 3 * 7 + 8
END Expr;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('Expr');
    const variableV = new VariableDescriptor('v', new IntegerDescriptor(), true);
    entry.activity.instructions.push(
        new Instruction(OperatorCode.LoadVariable, variableV),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(5)),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(3)),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(7)),
        new Instruction(OperatorCode.Multiply),
        new Instruction(OperatorCode.Subtract),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(8)),
        new Instruction(OperatorCode.Add),
        new Instruction(OperatorCode.StoreVariable),
    );
    entry.declarations.variables.push(variableV);
    expectedIL.components.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Basic Expression Compare');
    test.end();
});

tape('Generator Binary Expression in Activity', (test) => {
    const code = `COMPONENT Expr;
  VARIABLE v: INTEGER;
  FINALLY
    v := 5 - 3 * 7 + 8
END Expr;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('Expr');
    const variableV = new VariableDescriptor('v', new IntegerDescriptor(), true);
    entry.finally.instructions.push(
        new Instruction(OperatorCode.LoadVariable, variableV),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(5)),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(3)),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(7)),
        new Instruction(OperatorCode.Multiply),
        new Instruction(OperatorCode.Subtract),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(8)),
        new Instruction(OperatorCode.Add),
        new Instruction(OperatorCode.StoreVariable),
    );
    entry.declarations.variables.push(variableV);
    expectedIL.components.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Basic Expression Compare');
    test.end();
});

tape('Generator Simple Boolean', (test) => {
    const code = `COMPONENT Expr;
  VARIABLE v: BOOLEAN;
  FINALLY
    v := FALSE
END Expr;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('Expr');
    const variableV = new VariableDescriptor('v', new BooleanDescriptor(), true);
    entry.finally.instructions.push(
        new Instruction(OperatorCode.LoadVariable, variableV),
        new Instruction(OperatorCode.LoadConstantBoolean, new BooleanDescriptor()),
        new Instruction(OperatorCode.StoreVariable),
    );
    entry.declarations.variables.push(variableV);
    expectedIL.components.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Basic Boolean Load');
    test.end();
});

tape('Generator Simple COS', (test) => {
    const code = `COMPONENT { ENTRYPOINT } Expr;
  FINALLY
    WRITE(COS(PI))
END Expr;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('Expr');
    entry.finally.instructions.push(
        new Instruction(OperatorCode.LoadConstantFloat, new FloatDescriptor(Math.PI)),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Cos, new IntegerDescriptor(1)),
        ),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Write, new IntegerDescriptor(1)),
        ),
    );
    expectedIL.components.push(entry);
    expectedIL.entryPoints.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Basic Boolean Load');
    test.end();
});

tape('Generator Builtin Procedure', (test) => {
    const code = `COMPONENT { ENTRYPOINT } Expr;
  FINALLY
    WRITE(REAL(5))
END Expr;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('Expr');
    entry.finally.instructions.push(
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(5)),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.ToReal, new IntegerDescriptor(1)),
        ),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Write, new IntegerDescriptor(1)),
        ),
    );
    expectedIL.components.push(entry);
    expectedIL.entryPoints.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Builtin REAL(x) procedure.');
    test.end();
});

tape('Generator Simple While', (test) => {
    const code = `COMPONENT { ENTRYPOINT } Expr;
  BEGIN
    WHILE TRUE DO
      WRITE("LOOPING"); WRITELINE
    END
END Expr;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('Expr');
    entry.begin.instructions.push(
        new Instruction(OperatorCode.LoadConstantBoolean, new BooleanDescriptor(true)),
        new Instruction(OperatorCode.BranchFalse, new JumpDescriptor(4)),
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('LOOPING')),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Write, new IntegerDescriptor(1)),
        ),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.WriteLine, new IntegerDescriptor(0)),
        ),
        new Instruction(OperatorCode.Branch, new JumpDescriptor(-6)),
    );
    expectedIL.components.push(entry);
    expectedIL.entryPoints.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Basic Boolean Load');
    test.end();
});

tape('Generator Double Hello World', async (test) => {
    const code = `COMPONENT { ENTRYPOINT } HelloWorld;
  BEGIN
    WRITE("Hello World"); WRITELINE
END HelloWorld;

COMPONENT HelloWorld2;
  BEGIN
    WRITE("Hello World\n")
END HelloWorld2;`;
    const expectedIL = new IL();
    const entry = new ComponentDescriptor('HelloWorld');
    entry.begin.instructions.push(
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('Hello World')),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Write, new IntegerDescriptor(1)),
        ),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.WriteLine, new IntegerDescriptor(0)),
        ),
    );
    expectedIL.components.push(entry);
    expectedIL.entryPoints.push(entry);
    const entry2 = new ComponentDescriptor('HelloWorld2');
    entry2.begin.instructions.push(
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('Hello World\n')),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Write, new IntegerDescriptor(1)),
        ),
    );
    expectedIL.components.push(entry2);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const symbols = checker.check(uri, parser.parse());
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.deepEqual(il, expectedIL, 'Two component IL compare');
    test.end();
});

// DISABLED FOR NOW.
tape('Generator Produced Consumer', (test) => {
    const code = `COMPONENT ProducerConsumer;
	CONSTANT 
		N = 5; (* producers *)
		M = 5; (* consumers *)
		K = 1000000; (* amount per producer *)
		C = 10; (* buffer capacity *)
		Output = FALSE;

	COMPONENT Producer REQUIRES DataAcceptor;
		VARIABLE i: INTEGER;
		BEGIN
			FOR i := 1 TO K DO
				DataAcceptor!Element(i)
			END;
			DataAcceptor!Finished
	END Producer;
	
	COMPONENT Consumer REQUIRES DataSource;
		VARIABLE x: INTEGER;
		BEGIN
			WHILE DataSource?Element DO 
				DataSource?Element(x);
				IF Output AND (x MOD (K DIV 10) = 0) THEN WRITE(x); WRITELINE END
			END;
			DataSource?Finished
	END Consumer;
	
	INTERFACE DataAcceptor;
		{ IN Element(x: INTEGER) } IN Finished
	END DataAcceptor;
	
	INTERFACE DataSource;
		{ OUT Element(x: INTEGER) } OUT Finished
	END DataSource;

	COMPONENT BoundedBuffer OFFERS DataAcceptor, DataSource;
		VARIABLE 
			a[position: INTEGER]: INTEGER {ARRAY}; 
			first, last: INTEGER; 
			nofProducers: INTEGER;
	
		IMPLEMENTATION DataAcceptor;
			BEGIN
				WHILE ?Element DO {EXCLUSIVE}
					AWAIT(last-first < C);
					?Element(a[last MOD C]); INC(last)
				END;
				?Finished; 
				BEGIN {EXCLUSIVE} DEC(nofProducers) END
		END DataAcceptor;
		
		IMPLEMENTATION DataSource;
			VARIABLE stop: BOOLEAN;
			BEGIN
				stop := FALSE;
				REPEAT {EXCLUSIVE}
					AWAIT((first < last) OR (nofProducers = 0));
					IF first < last THEN
						!Element(a[first MOD C]); INC(first)
					ELSE stop := TRUE
					END
				UNTIL stop;
				!Finished
		END DataSource;
		
        BEGIN
			NEW(a, C); first := 0; last := 0; nofProducers := N
	END BoundedBuffer;

	VARIABLE 
		buffer: BoundedBuffer; 
		producer[number: INTEGER]: Producer; 
		consumer[number: INTEGER]: Consumer; 
		i: INTEGER; 
	BEGIN
		WRITE(N); WRITE(" producers "); WRITE(M); WRITE(" consumers"); WRITELINE;
		NEW(buffer); 
		FOR i := 1 TO N DO 
			NEW(producer[i]); CONNECT(DataAcceptor(producer[i]), buffer)
		END;
		FOR i := 1 TO M DO
			NEW(consumer[i]); CONNECT(DataSource(consumer[i]), buffer)
		END;
		FOR i := 1 TO M DO DELETE(consumer[i]) END
END ProducerConsumer;`;
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    // TODO enable once checker is fixed.
    // there's an issue with symbol registration when using variables inside implementations
    // from the outer component.
    /*const symbols =*/ checker.check(uri, parser.parse());
    //const generator = new Generator();
    //const il = generator.generate(symbols);
    //test.deepEqual(il, il, 'Two component IL compare');
    test.end();
});

// objectPrintDepth not yet supported by @types/tape
const options = {
    /* objectPrintDepth: 5, */
};

tape('Hello World Component', options, (test) => {
    const code = `
INTERFACE HelloWorld;
  { IN Hello(hello: TEXT) OUT World(world: TEXT) }
END HelloWorld;

COMPONENT CompHelloWorld OFFERS HelloWorld;
  CONSTANT world = "World"; 
  VARIABLE input: TEXT;
  IMPLEMENTATION HelloWorld;
    BEGIN
      WHILE ?Hello DO
        ?Hello(input);
        WRITE(input); WRITE(" ");
        !World(world)
      END
  END HelloWorld;
  BEGIN
    WRITE("Hello World Starting\\n")
  FINALLY
    WRITE("Goodbye Hello World\\n")
END CompHelloWorld;

COMPONENT CompSender REQUIRES HelloWorld;
  VARIABLE world: TEXT; i: INTEGER;
  ACTIVITY
    WRITE("Starting Sender\\n");
    FOR i := 1 TO 10 DO
      WRITE("Sending\\n");
      HelloWorld!Hello("Hello");
      HelloWorld?World(world);
      WRITE(world)
    END
END CompSender;

COMPONENT { ENTRYPOINT } Connector;
  VARIABLE helloWorld: CompHelloWorld; sender: CompSender;
  BEGIN
    WRITE("STARTING CONNECTOR\\n");
    NEW(helloWorld);
    NEW(sender);
    CONNECT(HelloWorld(helloWorld), sender);
    DELETE(helloWorld);
    DELETE(sender)
END Connector;
`;
    const expectedIL = new IL();
    const writeSysCall = new Instruction(
        OperatorCode.SystemCall,
        new SystemCallDescriptor(SystemCallOperator.Write, new IntegerDescriptor(1)),
    );
    // interface HelloWorld
    const helloMessage = new MessageDescriptor('Hello');
    helloMessage.data.push(new TextDescriptor());
    const worldMessage = new MessageDescriptor('World');
    worldMessage.data.push(new TextDescriptor());
    const helloWorldProtocol = new ProtocolDescriptor(ProtocolType.Repeating);
    helloWorldProtocol.messages.push(helloMessage, worldMessage);
    const helloWorldService = new InterfaceDescriptor('HelloWorld');
    // TODO add this once symbols and checker are updated to support it.
    //helloWorldService.protocols.push(helloWorldProtocol);
    //expectedIL.interfaces.push(helloWorldService);

    // component CompHelloWorld
    const helloWorld = new ComponentDescriptor('CompHelloWorld');
    helloWorld.offers.push(helloWorldService);
    // TODO all variables are mutable for now
    const worldTextVar = new VariableDescriptor('world', new TextDescriptor(), true);
    // TODO currently not supported. CollectionVariables are always mutable but text is a special case.
    worldTextVar.indexTypes.push(new IntegerDescriptor());
    const inputVar = new VariableDescriptor('input', new TextDescriptor(), true);
    inputVar.indexTypes.push(new IntegerDescriptor());
    // order is important for deep equal this can easily cause issues.
    helloWorld.declarations.variables.push(worldTextVar, inputVar);
    helloWorld.declarations.init.instructions.push(
        new Instruction(OperatorCode.LoadVariable, worldTextVar),
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('World')),
        new Instruction(OperatorCode.StoreVariable),
    );
    helloWorld.begin.instructions.push(
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('Hello World Starting\n')),
        writeSysCall,
    );
    helloWorld.finally.instructions.push(
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('Goodbye Hello World\n')),
        writeSysCall,
    );

    // implementation HelloWorld
    const helloWorldImpl = new ImplementationDescriptor(helloWorldService);
    helloWorldImpl.begin.instructions.push(
        new Instruction(OperatorCode.LoadThis),
        new Instruction(OperatorCode.ReceiveTest, helloMessage),
        new Instruction(OperatorCode.BranchFalse, new JumpDescriptor(11)),
        new Instruction(OperatorCode.LoadVariable, inputVar),
        new Instruction(OperatorCode.LoadThis),
        new Instruction(OperatorCode.Receive, helloMessage),
        new Instruction(OperatorCode.LoadVariable, inputVar),
        writeSysCall,
        new Instruction(OperatorCode.LoadConstantCharacter, new CharacterDescriptor(' ')),
        writeSysCall,
        new Instruction(OperatorCode.LoadVariable, worldTextVar),
        new Instruction(OperatorCode.LoadThis),
        new Instruction(OperatorCode.Send, worldMessage),
        new Instruction(OperatorCode.Branch, new JumpDescriptor(-14)),
    );
    helloWorld.implementations.push(helloWorldImpl);
    expectedIL.components.push(helloWorld);

    // variable Hello World
    const sender = new ComponentDescriptor('CompSender');
    sender.requires.push(helloWorldService);
    const worldVar = new VariableDescriptor('world', new TextDescriptor(), true);
    worldVar.indexTypes.push(new IntegerDescriptor());
    const iVar = new VariableDescriptor('i', new IntegerDescriptor(), true);
    sender.declarations.variables.push(iVar, worldVar);
    sender.activity.instructions.push(
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('Starting Sender\n')),
        writeSysCall,
        new Instruction(OperatorCode.LoadVariable, iVar),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(1)),
        new Instruction(OperatorCode.StoreVariable),
        new Instruction(OperatorCode.LoadVariable, iVar),
        new Instruction(OperatorCode.LoadConstantInteger, new IntegerDescriptor(10)),
        new Instruction(OperatorCode.LessEqual),
        new Instruction(OperatorCode.BranchFalse, new JumpDescriptor(15)),
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('Sending\n')),
        writeSysCall,
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('Hello')),
        new Instruction(OperatorCode.LoadThis),
        new Instruction(OperatorCode.LoadService, helloWorldService),
        new Instruction(OperatorCode.Send, helloMessage),
        new Instruction(OperatorCode.LoadVariable, worldVar),
        new Instruction(OperatorCode.LoadThis),
        new Instruction(OperatorCode.LoadService, helloWorldService),
        new Instruction(OperatorCode.Receive, worldMessage),
        new Instruction(OperatorCode.LoadVariable, worldVar),
        writeSysCall,
        new Instruction(OperatorCode.LoadVariable, iVar),
        new Instruction(
            OperatorCode.SystemCall,
            new SystemCallDescriptor(SystemCallOperator.Inc, new IntegerDescriptor(1)),
        ),
        new Instruction(OperatorCode.Branch, new JumpDescriptor(-19)),
    );
    expectedIL.components.push(sender);

    // component Connector
    const entry = new ComponentDescriptor('Connector');
    const helloWorldVar = new VariableDescriptor('helloWorld', helloWorld, true);
    const senderVar = new VariableDescriptor('sender', sender, true);
    entry.declarations.variables.push(helloWorldVar, senderVar);
    entry.begin.instructions.push(
        new Instruction(OperatorCode.LoadConstantText, new TextDescriptor('STARTING CONNECTOR\n')),
        writeSysCall,
        new Instruction(OperatorCode.LoadVariable, helloWorldVar),
        new Instruction(OperatorCode.New, helloWorld),
        new Instruction(OperatorCode.LoadVariable, senderVar),
        new Instruction(OperatorCode.New, sender),
        new Instruction(OperatorCode.LoadVariable, helloWorldVar),
        new Instruction(OperatorCode.LoadService, helloWorldService),
        new Instruction(OperatorCode.LoadVariable, senderVar),
        new Instruction(OperatorCode.Connect),
        new Instruction(OperatorCode.LoadVariable, helloWorldVar),
        new Instruction(OperatorCode.Delete),
        new Instruction(OperatorCode.LoadVariable, senderVar),
        new Instruction(OperatorCode.Delete),
    );
    expectedIL.components.push(entry);
    expectedIL.entryPoints.push(entry);
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    const checker = new Checker();
    const ast = parser.parse();
    const symbols = checker.check(uri, ast);
    const generator = new Generator();
    const il = generator.generate(symbols);
    test.equal(il.entryPoints.length, expectedIL.entryPoints.length, 'Equal entrypoints.');
    test.equal(
        il.entryPoints[0].begin.instructions.length,
        expectedIL.entryPoints[0].begin.instructions.length,
        'Equal instruction number',
    );
    test.deepEqual(il.components[0], expectedIL.components[0], 'Component 0 equal.');
    test.deepEqual(il.components[1], expectedIL.components[1], 'Component 1 equal.');
    test.deepEqual(
        il.components[1].declarations,
        expectedIL.components[1].declarations,
        'Component 1 declarations equal.',
    );
    test.deepEqual(il.components[2], expectedIL.components[2], 'Component 2 equal.');
    test.deepEqual(
        il.components[2].declarations,
        expectedIL.components[2].declarations,
        'Component 2 declarations equal.',
    );
    test.deepEqual(
        il.components[2].declarations.variables.length,
        expectedIL.components[2].declarations.variables.length,
        'Component 2 declarations variables length equal.',
    );
    test.deepEqual(
        il.components[2].declarations.variables[0],
        expectedIL.components[2].declarations.variables[0],
        'Component 2 declarations variables[0] equal.',
    );
    test.deepEqual(
        il.components[2].declarations.variables,
        expectedIL.components[2].declarations.variables,
        'Component 2 declarations variables equal.',
    );
    test.deepEqual(il.entryPoints, expectedIL.entryPoints, 'EntryPoints equal.');
    test.deepEqual(il.components, expectedIL.components, 'Components equal.');
    test.deepEqual(il.interfaces, expectedIL.interfaces, 'Interfaces equal.');
    test.deepEqual(il, expectedIL, 'Complete IL compare.');
    test.end();
});
