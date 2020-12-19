import { default as tape } from 'tape';
import { Parser } from '../src/parser/parser';
import { Lexer } from '../src/lexer/lexer';
import { CompilerDiagnosis } from '../src/diagnosis/diagnosis';
import { Diagnosis } from '../src/diagnosis/diagnosis';
import { SourceLocation, SourceRange, SourcePosition } from '../src/source-location/location';
import {
    ProgramNode,
    ComponentNode,
    InterfaceNode,
    OfferedInterfaceNode,
    RequiredInterfaceNode,
    ComponentBodyNode,
    ImplementationNode,
    StatementSequenceNode,
    AttributeNode,
    StatementNode,
    ProcedureCallNode,
    TextNode,
    ExpressionNode,
    NameNode,
    DeclarationNode,
    UnaryExpressionNode,
} from '../src/ast/ast';
import { NonEmptyArray } from '@composita/ts-utility-types';

tape('Hello World', (test) => {
    const uri = '';
    const diagnosis: Diagnosis = new CompilerDiagnosis();
    const code = `COMPONENT { ENTRYPOINT } HelloWorld;
  BEGIN
    WRITE("Hello World"); WRITELINE
END HelloWorld;`;
    const lexer: Lexer = new Lexer(diagnosis, uri, code);
    const parser: Parser = new Parser(diagnosis, lexer);
    const componentLocation = new SourceLocation(
        uri,
        new SourceRange(new SourcePosition(0, ''.length), new SourcePosition(3, 'END HelloWorld;'.length)),
    );
    const attributeLocation = new SourceLocation(
        uri,
        new SourceRange(
            new SourcePosition(0, 'COMPONENT '.length),
            new SourcePosition(0, 'COMPONENT { ENTRYPOINT }'.length),
        ),
    );
    const attributeNameLocation = new SourceLocation(
        uri,
        new SourceRange(
            new SourcePosition(0, 'COMPONENT { '.length),
            new SourcePosition(0, 'COMPONENT { ENTRYPOINT'.length),
        ),
    );
    const componentNameLocation = new SourceLocation(
        uri,
        new SourceRange(
            new SourcePosition(0, 'COMPONENT { ENTRYPOINT } '.length),
            new SourcePosition(0, 'COMPONENT { ENTRYPOINT } HelloWorld'.length),
        ),
    );
    const beginBlockLocation = new SourceLocation(
        uri,
        new SourceRange(
            new SourcePosition(1, '  '.length),
            new SourcePosition(2, '    WRITE("Hello World"); WRITELINE'.length),
        ),
    );
    const writeProcedureLocation = new SourceLocation(
        uri,
        new SourceRange(new SourcePosition(2, '    '.length), new SourcePosition(2, '    WRITE("Hello World")'.length)),
    );
    const textLocation = new SourceLocation(
        uri,
        new SourceRange(
            new SourcePosition(2, '    WRITE('.length),
            new SourcePosition(2, '    WRITE("Hello World"'.length),
        ),
    );
    const writeLineProcedureLocation = new SourceLocation(
        uri,
        new SourceRange(
            new SourcePosition(2, '    WRITE("Hello World"); '.length),
            new SourcePosition(2, '    WRITE("Hello World"); WRITELINE'.length),
        ),
    );
    const writeNameLocation = new SourceLocation(
        uri,
        new SourceRange(new SourcePosition(2, '    '.length), new SourcePosition(2, '    WRITE'.length)),
    );
    const writeLineNameLocation = new SourceLocation(
        uri,
        new SourceRange(
            new SourcePosition(2, '    WRITE("Hello World"); '.length),
            new SourcePosition(2, '    WRITE("Hello World"); WRITELINE'.length),
        ),
    );
    const program = new ProgramNode(
        componentLocation,
        new Array<ComponentNode>(
            new ComponentNode(
                componentLocation,
                new NameNode(componentNameLocation, 'HelloWorld'),
                new Array<AttributeNode>(
                    new AttributeNode(attributeLocation, new NameNode(attributeNameLocation, 'ENTRYPOINT')),
                ),
                new Array<OfferedInterfaceNode>(),
                new Array<RequiredInterfaceNode>(),
                new ComponentBodyNode(
                    beginBlockLocation,
                    new Array<DeclarationNode>(),
                    new Array<ImplementationNode>(),
                    new StatementSequenceNode(
                        beginBlockLocation,
                        new Array<AttributeNode>(),
                        new NonEmptyArray<StatementNode>(
                            new ProcedureCallNode(
                                writeProcedureLocation,
                                new NameNode(writeNameLocation, 'WRITE'),
                                new Array<ExpressionNode>(
                                    new UnaryExpressionNode(
                                        textLocation,
                                        new Array<AttributeNode>(),
                                        new TextNode(textLocation, 'Hello World'),
                                    ),
                                ),
                            ),
                            new ProcedureCallNode(
                                writeLineProcedureLocation,
                                new NameNode(writeLineNameLocation, 'WRITELINE'),
                                new Array<ExpressionNode>(),
                            ),
                        ),
                    ),
                    undefined,
                    undefined,
                ),
            ),
        ),
        new Array<InterfaceNode>(),
    );
    const parsed = parser.parse();
    test.deepEqual(parsed.getLocation(), program.getLocation(), 'AST Location.');
    test.equal(parsed.getInterfaces().length, program.getInterfaces().length, 'Number of interfaces.');
    test.equal(parsed.getComponents().length, program.getComponents().length, 'Number of components.');
    program.getComponents().forEach((component, index) => {
        const other = parsed.getComponents()[index];
        test.deepEqual(other.getBody(), component.getBody(), 'Component body.');
        component
            .getBody()
            ?.getBeginBlock()
            ?.getStatements()
            .forEach((statement, statementIndex) => {
                test.deepEqual(
                    other.getBody()?.getBeginBlock()?.getStatements()[statementIndex],
                    statement,
                    `Statement ${statementIndex}.`,
                );
            });
    });
    test.deepEqual(parsed.getInterfaces(), program.getInterfaces(), 'Interfaces.');
    test.end();
});

tape('Parse variables', (test) => {
    const uri = '';
    const code = `COMPONENT HelloWorld;
  VARIABLE foo: REAL;
END HelloWorld;`;
    const diagnosis: Diagnosis = new CompilerDiagnosis();
    const lexer: Lexer = new Lexer(diagnosis, uri, code);
    const parser: Parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.notOk(diagnosis.hasErrors(), 'Check diagnosis errors');
    test.end();
});

tape('Parse empty interface', (test) => {
    const uri = '';
    const code = `INTERFACE HelloWorld;
END HelloWorld;`;
    const diagnosis: Diagnosis = new CompilerDiagnosis();
    const lexer: Lexer = new Lexer(diagnosis, uri, code);
    const parser: Parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.notOk(diagnosis.hasErrors(), 'Check diagnosis errors');
    test.end();
});

tape('Parse Producer Consumer', (test) => {
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
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
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.ok(!diagnosis.hasErrors(), 'No diagnosis errors.');
    test.end();
});

tape('Parse Eratosthenes', (test) => {
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const code = `COMPONENT Eratosthenes REQUIRES SystemTime; 
    CONSTANT 
        N = 10000; (* number limit *)
        Output = FALSE;
    
    INTERFACE NumberStream;
        { OUT Number(x: INTEGER) } OUT Finished
    END NumberStream;
    
    INTERFACE Prime;
        OUT PrimeNumber(x: INTEGER) | OUT Finished
    END Prime;
    
    COMPONENT Sieve OFFERS NumberStream, Prime REQUIRES NumberStream;
        VARIABLE prime: INTEGER; 
        
        IMPLEMENTATION Prime;
        BEGIN {EXCLUSIVE} 
            IF prime # 0 THEN !PrimeNumber(prime) ELSE !Finished END
        END Prime;
    
        IMPLEMENTATION NumberStream;
        VARIABLE i: INTEGER;
        BEGIN {EXCLUSIVE}
            WHILE NumberStream?Number DO
                NumberStream?Number(i);
                IF i MOD prime # 0 THEN !Number(i) END
            END;
            IF NumberStream?Finished THEN NumberStream?Finished END; 
            !Finished
        END NumberStream;
        
    BEGIN
        IF NumberStream?Number THEN NumberStream?Number(prime) 
        ELSE NumberStream?Finished; prime := 0 
        END
    END Sieve;
    
    COMPONENT NumberGenerator OFFERS NumberStream;
        IMPLEMENTATION NumberStream;
        VARIABLE i: INTEGER;
        BEGIN FOR i := 2 TO N DO !Number(i) END; !Finished
        END NumberStream;
    END NumberGenerator;
    
    PROCEDURE SystemTime(): INTEGER;
        VARIABLE t: INTEGER;
        BEGIN SystemTime!GetSystemTime; SystemTime?SystemTime(t); RETURN t
    END SystemTime;
    
    VARIABLE generator: NumberGenerator; sieve[i: INTEGER]: Sieve; i, p, start: INTEGER; 
    BEGIN
        start := SystemTime();
        NEW(generator); NEW(sieve[1]); CONNECT(NumberStream(sieve[1]), generator); i := 1;
        WHILE Prime(sieve[i])?PrimeNumber DO
            Prime(sieve[i])?PrimeNumber(p);
            IF Output THEN WRITE(p); WRITE(" ") END;
            INC(i); NEW(sieve[i]); CONNECT(NumberStream(sieve[i]), sieve[i-1])
        END;
        Prime(sieve[i])?Finished;
        WRITE(SystemTime()-start); WRITE("ms"); WRITELINE
END Eratosthenes;`;
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.ok(!diagnosis.hasErrors(), 'No diagnosis errors.');
    test.end();
});

tape('Parse TokenRing', (test) => {
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const code = `COMPONENT TokenRing REQUIRES SystemTime;
    CONSTANT 
        N = 1000; (* nodes *)
        K = 1000; (* circulations *)
        Output = FALSE;
        TimeOutput = TRUE;
        
    INTERFACE Neighbour;
        { IN PassToken } IN Finish
    END Neighbour;
    
    INTERFACE Control;
        IN InjectToken OUT ReturnToken
    END Control;

    COMPONENT Node OFFERS Neighbour, Control REQUIRES Neighbour;
        VARIABLE k: INTEGER;
        
        IMPLEMENTATION Control;
        BEGIN {EXCLUSIVE}
            ?InjectToken; Neighbour!PassToken; INC(k);
            AWAIT(k > K);
            !ReturnToken
        END Control;
        
        IMPLEMENTATION Neighbour;
        BEGIN {EXCLUSIVE}
            WHILE k <= K DO 
                ?PassToken; Neighbour!PassToken; INC(k);
                IF Output THEN WRITE(".") END
            END;
            IF ?PassToken THEN ?PassToken END;
            Neighbour!Finish; ?Finish
        END Neighbour;
        
        BEGIN k := 0
    END Node;
    
    PROCEDURE SystemTime(): INTEGER;
    VARIABLE t: INTEGER;
    BEGIN SystemTime!GetSystemTime; SystemTime?SystemTime(t); RETURN t
    END SystemTime;
    
    VARIABLE 
        node[number: INTEGER]: Node;
        i, start: INTEGER;
    BEGIN
        start := SystemTime();
        FOR i := 1 TO N DO NEW(node[i]) END;
        FOR i := 1 TO N DO
            CONNECT(Neighbour(node[i]), node[i MOD N + 1])
        END;
        Control(node[1])!InjectToken; Control(node[1])?ReturnToken;
        IF TimeOutput THEN
            WRITE(SystemTime()-start); WRITE("ms"); WRITELINE
        END
END TokenRing;`;
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.ok(!diagnosis.hasErrors(), 'No diagnosis errors.');
    test.end();
});

tape('Parse Mandelbrot', (test) => {
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const code = `COMPONENT Mandelbrot REQUIRES SystemTime;
CONSTANT 
    K = 5000; H = 10; V = 10;
    Resolution = 0.05; 
    Left = -2.0; Top = -1.0; 
    Right = 2.0; Bottom = 1.0;
    Output = FALSE;

INTERFACE MandelbrotSet;
    IN Start(N, M: INTEGER; x0, y0, dx, dy: REAL)
    { OUT Value(x, y: INTEGER; zreal, zimag: REAL) }
    OUT Finish
END MandelbrotSet;

COMPONENT MandelbrotTask OFFERS MandelbrotSet;
    IMPLEMENTATION MandelbrotSet;
    VARIABLE 
        N, M: INTEGER; x0, y0, dx, dy: REAL;
        zreal[x, y: INTEGER]: REAL {ARRAY};
        zimag[x, y: INTEGER]: REAL {ARRAY};
        x, y, k: INTEGER; zreal2, zimag2, zri, creal, cimag, a, b: REAL;
    BEGIN
        ?Start(N, M, x0, y0, dx, dy);
        NEW(zreal, N, M); NEW(zimag, N, M);
        FOR x := 0 TO N-1 DO 
            FOR y := 0 TO M-1 DO
                zreal[x, y] := 0.0; zimag[x, y] := 0.0
            END
        END;
        FOR k := 1 TO K DO
            FOR x := 0 TO N-1 DO
                FOR y := 0 TO M-1 DO
                    zreal2 := zreal[x, y] * zreal[x, y]; zimag2 := zimag[x, y] * zimag[x, y];
                    IF SQRT(zreal2 + zimag2) <= 2.0 THEN
                        creal := x0 + dx * x; cimag := y0 + dy * y; zri := zreal[x, y] * zimag[x, y];
                        a := zreal2 - zimag2 + creal;
                        b := 2 * zri + cimag;
                        zreal[x, y] := a; zimag[x, y] := b
                    END
                END
            END
        END;
        FOR x := 0 TO N-1 DO
            FOR y := 0 TO M-1 DO
                !Value(x, y, zreal[x, y], zimag[x, y])
            END
        END;
        !Finish
    END MandelbrotSet;
END MandelbrotTask;

PROCEDURE SystemTime(): INTEGER;
VARIABLE t: INTEGER;
BEGIN SystemTime!GetSystemTime; SystemTime?SystemTime(t); RETURN t
END SystemTime;

VARIABLE 
    N, M, i, j, x, y: INTEGER; L, T, a, b: REAL;
    task[i, j: INTEGER]: MandelbrotTask;
    zreal[x, y: INTEGER]: REAL {ARRAY}; 
    zimag[x, y: INTEGER]: REAL {ARRAY};
    start: INTEGER;
BEGIN
    start := SystemTime();
    N := INTEGER((Right-Left) / (Resolution * H));
    M := INTEGER((Bottom-Top) / (Resolution * V));
    FOR i := 0 TO H-1 DO
        FOR j := 0 TO V-1 DO
            L := Left + i * N * Resolution; T := Top + j * M * Resolution;
            NEW(task[i, j]); task[i, j]!Start(N, M, L, T, Resolution, Resolution)
        END
    END;
    NEW(zreal, H*N, V*M); NEW(zimag, H*N, V*M);
    FOR i := 0 TO H-1 DO
        FOR j := 0 TO V-1 DO
            WHILE task[i, j]?Value DO
                task[i, j]?Value(x, y, a, b);
                zreal[i * N + x, j * M + y] := a;
                zimag[i* N + x, j * M + y] := b
            END;
            task[i, j]?Finish
        END
    END;
    WRITE(SystemTime()-start); WRITE("ms"); WRITELINE;
    IF Output THEN
        FOR y := 0 TO V*M-1 DO
            FOR x := 0 TO H*N-1 DO
                a := zreal[x, y] * zreal[x, y]; b := zimag[x, y] * zimag[x, y];
                IF SQRT(a + b) <= 2 THEN WRITE(".") ELSE WRITE(" ") END
            END;
            WRITELINE
        END
    END
END Mandelbrot;`;
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.ok(!diagnosis.hasErrors(), 'No diagnosis errors.');
    test.end();
});

tape('Parse City', (test) => {
    const uri = '';
    const diagnosis = new CompilerDiagnosis();
    const code = `COMPONENT City REQUIRES SystemTime;
    CONSTANT 
        N = 1000; (* houses *)
        K = 10; (* consumptions per house *)
        C = 100; (* maximum electricity reserve *)

    INTERFACE House;
        IN Construct IN Destruct
    END House;
    
    INTERFACE Garage;
        { IN ParkCar }
    END Garage;
    
    INTERFACE Electricity;
        { IN Request OUT Electricity }
    END Electricity;
    
    INTERFACE Water;
        { IN Request OUT Water }
    END Water;
    
    COMPONENT StandardHouse OFFERS House, Garage REQUIRES Water, Electricity;
        IMPLEMENTATION House;
            VARIABLE i: INTEGER;
            BEGIN {EXCLUSIVE}
                ?Construct;
                FOR i := 1 TO K DO
                    Electricity!Request; Water!Request; 
                    Electricity?Electricity; Water?Water
                END;
                ?Destruct
        END House;
        
        IMPLEMENTATION Garage;
            BEGIN WHILE ?ParkCar DO ?ParkCar END
        END Garage;
    END StandardHouse;
    
    COMPONENT HydroelectricPowerPlant OFFERS Electricity REQUIRES Water;
        VARIABLE energy, customers: INTEGER;
    
        IMPLEMENTATION Electricity;
        BEGIN
            BEGIN {EXCLUSIVE} INC(customers) END;
            WHILE ?Request DO {EXCLUSIVE}
                ?Request; 
                AWAIT(energy > 0); DEC(energy);
                !Electricity 
            END;
            BEGIN {EXCLUSIVE} DEC(customers) END
        END Electricity;
        
        BEGIN energy := 0; customers := 0
        ACTIVITY {EXCLUSIVE} 
            AWAIT(customers > 0);
            REPEAT
                AWAIT((energy = 0) OR (customers = 0));
                IF energy = 0 THEN
                    Water!Request; Water?Water; INC(energy)
                END
            UNTIL customers = 0
    END HydroelectricPowerPlant;
    
    COMPONENT River OFFERS Water;
        IMPLEMENTATION Water;
        BEGIN 
            WHILE ?Request DO 
                ?Request; !Water 
            END
        END Water;
    END River;
    
    PROCEDURE SystemTime(): INTEGER;
        VARIABLE t: INTEGER;
        BEGIN SystemTime!GetSystemTime; SystemTime?SystemTime(t); RETURN t
    END SystemTime;
    
    VARIABLE
        house[number: INTEGER]: ANY(House | Water, Electricity);
        powerPlant: HydroelectricPowerPlant;
        river: River;
        i, startTime: INTEGER;
    BEGIN
        startTime := SystemTime();
        NEW(river); NEW(powerPlant); CONNECT(Water(powerPlant), river);
        FOR i := 1 TO N DO
            NEW(house[i], StandardHouse); 
            CONNECT(Electricity(house[i]), powerPlant); 
            CONNECT(Water(house[i]), river)
        END;
        FOREACH i OF house DO house[i]!Construct END;
        FOREACH i OF house DO house[i]!Destruct END;    
        (* just for time measurement *)
        FOR i := 1 TO N DO DELETE(house[i]) END;
        WRITE(SystemTime()-startTime); WRITE("ms"); WRITELINE
END City;`;
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.ok(!diagnosis.hasErrors(), 'No diagnosis errors.');
    test.end();
});

tape('Parse GCTest', (test) => {
    const uri = '';
    const diagnosis: Diagnosis = new CompilerDiagnosis();
    const code = `COMPONENT GCTest REQUIRES SystemTime, FileSystem;                
    PROCEDURE SystemTime(): INTEGER;
        VARIABLE t: INTEGER;
        BEGIN SystemTime!GetSystemTime; SystemTime?SystemTime(t); RETURN t
    END SystemTime;
    
    PROCEDURE MakeInteger(x: INTEGER): TEXT;
        VARIABLE k, d, i: INTEGER; a[i: INTEGER]: CHARACTER; t: TEXT;
        BEGIN
            i := 0;
            IF x < 0 THEN a[i] := "-"; INC(i); x := -x END;
            k := 10; WHILE k <= x DO k := k * 10 END;
            REPEAT
                k := k DIV 10;
                d := (x DIV k) MOD 10;
                a[i] := CHARACTER(INTEGER("0") + d); INC(i)
            UNTIL k = 1;
            NEW(t, i+1);
            FOR k := 0 TO i-1 DO t[k] := a[k] END;
            t[i] := 0X;
            RETURN t
    END MakeInteger;
    
    CONSTANT Runs = 1000;
    VARIABLE k, startTime: INTEGER; test: TokenRing;
        time[x: INTEGER]: INTEGER;
    BEGIN
        FOR k := 1 TO Runs DO 
            startTime := SystemTime();
            NEW(test); CONNECT(SystemTime(test), SystemTime);
            DELETE(test);
            time[k] := SystemTime()-startTime
        END;
        WRITE("Write results"); WRITELINE;
        FileSystem!New("GCTest.txt"); FileSystem?Done;
        FOR k := 1 TO Runs DO
            FileSystem!WriteText(MakeInteger(time[k]));
            FileSystem!Write(0DX);
            WRITE(time[k]); WRITE("ms ")
        END;
        WRITE("DONE"); WRITELINE;
        FileSystem!Close
END GCTest;`;
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.ok(!diagnosis.hasErrors(), 'No diagnosis errors.');
    test.end();
});

tape('Parse Library', (test) => {
    const uri = '';
    const diagnosis: Diagnosis = new CompilerDiagnosis();
    const code = `COMPONENT Library REQUIRES SystemTime;
    CONSTANT
        N = 1000; (* customers *)
        M = 10; (* libraries *)
        K = 10;
        ISBNBasis = 54321;
        Output = FALSE;

    INTERFACE Book;
        { IN GetISBN OUT ISBN(x: INTEGER)
        | IN GetTitle OUT Title(x: TEXT)
        | IN GetContent OUT Content(x: TEXT) }
    END Book;
    
    INTERFACE LibraryService;
        { IN LendBook(isbn: INTEGER) ( OUT Book(b: ANY(Book)) | OUT Unavailable ) 
        | IN ReturnBook(b: ANY(Book))
        | IN ListCatalogue { OUT BookEntry(isbn: INTEGER) } OUT EndOfList }
    END LibraryService;
    
    COMPONENT PublicLibrary OFFERS LibraryService;
        VARIABLE book[isbn: INTEGER]: ANY(Book);
    
        IMPLEMENTATION LibraryService;
        VARIABLE isbn: INTEGER; b: ANY(Book); title: TEXT;
        BEGIN
            WHILE ?LendBook OR ?ReturnBook OR ?ListCatalogue DO
                IF ?LendBook THEN {EXCLUSIVE}
                    ?LendBook(isbn); 
                    IF ~EXISTS(book[isbn]) THEN !Unavailable
                    ELSE !Book(book[isbn]) (* book[isbn] is now empty *)
                    END
                ELSIF ?ReturnBook THEN {EXCLUSIVE}
                    ?ReturnBook(b); b!GetISBN; b?ISBN(isbn); 
                    MOVE(b, book[isbn])
                ELSE {SHARED}
                    ?ListCatalogue;
                    FOREACH isbn OF book DO 
                        !BookEntry(isbn)
                    END;
                    !EndOfList
                END
            END
        END LibraryService;
    
        CONSTANT ISBNBasis = 54321; K = 10;
        VARIABLE isbn: INTEGER; b: LibraryBook;
        BEGIN
            FOR isbn := ISBNBasis + 1 TO ISBNBasis + K DO
                NEW(b); BookInitialization(b)!Initialize(isbn, "Memoiren", " ... "); 
                BookInitialization(b)?Initialized; MOVE(b, book[isbn])
            END
    END PublicLibrary;
    
    INTERFACE BookInitialization;
        IN Initialize(isbn: INTEGER; title, content: TEXT) OUT Initialized
    END BookInitialization;
    
    COMPONENT LibraryBook OFFERS BookInitialization, Book;
        VARIABLE isbn: INTEGER; title, content: TEXT;
        
        IMPLEMENTATION BookInitialization;
            BEGIN {EXCLUSIVE} ?Initialize(isbn, title, content); !Initialized
        END BookInitialization;
        
        IMPLEMENTATION Book;
        BEGIN
            WHILE ?GetISBN OR ?GetTitle OR ?GetContent DO
                IF ?GetISBN THEN {SHARED} ?GetISBN; !ISBN(isbn)
                ELSIF ?GetTitle THEN {SHARED} ?GetTitle; !Title(title)
                ELSE {SHARED} ?GetContent; !Content(content)
                END
            END
        END Book;
    END LibraryBook;
    
    COMPONENT LibraryCustomer REQUIRES LibraryService [1..*];
        VARIABLE interested, count, k, isbn: INTEGER; title, content: TEXT; b: ANY(Book);
        
        BEGIN
            FOR k := 1 TO M DO
                LibraryService[k]!ListCatalogue;
                WHILE LibraryService[k]?BookEntry DO
                    LibraryService[k]?BookEntry(isbn);
                    IF Output THEN WRITE("Book "); WRITE(isbn); WRITELINE END;
                    IF k MOD 10 = 1 THEN interested := isbn END
                END;
                LibraryService[k]?EndOfList;
                LibraryService[k]!LendBook(interested);
                IF LibraryService[k]?Book THEN 
                    LibraryService[k]?Book(b); 
                    IF Output THEN WRITE("Book lent "); WRITE(interested); WRITELINE END;
                    b!GetISBN; b?ISBN(isbn); ASSERT(isbn = interested); 
                    b!GetTitle; b?Title(title);
                    b!GetContent; b?Content(content);
                    LibraryService[k]!ReturnBook(b) (* b is now empty *);
                    IF Output THEN WRITE("Book returned"); WRITELINE END
                ELSE
                    LibraryService[k]?Unavailable;
                    IF Output THEN WRITE("Book unavailable"); WRITELINE END
                END
            END
    END LibraryCustomer;

    PROCEDURE SystemTime(): INTEGER;
    VARIABLE t: INTEGER;
    BEGIN SystemTime!GetSystemTime; SystemTime?SystemTime(t); RETURN t
    END SystemTime;

    VARIABLE
        customer[number: INTEGER]: LibraryCustomer;
        library[number: INTEGER]: PublicLibrary;
        i, k, startTime: INTEGER;
    BEGIN
        startTime := SystemTime();
        FOR k := 1 TO M DO NEW(library[k]) END;
        FOR i := 1 TO N DO 
            NEW(customer[i]); 
            FOR k := 1 TO M DO
                CONNECT(LibraryService[k](customer[i]), library[k])
            END
        END;
        (* just for time measurement *)
        FOR i := 1 TO N DO DELETE(customer[i]) END;
        FOR k := 1 TO M DO DELETE(library[k]) END;
        WRITE(SystemTime()-startTime); WRITE(" ms"); WRITELINE
END Library;`;
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.ok(!diagnosis.hasErrors(), 'No diagnosis errors.');
    test.end();
});

tape('Parse Library', (test) => {
    const uri = '';
    const diagnosis: Diagnosis = new CompilerDiagnosis();
    const code = `COMPONENT News REQUIRES SystemTime;
    CONSTANT 
        N = 1000; (* customers *)
        M = 10; (* reporters *)
        K = 10; (* news per reporter *)
        Output = FALSE;

    INTERFACE Broadcasting;
        { OUT News(x: TEXT) } OUT Finished
    END Broadcasting;
    
    INTERFACE Editorial;
        { IN News(x: TEXT) } IN Finished
    END Editorial;
    
    COMPONENT NewsCenter OFFERS Broadcasting, Editorial;
        VARIABLE news[pos: INTEGER]: TEXT; lastPos, finishedRep: INTEGER;  
        
        IMPLEMENTATION Broadcasting;
        VARIABLE i: INTEGER;
        BEGIN {SHARED}
            i := 0;
            REPEAT
                AWAIT((i < lastPos) OR (finishedRep = M));
                IF i < lastPos THEN !News(news[i]); INC(i) END
            UNTIL (i = lastPos) AND (finishedRep = M);
            !Finished
        END Broadcasting;
        
        IMPLEMENTATION Editorial;
        BEGIN
            WHILE ?News DO {EXCLUSIVE}
                ?News(news[lastPos]); INC(lastPos)
            END;
            ?Finished; 
            BEGIN {EXCLUSIVE} INC(finishedRep) END
        END Editorial;
        
        BEGIN lastPos := 0; finishedRep := 0
    END NewsCenter;

    COMPONENT Reporter REQUIRES Editorial;
    VARIABLE i: INTEGER;
    BEGIN
        FOR i := 1 TO K DO
            IF i MOD 2 = 0 THEN Editorial!News("News from white house") 
            ELSE Editorial!News("News from houses of parliaments")
            END
        END;
        Editorial!Finished
    END Reporter;
    
    COMPONENT Customer REQUIRES Broadcasting;
    VARIABLE x: TEXT;
    BEGIN
        WHILE Broadcasting?News DO
            Broadcasting?News(x); 
            IF Output THEN WRITE(x); WRITELINE END
        END;
        Broadcasting?Finished
    END Customer;
    
    PROCEDURE SystemTime(): INTEGER;
    VARIABLE t: INTEGER;
    BEGIN SystemTime!GetSystemTime; SystemTime?SystemTime(t); RETURN t
    END SystemTime;

    VARIABLE 
        center: NewsCenter;
        customer[number: INTEGER]: Customer; 
        reporter[number: INTEGER]: Reporter; 
        i, startTime: INTEGER;
    BEGIN
        startTime := SystemTime();
        NEW(center);
        FOR i := 1 TO N DO
            NEW(customer[i]); CONNECT(Broadcasting(customer[i]), center)
        END;
        FOR i := 1 TO M DO
            NEW(reporter[i]); CONNECT(Editorial(reporter[i]), center)
        END;
        FOR i := 1 TO N DO
            DELETE(customer[i])
        END;
        WRITE(SystemTime()-startTime); WRITE("ms"); WRITELINE
END News;`;
    const lexer = new Lexer(diagnosis, uri, code);
    const parser = new Parser(diagnosis, lexer);
    parser.parse();
    test.ok(!diagnosis.hasErrors(), 'No diagnosis errors.');
    test.end();
});
