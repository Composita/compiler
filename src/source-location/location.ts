import { Position, Range, Location } from 'vscode-languageserver-types';
import { Comparable, CompareValue } from '@composita/ts-utility-types';

export class SourcePosition implements Position, Comparable<Position> {
    constructor(public line: number, public character: number) {}

    static from(other: Position): SourcePosition {
        return other instanceof SourcePosition ? other : new SourcePosition(other.line, other.character);
    }

    compareTo(other: Position): CompareValue {
        if (this.line < other.line || (this.line === other.line && this.character < other.character)) {
            return CompareValue.LT;
        }
        if (this.line > other.line || (this.line === other.line && this.character > other.character)) {
            return CompareValue.GT;
        }
        return CompareValue.EQ;
    }
}

export class SourceRange implements Range {
    constructor(public start: Position, public end: Position) {}

    static merge(a: Range, b: Range): SourceRange {
        const startACompare = SourcePosition.from(a.start).compareTo(b.start);
        const endACompare = SourcePosition.from(a.end).compareTo(b.end);

        const startRange: Position =
            startACompare === CompareValue.LT ? a.start : startACompare === CompareValue.GT ? b.start : a.start;
        const endRange: Position =
            endACompare === CompareValue.LT ? b.end : endACompare === CompareValue.GT ? a.end : b.end;

        return new SourceRange(startRange, endRange);
    }
}

export class SourceLocation implements Location {
    constructor(public uri: string, public range: SourceRange) {}

    static merge(a: Location, b: Location): SourceLocation {
        if (a.uri !== b.uri) {
            throw Error('Source location URI missmatch.');
        }
        return new SourceLocation(a.uri, SourceRange.merge(a.range, b.range));
    }
}
