import { SourceLocation, SourceRange, SourcePosition } from '../source-location/location';
import {
    Token,
    IdentifierToken,
    TextToken,
    FixToken,
    ErrorToken,
    NumberToken,
    HexNumberToken,
    IntegerNumberToken,
    FloatNumberToken,
    Tag,
    tagFromString,
} from '../tokens/tokens';
import { Optional } from '@composita/ts-utility-types';
import { Diagnosis, CompilerDiagnostic } from '../diagnosis/diagnosis';
import { DiagnosticSeverity } from 'vscode-languageserver-types';

const enum SpecialCharacter {
    Null = '\0',
    Backspace = '\b',
    Space = ' ',
    HorizontalTab = '\t',
    VerticalTab = '\v',
    FormFeed = '\f',
    CarriageReturn = '\r',
    LineFeed = '\n',
    Backslash = '\\',
    SingleQuote = "'",
    DoubleQuote = '"',
}

function toSpecialCharacter(character: Optional<string>): Optional<SpecialCharacter> {
    switch (character) {
        case '0':
            return SpecialCharacter.Null;
        case 'b':
            return SpecialCharacter.Backspace;
        case 't':
            return SpecialCharacter.HorizontalTab;
        case 'v':
            return SpecialCharacter.VerticalTab;
        case 'f':
            return SpecialCharacter.FormFeed;
        case 'r':
            return SpecialCharacter.CarriageReturn;
        case 'n':
            return SpecialCharacter.LineFeed;
        case '\\':
            return SpecialCharacter.Backslash;
        case "'":
            return SpecialCharacter.SingleQuote;
        case '"':
            return SpecialCharacter.DoubleQuote;
        default:
            return undefined;
    }
}

class LexerState {
    public tokenCache = new Array<Token>();
    public currentPosition = 0;
    public currentLinePosition = 0;
    public currentLine = 0;

    copy(): LexerState {
        const newState = new LexerState();
        newState.tokenCache = new Array<Token>(...this.tokenCache);
        newState.currentPosition = this.currentPosition;
        newState.currentLinePosition = this.currentLinePosition;
        newState.currentLine = this.currentLine;
        return newState;
    }
}

export class Lexer {
    constructor(diagnosis: Diagnosis, uri: string, code: string) {
        this.diagnosis = diagnosis;
        this.uri = uri;
        this.code = Array.from(code);
        this.state = new LexerState();
        this.stateStack = new Array<LexerState>();
    }

    private readonly diagnosis: Diagnosis;
    private readonly uri: string;
    private readonly code: Array<string>;
    private state: LexerState;
    private stateStack: Array<LexerState>;

    private advance(n = 1): void {
        while (n > 0 && !this.isEOT()) {
            if (this.isLineFeed()) {
                this.state.currentLine = this.state.currentLine + 1;
                this.state.currentLinePosition = 0;
            } else {
                this.state.currentLinePosition = this.state.currentLinePosition + 1;
            }
            this.state.currentPosition = this.state.currentPosition + 1;
            n = n - 1;
        }
    }

    private getCurrentCharacter(): Optional<string> {
        return !this.isEOT() ? this.code[this.state.currentPosition] : undefined;
    }

    private createSourceLocation(range: SourceRange): SourceLocation {
        return new SourceLocation(this.uri, range);
    }

    private createSourcePosition(): SourcePosition {
        return new SourcePosition(this.state.currentLine, this.state.currentLinePosition);
    }

    private createEOTToken(): FixToken {
        const endPosition = this.createSourcePosition();
        return new FixToken(this.createSourceLocation(new SourceRange(endPosition, endPosition)), Tag.EOT);
    }

    private isSpace(): boolean {
        return this.getCurrentCharacter() === SpecialCharacter.Space;
    }

    private isTab(): boolean {
        const currentCharacter = this.getCurrentCharacter();
        return currentCharacter === SpecialCharacter.HorizontalTab || currentCharacter === SpecialCharacter.VerticalTab;
    }

    private isFormFeed(): boolean {
        return this.getCurrentCharacter() === SpecialCharacter.FormFeed;
    }

    private isLineFeed(): boolean {
        return this.getCurrentCharacter() === SpecialCharacter.LineFeed;
    }

    private isCarriageReturn(): boolean {
        return this.getCurrentCharacter() === SpecialCharacter.CarriageReturn;
    }

    private isBackslash(): boolean {
        return this.getCurrentCharacter() === SpecialCharacter.Backslash;
    }

    private isLetter(): boolean {
        const currentCharacter = this.getCurrentCharacter();
        return (
            currentCharacter !== undefined &&
            ((currentCharacter >= 'a' && currentCharacter <= 'z') ||
                (currentCharacter >= 'A' && currentCharacter <= 'Z'))
        );
    }

    private isDot(): boolean {
        const currentCharacter = this.getCurrentCharacter();
        return currentCharacter !== undefined && currentCharacter === '.';
    }

    private isEllipsis(): boolean {
        return (
            this.isDot() &&
            this.state.currentPosition + 1 < this.code.length &&
            this.code[this.state.currentPosition + 1] === '.'
        );
    }

    private isNumber(): boolean {
        const currentCharacter = this.getCurrentCharacter();
        return currentCharacter !== undefined && currentCharacter >= '0' && currentCharacter <= '9';
    }

    private isHexCharacter(): boolean {
        const currentCharacter = this.getCurrentCharacter();
        return (
            currentCharacter !== undefined &&
            ((currentCharacter >= 'a' && currentCharacter <= 'f') ||
                (currentCharacter >= 'A' && currentCharacter <= 'F'))
        );
    }

    private isDoubleQuote(): boolean {
        return this.getCurrentCharacter() === SpecialCharacter.DoubleQuote;
    }

    private isWhitespace(): boolean {
        return this.isSpace() || this.isTab() || this.isLineFeed() || this.isCarriageReturn() || this.isFormFeed();
    }

    private isEOT(): boolean {
        return this.state.currentPosition >= this.code.length;
    }

    private isCommentStart(): boolean {
        const currentCharacter = this.getCurrentCharacter();
        return (
            currentCharacter !== undefined &&
            tagFromString(currentCharacter) === Tag.OpenParentheses &&
            this.state.currentPosition + 1 < this.code.length &&
            tagFromString(this.code[this.state.currentPosition + 1]) === Tag.Asterisk
        );
    }

    private isCommentEnd(): boolean {
        const currentCharacter = this.getCurrentCharacter();
        return (
            currentCharacter !== undefined &&
            tagFromString(currentCharacter) === Tag.Asterisk &&
            this.state.currentPosition + 1 < this.code.length &&
            tagFromString(this.code[this.state.currentPosition + 1]) === Tag.CloseParentheses
        );
    }

    private skipWhitespace(): boolean {
        let hasSkipped = false;
        while (this.isWhitespace()) {
            hasSkipped = true;
            this.advance();
        }
        return hasSkipped;
    }

    private skipComment(): boolean {
        let hasSkipped = false;
        if (this.isCommentStart()) {
            hasSkipped = true;
            this.advance(2);
            while (!this.isEOT() && !this.isCommentEnd()) {
                this.advance();
            }
            if (!this.isEOT()) {
                this.advance(2);
            }
        }
        return hasSkipped;
    }

    private skipUntilWhitespace(): void {
        while (!this.isWhitespace() && !this.isEOT()) {
            this.advance();
        }
    }

    private readCharacter(): Optional<string> {
        const character = this.getCurrentCharacter();
        if (this.isBackslash()) {
            this.advance();
            const specialCharacter = toSpecialCharacter(this.getCurrentCharacter());
            if (specialCharacter !== undefined) {
                this.advance();
                return specialCharacter;
            }
        }
        this.advance();
        return character;
    }

    private readText(): Token {
        let text = '';
        const start = this.createSourcePosition();
        this.advance();

        while (!this.isDoubleQuote()) {
            const character = this.readCharacter();
            if (character === undefined) {
                return new ErrorToken(this.createSourceLocation(new SourceRange(start, this.createSourcePosition())));
            }
            text = text + character;
        }

        if (this.isDoubleQuote()) {
            this.advance();
            const end = this.createSourcePosition();
            return new TextToken(this.createSourceLocation(new SourceRange(start, end)), text);
        }

        return new ErrorToken(this.createSourceLocation(new SourceRange(start, this.createSourcePosition())));
    }

    private readIdentifier(): Token {
        let identifier = '';
        const start = this.createSourcePosition();

        while (!this.isEOT() && (this.isLetter() || this.isNumber())) {
            identifier = identifier + this.getCurrentCharacter();
            this.advance();
        }

        const location = this.createSourceLocation(new SourceRange(start, this.createSourcePosition()));

        const tag = tagFromString(identifier);

        return tag !== undefined ? new FixToken(location, tag) : new IdentifierToken(location, identifier);
    }

    private readFixToken(): Token {
        const start = this.createSourcePosition();

        const currentCharacter = this.getCurrentCharacter();
        if (currentCharacter !== undefined) {
            const tag = tagFromString(currentCharacter);
            this.advance();
            if (tag !== undefined) {
                const nextCharacter = this.getCurrentCharacter();
                if (nextCharacter !== undefined) {
                    const nextTag = tagFromString(nextCharacter);
                    if (nextTag === Tag.Equal) {
                        switch (tag) {
                            case Tag.Less:
                                this.advance();
                                return new FixToken(
                                    this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
                                    Tag.LessEqual,
                                );
                            case Tag.Greater:
                                this.advance();
                                return new FixToken(
                                    this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
                                    Tag.GreaterEqual,
                                );
                            case Tag.Colon:
                                this.advance();
                                return new FixToken(
                                    this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
                                    Tag.ColonEqual,
                                );
                        }
                    }
                }
                return new FixToken(
                    this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
                    tag,
                );
            }
        }
        return new ErrorToken(this.createSourceLocation(new SourceRange(start, this.createSourcePosition())));
    }

    private readScaleFactor(): number {
        let scaleFactor = 0;
        if (!this.isNumber()) {
            this.diagnosis.log(
                new CompilerDiagnostic(
                    new SourceRange(this.createSourcePosition(), this.createSourcePosition()),
                    DiagnosticSeverity.Error,
                    'Scale factor must be at least one digit long.',
                ),
            );
        }
        while (this.isNumber()) {
            const current = this.getCurrentCharacter();
            if (current !== undefined) {
                scaleFactor = scaleFactor * 10 + Number.parseInt(current);
                this.advance();
            }
        }
        return scaleFactor;
    }

    private readNumber(): NumberToken {
        const start = this.createSourcePosition();
        let mantissa: Optional<string> = undefined;
        let isHex = false;
        let isFloat = false;
        let exponent = 0;
        while (this.isNumber() || this.isHexCharacter()) {
            if (this.isHexCharacter()) {
                isHex = true;
            }
            mantissa = mantissa === undefined ? this.getCurrentCharacter() : mantissa + this.getCurrentCharacter();
            this.advance();
            if (isFloat && isHex) {
                this.skipUntilWhitespace();
                this.diagnosis.log(
                    new CompilerDiagnostic(
                        new SourceRange(start, this.createSourcePosition()),
                        DiagnosticSeverity.Error,
                        'Floating point hex numbers are not supported.',
                    ),
                );
                break;
            }
            if (isFloat) {
                exponent = exponent - 1;
            }
            if (this.isEllipsis()) {
                break;
            }
            if (this.isDot()) {
                this.advance();
                isFloat = true;
            }
            if (isFloat && this.getCurrentCharacter() === 'E') {
                this.advance();
                const current = this.getCurrentCharacter();
                let prefix = 1;
                if (current === '-' || current === '+') {
                    prefix = current === '-' ? -1 : 1;
                    this.advance();
                }
                exponent = prefix * this.readScaleFactor();
                break;
            }
        }
        if (mantissa === undefined) {
            return new IntegerNumberToken(
                this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
                0,
            );
        }
        const hexModifier = this.getCurrentCharacter() === 'H' || this.getCurrentCharacter() === 'X';
        if (hexModifier) {
            this.advance();
        }
        if (isHex && !hexModifier) {
            this.skipUntilWhitespace();
            this.diagnosis.log(
                new CompilerDiagnostic(
                    new SourceRange(start, this.createSourcePosition()),
                    DiagnosticSeverity.Error,
                    'Missing "H" or "X" after hex number',
                ),
            );
        }
        if (isHex || hexModifier) {
            return new HexNumberToken(
                this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
                Number.parseInt('0x' + mantissa),
            );
        }
        if (isFloat) {
            return new FloatNumberToken(
                this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
                Number.parseInt(mantissa),
                exponent,
            );
        }
        return new IntegerNumberToken(
            this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
            Number.parseInt(mantissa),
        );
    }

    private readEllipsis(): FixToken {
        const start = this.createSourcePosition();
        this.advance();
        this.advance();
        return new FixToken(
            this.createSourceLocation(new SourceRange(start, this.createSourcePosition())),
            Tag.Ellipsis,
        );
    }

    private read(): Token {
        while (!this.isEOT() && (this.skipWhitespace() || this.skipComment())) {
            /* do nothing, just skip */
        }
        if (this.isEOT()) {
            return this.createEOTToken();
        }
        if (this.isDoubleQuote()) {
            return this.readText();
        }
        if (this.isLetter()) {
            return this.readIdentifier();
        }
        if (this.isNumber()) {
            return this.readNumber();
        }
        if (this.isEllipsis()) {
            return this.readEllipsis();
        }
        return this.readFixToken();
    }

    getUri(): string {
        return this.uri;
    }

    saveState(): void {
        this.stateStack.push(this.state.copy());
    }

    popSaveState(): void {
        this.stateStack.pop();
    }

    restoreState(): void {
        const lastState = this.stateStack.pop();
        if (lastState === undefined) {
            console.warn('No lexer state to restore.');
            return;
        }
        this.state = lastState;
    }

    peek(n: number): Token {
        if (n < 1) {
            // TODO: replace with something cleverer
            throw RangeError('peek range must be greater than 0.');
        }

        let cacheSize = this.state.tokenCache.length;

        if (n <= cacheSize) {
            return this.state.tokenCache[n - 1];
        }

        do {
            if (cacheSize > 0) {
                const lastToken = this.state.tokenCache[cacheSize - 1];
                if (lastToken instanceof FixToken && lastToken.getTag() === Tag.EOT) {
                    return lastToken;
                }
            }
            cacheSize = this.state.tokenCache.push(this.read());
        } while (n > cacheSize);

        return this.state.tokenCache[n - 1];
    }

    next(): Token {
        const nextToken = this.peek(1);
        this.state.tokenCache.shift();
        return nextToken;
    }
}
