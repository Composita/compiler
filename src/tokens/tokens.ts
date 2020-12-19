import { SourceLocation } from '../source-location/location';
import { Optional } from '@composita/ts-utility-types';

export enum Tag {
    EOT = 'EOT',
    Begin = 'BEGIN',
    Activity = 'ACTIVITY',
    Finally = 'FINALLY',
    End = 'END',
    Constant = 'CONSTANT',
    Variable = 'VARIABLE',
    In = 'IN',
    Out = 'OUT',
    Is = 'IS',
    Type = 'TYPE',
    Any = 'ANY',
    Finish = 'FINISH',
    Component = 'COMPONENT',
    Interface = 'INTERFACE',
    Procedure = 'PROCEDURE',
    Implementation = 'IMPLEMENTATION',
    Offers = 'OFFERS',
    Requires = 'REQUIRES',
    OpenBrace = '{',
    CloseBrace = '}',
    OpenSquareBracket = '[',
    CloseSquareBracket = ']',
    OpenParentheses = '(',
    CloseParentheses = ')',
    Semicolon = ';',
    Colon = ':',
    Comma = ',',
    Asterisk = '*',
    Pipe = '|',
    For = 'FOR',
    To = 'TO',
    By = 'BY',
    Do = 'DO',
    Foreach = 'FOREACH',
    Of = 'OF',
    While = 'WHILE',
    Repeat = 'REPEAT',
    Until = 'UNTIL',
    If = 'IF',
    Then = 'THEN',
    Elsif = 'ELSIF',
    Else = 'ELSE',
    Return = 'RETURN',
    NumberSign = '#',
    Equal = '=',
    Less = '<',
    LessEqual = '<=',
    Greater = '>',
    GreaterEqual = '>=',
    ColonEqual = ':=',
    Ellipsis = '..',
    Plus = '+',
    Minus = '-',
    Tilde = '~',
    Slash = '/',
    Div = 'DIV',
    Mod = 'MOD',
    And = 'AND',
    Or = 'OR',
    ExclamationMark = '!',
    QuestionMark = '?',
}

export function tagFromString(identifier: string): Optional<Tag> {
    switch (identifier) {
        case Tag.Begin:
            return Tag.Begin;
        case Tag.Activity:
            return Tag.Activity;
        case Tag.Finally:
            return Tag.Finally;
        case Tag.End:
            return Tag.End;
        case Tag.Constant:
            return Tag.Constant;
        case Tag.Variable:
            return Tag.Variable;
        case Tag.In:
            return Tag.In;
        case Tag.Out:
            return Tag.Out;
        case Tag.Is:
            return Tag.Is;
        case Tag.Type:
            return Tag.Type;
        case Tag.Any:
            return Tag.Any;
        case Tag.Finish:
            return Tag.Finish;
        case Tag.Component:
            return Tag.Component;
        case Tag.Interface:
            return Tag.Interface;
        case Tag.Procedure:
            return Tag.Procedure;
        case Tag.Implementation:
            return Tag.Implementation;
        case Tag.Offers:
            return Tag.Offers;
        case Tag.Requires:
            return Tag.Requires;
        case Tag.OpenBrace:
            return Tag.OpenBrace;
        case Tag.CloseBrace:
            return Tag.CloseBrace;
        case Tag.OpenSquareBracket:
            return Tag.OpenSquareBracket;
        case Tag.CloseSquareBracket:
            return Tag.CloseSquareBracket;
        case Tag.OpenParentheses:
            return Tag.OpenParentheses;
        case Tag.CloseParentheses:
            return Tag.CloseParentheses;
        case Tag.Semicolon:
            return Tag.Semicolon;
        case Tag.Colon:
            return Tag.Colon;
        case Tag.Comma:
            return Tag.Comma;
        case Tag.Asterisk:
            return Tag.Asterisk;
        case Tag.Pipe:
            return Tag.Pipe;
        case Tag.For:
            return Tag.For;
        case Tag.To:
            return Tag.To;
        case Tag.By:
            return Tag.By;
        case Tag.Do:
            return Tag.Do;
        case Tag.Foreach:
            return Tag.Foreach;
        case Tag.Of:
            return Tag.Of;
        case Tag.While:
            return Tag.While;
        case Tag.Repeat:
            return Tag.Repeat;
        case Tag.Until:
            return Tag.Until;
        case Tag.If:
            return Tag.If;
        case Tag.Then:
            return Tag.Then;
        case Tag.Elsif:
            return Tag.Elsif;
        case Tag.Else:
            return Tag.Else;
        case Tag.Return:
            return Tag.Return;
        case Tag.NumberSign:
            return Tag.NumberSign;
        case Tag.Equal:
            return Tag.Equal;
        case Tag.Less:
            return Tag.Less;
        case Tag.LessEqual:
            return Tag.LessEqual;
        case Tag.Greater:
            return Tag.Greater;
        case Tag.GreaterEqual:
            return Tag.GreaterEqual;
        case Tag.ColonEqual:
            return Tag.ColonEqual;
        case Tag.Ellipsis:
            return Tag.Ellipsis;
        case Tag.Plus:
            return Tag.Plus;
        case Tag.Minus:
            return Tag.Minus;
        case Tag.Tilde:
            return Tag.Tilde;
        case Tag.Slash:
            return Tag.Slash;
        case Tag.Div:
            return Tag.Div;
        case Tag.Mod:
            return Tag.Mod;
        case Tag.And:
            return Tag.And;
        case Tag.Or:
            return Tag.Or;
        case Tag.ExclamationMark:
            return Tag.ExclamationMark;
        case Tag.QuestionMark:
            return Tag.QuestionMark;
        default:
            return undefined;
    }
}

export abstract class Token {
    constructor(private location: SourceLocation) {}

    getLocation(): SourceLocation {
        return this.location;
    }
}

export class UnknownCharacterToken extends Token {
    constructor(location: SourceLocation, private character: string) {
        super(location);
    }

    getCharacter(): string {
        return this.character;
    }
}

const enum ErrorTokenTag {
    Tag,
}

export class ErrorToken extends Token {
    constructor(location: SourceLocation) {
        super(location);
    }

    protected readonly _errorTag: ErrorTokenTag = ErrorTokenTag.Tag;
}

export class FixToken extends Token {
    constructor(location: SourceLocation, private tag: Tag) {
        super(location);
    }

    getTag(): Tag {
        return this.tag;
    }
}

export class IdentifierToken extends Token {
    constructor(location: SourceLocation, private identifier: string) {
        super(location);
    }

    getIdentifier(): string {
        return this.identifier;
    }
}

export abstract class NumberToken extends Token {
    constructor(location: SourceLocation, private value: number) {
        super(location);
    }

    getNumber(): number {
        return this.value;
    }
}

enum HexNumberTokenTag {
    Tag,
}
export class HexNumberToken extends NumberToken {
    protected readonly _tag: HexNumberTokenTag = HexNumberTokenTag.Tag;
}

enum IntegerNumberTokenTag {
    Tag,
}
export class IntegerNumberToken extends NumberToken {
    protected readonly _tag: IntegerNumberTokenTag = IntegerNumberTokenTag.Tag;
}

enum FloatNumberTokenTag {
    Tag,
}
export class FloatNumberToken extends NumberToken {
    constructor(location: SourceLocation, private mantissa: number, private exponent: number) {
        super(location, mantissa * 10 ** exponent);
    }

    getMantissa(): number {
        return this.mantissa;
    }

    getExponent(): number {
        return this.exponent;
    }

    protected readonly _tag: FloatNumberTokenTag = FloatNumberTokenTag.Tag;
}

export class TextToken extends Token {
    constructor(location: SourceLocation, private text: string) {
        super(location);
    }

    getText(): string {
        return this.text;
    }
}
