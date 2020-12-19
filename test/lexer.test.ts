import { default as tape } from 'tape';
import { Lexer } from '../src/lexer/lexer';
import {
    FixToken,
    TextToken,
    IdentifierToken,
    Token,
    IntegerNumberToken,
    HexNumberToken,
    FloatNumberToken,
    Tag,
} from '../src/tokens/tokens';
import { SourceLocation, SourceRange, SourcePosition } from '../src/source-location/location';
import { CompilerDiagnosis } from '../src/diagnosis/diagnosis';

tape('Lexing Component', (test) => {
    const uri = '';
    const code = 'COMPONENT';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const tag = Tag.Component;
    const token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        tag,
    );
    test.deepEqual(lexer.next(), token, 'Component Token.');
    test.end();
});

tape('Lexing Text', (test) => {
    const uri = '';
    const code = '"Foo\\"bar"';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new TextToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        'Foo"bar',
    );
    test.deepEqual(lexer.peek(1), token, 'Text Token.');
    test.deepEqual(lexer.next(), token, 'Text Token.');
    test.end();
});

tape('Lexing Integer', (test) => {
    const uri = '';
    const code = '1234';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new IntegerNumberToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        1234,
    );
    test.deepEqual(lexer.peek(1), token, 'Integer Token.');
    test.deepEqual(lexer.next(), token, 'Integer Token.');
    test.end();
});

tape('Lexing Integer 0', (test) => {
    const uri = '';
    const code = '0';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new IntegerNumberToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        0,
    );
    test.deepEqual(lexer.peek(1), token, 'Integer Token.');
    test.deepEqual(lexer.next(), token, 'Integer Token.');
    test.end();
});

tape('Lexing Integer 9', (test) => {
    const uri = '';
    const code = '9';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new IntegerNumberToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        9,
    );
    test.deepEqual(lexer.peek(1), token, 'Integer Token.');
    test.deepEqual(lexer.next(), token, 'Integer Token.');
    test.end();
});

tape('Lexing Hex', (test) => {
    const uri = '';
    const code = '1234H';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new HexNumberToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        Number.parseInt('0x' + 1234),
    );
    test.deepEqual(lexer.peek(1), token, 'Hex Token.');
    test.deepEqual(lexer.next(), token, 'Hex Token.');
    test.end();
});

tape('Lexing Hex', (test) => {
    const uri = '';
    const code = '1A34H';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new HexNumberToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        Number.parseInt('0x1A34'),
    );
    test.deepEqual(lexer.peek(1), token, 'Hex Token.');
    test.deepEqual(lexer.next(), token, 'Hex Token.');
    test.end();
});

tape('Lexing Dot Float', (test) => {
    const uri = '';
    const code = '1.2';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new FloatNumberToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        12,
        -1,
    );
    test.deepEqual(lexer.peek(1), token, 'Dot Float Token.');
    test.deepEqual(lexer.next(), token, 'Dot Float Token.');
    test.end();
});

tape('Lexing Scaled Float', (test) => {
    const uri = '';
    const code = '1.E-2';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new FloatNumberToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        1,
        -2,
    );
    test.deepEqual(lexer.peek(1), token, 'Scaled Float Token.');
    test.deepEqual(lexer.next(), token, 'Scaled Float Token.');
    test.end();
});

tape('Lexing Semicolon FixToken', (test) => {
    const uri = '';
    const code = ';';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        Tag.Semicolon,
    );
    test.deepEqual(lexer.peek(1), token, 'Semicolon FixToken.');
    test.deepEqual(lexer.next(), token, 'Semicolon FixToken.');
    test.end();
});

tape('Lexing ColonEqual FixToken', (test) => {
    const uri = '';
    const code = ':=';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        Tag.ColonEqual,
    );
    const eot = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(new SourcePosition(0, code.length), new SourcePosition(0, code.length)),
        ),
        Tag.EOT,
    );
    test.deepEqual(lexer.peek(2), eot, 'EOT FixToken.');
    test.deepEqual(lexer.next(), token, 'ColonEqual FixToken.');
    test.end();
});

tape('Lexing Parentheses FixToken with State Save', (test) => {
    const uri = '';
    const code = '()';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, 1))),
        Tag.OpenParentheses,
    );
    const closetoken = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 1), new SourcePosition(0, 2))),
        Tag.CloseParentheses,
    );
    lexer.saveState();
    lexer.saveState();
    test.deepEqual(lexer.next(), token, 'OpenParentheses FixToken.');
    lexer.restoreState();
    test.deepEqual(lexer.next(), token, 'OpenParentheses FixToken.');
    test.deepEqual(lexer.next(), closetoken, 'CloseParentheses FixToken.');
    lexer.restoreState();
    test.deepEqual(lexer.next(), token, 'OpenParentheses FixToken.');
    test.deepEqual(lexer.next(), closetoken, 'CloseParentheses FixToken.');
    test.end();
});

tape('Lexing Ellipsis', (test) => {
    const uri = '';
    const code = '[0..*]';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    let token: Token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, 1))),
        Tag.OpenSquareBracket,
    );
    test.deepEqual(lexer.next(), token, 'OpenSquareBracket FixToken.');
    token = new IntegerNumberToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 1), new SourcePosition(0, 2))),
        0,
    );
    test.deepEqual(lexer.next(), token, 'Number 0.');
    token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 2), new SourcePosition(0, 4))),
        Tag.Ellipsis,
    );
    test.deepEqual(lexer.next(), token, 'Ellipsis FixToken.');
    token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 4), new SourcePosition(0, 5))),
        Tag.Asterisk,
    );
    test.deepEqual(lexer.next(), token, 'Asterisk FixToken.');
    token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 5), new SourcePosition(0, 6))),
        Tag.CloseSquareBracket,
    );
    test.deepEqual(lexer.next(), token, 'CloseSquareBracket FixToken.');
    test.end();
});

tape('EOT with Peek', (test) => {
    const uri = '';
    const code = '';
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    const token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, code.length))),
        Tag.EOT,
    );
    test.deepEqual(lexer.peek(1), token, 'EOT Token peek(1).');
    test.deepEqual(lexer.peek(2), token, 'EOT Token peek(2).');
    test.deepEqual(lexer.peek(10000000), token, 'EOT Token peek(10000000).');
    test.deepEqual(lexer.next(), token, 'EOT Token next().');
    test.deepEqual(lexer.next(), token, 'EOT Token next().next().');
    test.end();
});

tape('Hello World', (test) => {
    const uri = '';
    const code = `COMPONENT HelloWorld;
  BEGIN
    WRITE("Hello World"); WRITELINE;
END HelloWorld;`;
    const lexer: Lexer = new Lexer(new CompilerDiagnosis(), uri, code);
    let token: Token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(0, 0), new SourcePosition(0, 'COMPONENT'.length))),
        Tag.Component,
    );
    test.deepEqual(lexer.next(), token, 'Component Keyword.');
    token = new IdentifierToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(0, 'COMPONENT '.length),
                new SourcePosition(0, 'COMPONENT HelloWorld'.length),
            ),
        ),
        'HelloWorld',
    );
    test.deepEqual(lexer.next(), token, 'Component Name Token.');
    token = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(0, 'COMPONENT HelloWorld'.length),
                new SourcePosition(0, 'COMPONENT HelloWorld;'.length),
            ),
        ),
        Tag.Semicolon,
    );
    test.deepEqual(lexer.next(), token, 'Semicolon Token.');
    token = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(new SourcePosition(1, '  '.length), new SourcePosition(1, '  BEGIN'.length)),
        ),
        Tag.Begin,
    );
    test.deepEqual(lexer.next(), token, 'Begin Token.');
    token = new IdentifierToken(
        new SourceLocation(
            uri,
            new SourceRange(new SourcePosition(2, '    '.length), new SourcePosition(2, '    WRITE'.length)),
        ),
        'WRITE',
    );
    test.deepEqual(lexer.next(), token, 'Write Identifier.');
    token = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(new SourcePosition(2, '    WRITE'.length), new SourcePosition(2, '    WRITE('.length)),
        ),
        Tag.OpenParentheses,
    );
    test.deepEqual(lexer.next(), token, 'OpenParenthesis Token.');
    token = new TextToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(2, '    WRITE('.length),
                new SourcePosition(2, '    WRITE("Hello World"'.length),
            ),
        ),
        'Hello World',
    );
    test.deepEqual(lexer.next(), token, 'Text Token.');
    token = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(2, '    WRITE("Hello World"'.length),
                new SourcePosition(2, '    WRITE("Hello World")'.length),
            ),
        ),
        Tag.CloseParentheses,
    );
    test.deepEqual(lexer.next(), token, 'CloseParenthesis Token.');
    token = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(2, '    WRITE("Hello World")'.length),
                new SourcePosition(2, '    WRITE("Hello World");'.length),
            ),
        ),
        Tag.Semicolon,
    );
    test.deepEqual(lexer.next(), token, 'Semicolon Token.');
    token = new IdentifierToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(2, '    WRITE("Hello World"); '.length),
                new SourcePosition(2, '    WRITE("Hello World"); WRITELINE'.length),
            ),
        ),
        'WRITELINE',
    );
    test.deepEqual(lexer.next(), token, 'Writeline Identifier.');
    token = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(2, '    WRITE("Hello World"); WRITELINE'.length),
                new SourcePosition(2, '    WRITE("Hello World"); WRITELINE;'.length),
            ),
        ),
        Tag.Semicolon,
    );
    test.deepEqual(lexer.next(), token, 'Semicolon Token.');
    token = new FixToken(
        new SourceLocation(uri, new SourceRange(new SourcePosition(3, ''.length), new SourcePosition(3, 'END'.length))),
        Tag.End,
    );
    test.deepEqual(lexer.next(), token, 'End Token.');
    token = new IdentifierToken(
        new SourceLocation(
            uri,
            new SourceRange(new SourcePosition(3, 'END '.length), new SourcePosition(3, 'END HelloWorld'.length)),
        ),
        'HelloWorld',
    );
    test.deepEqual(lexer.next(), token, 'Component Name Token.');
    token = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(3, 'END HelloWorld'.length),
                new SourcePosition(3, 'END HelloWorld;'.length),
            ),
        ),
        Tag.Semicolon,
    );
    test.deepEqual(lexer.next(), token, 'Semicolon Token.');
    token = new FixToken(
        new SourceLocation(
            uri,
            new SourceRange(
                new SourcePosition(3, 'END HelloWorld;'.length),
                new SourcePosition(3, 'END HelloWorld;'.length),
            ),
        ),
        Tag.EOT,
    );
    test.deepEqual(lexer.next(), token, 'EOT Token.');
    test.end();
});
