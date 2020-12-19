import {
    Diagnostic,
    DiagnosticSeverity,
    Range,
    DiagnosticTag,
    DiagnosticRelatedInformation,
} from 'vscode-languageserver-types';
import { Optional } from '@composita/ts-utility-types';

export interface Diagnosis {
    log(diagnostic: Diagnostic): void;
    hasErrors(): boolean;
    hasWarnings(): boolean;
    getDiagnostics(): Array<Diagnostic>;
    print(out: (...msg: string[]) => void): void;
    saveState(): void;
    restoreState(): void;
}

export class CompilerDiagnostic implements Diagnostic {
    constructor(
        public range: Range,
        public severity: Optional<DiagnosticSeverity>,
        public message: string,
        public code?: string | number,
        public source?: string,
        public tags?: Array<DiagnosticTag>,
        public relatedInformation?: Array<DiagnosticRelatedInformation>,
    ) {}
}

class DiagnosisState {
    public diagnostics: Array<Diagnostic> = new Array<Diagnostic>();
    public warning = false;
    public error = false;

    copy(): DiagnosisState {
        const state = new DiagnosisState();
        state.diagnostics = new Array<Diagnostic>(...this.diagnostics);
        state.warning = this.warning;
        state.error = this.error;
        return state;
    }
}

export class CompilerDiagnosis implements Diagnosis {
    private state = new DiagnosisState();
    private stateStack = new Array<DiagnosisState>();

    log(diagnostic: Diagnostic): void {
        this.state.diagnostics.push(diagnostic);
        if (diagnostic.severity === DiagnosticSeverity.Warning) {
            this.state.warning = true;
        }
        if (diagnostic.severity === DiagnosticSeverity.Error) {
            this.state.error = true;
        }
    }

    saveState(): void {
        this.stateStack.push(this.state.copy());
    }

    restoreState(): void {
        const oldState = this.stateStack.pop();
        if (oldState === undefined) {
            // TODO maybe do something different here...
            console.warn('Failed to restore diagnosis state, no state saved.');
            return;
        }
        this.state = oldState;
    }

    hasErrors(): boolean {
        return this.state.error;
    }

    hasWarnings(): boolean {
        return this.state.warning;
    }

    getDiagnostics(): Array<Diagnostic> {
        return this.state.diagnostics;
    }

    print(out: (...msg: string[]) => void): void {
        this.state.diagnostics.forEach((value) => {
            out(
                `[${value.range.start.line}:${value.range.start.character}]: ${this.toString(value.severity)}: ${
                    value.message
                }.`,
            );
        });
    }

    private toString(severity: Optional<DiagnosticSeverity>): string {
        switch (severity) {
            case DiagnosticSeverity.Error:
                return 'Error';
            case DiagnosticSeverity.Warning:
                return 'Warning';
            case DiagnosticSeverity.Information:
                return 'Information';
            case DiagnosticSeverity.Hint:
                return 'Hint';
            default:
                return 'undefined';
        }
    }
}
