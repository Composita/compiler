import {
    BooleanDescriptor,
    CharacterDescriptor,
    FloatDescriptor,
    Instruction,
    InstructionArgument,
    IntegerDescriptor,
    JumpDescriptor,
    OperationCode,
    SystemCallDescriptor,
    SystemCallOperation,
    TextDescriptor,
} from '@composita/il';

enum LabelTag {
    Tag,
}
export class Label {
    protected readonly _labelTag = LabelTag.Tag;
}

export class ILAssembler {
    private readonly targets = new Map<Label, number>();
    private readonly origins = new Map<Label, Array<number>>();
    private readonly code = new Array<Instruction>();

    complete(): Array<Instruction> {
        this.fixLabels();
        return this.code;
    }

    createLabel(): Label {
        return new Label();
    }

    setLabel(label: Label): void {
        this.targets.set(label, this.code.length);
    }

    fixLabels(): void {
        this.origins.forEach((origins, label) => {
            const target = this.targets.get(label);
            if (target === undefined) {
                throw new Error('Cannot branch to unknown label.');
            }
            origins.forEach((origin) => {
                const instruction = this.code[origin - 1];
                if (
                    instruction.code !== OperationCode.Branch &&
                    instruction.code !== OperationCode.BranchFalse &&
                    instruction.code !== OperationCode.BranchTrue
                ) {
                    throw new Error(
                        'Not a jump instruction: ' + instruction.code + ', target: ' + target + ', origin: ' + origin,
                    );
                }
                this.code[origin - 1].arguments.push(new JumpDescriptor(target - origin));
            });
        });
    }

    emitLoadInteger(n: number): void {
        this.emit(OperationCode.LoadConstantInteger, new IntegerDescriptor(n));
    }

    emitLoadFloat(n: number): void {
        this.emit(OperationCode.LoadConstantFloat, new FloatDescriptor(n));
    }

    emitLoadCharacter(n: string): void {
        this.emit(OperationCode.LoadConstantCharacter, new CharacterDescriptor(n));
    }

    emitLoadText(n: string): void {
        this.emit(OperationCode.LoadConstantText, new TextDescriptor(n));
    }

    emitLoadBoolean(n: boolean): void {
        this.emit(OperationCode.LoadConstantBoolean, new BooleanDescriptor(n));
    }

    private emitJump(opCode: OperationCode, label: Label): void {
        this.emit(opCode);
        if (!this.origins.has(label)) {
            this.origins.set(label, new Array<number>());
        }
        this.origins.get(label)?.push(this.code.length);
    }

    emitBranch(label: Label): void {
        this.emitJump(OperationCode.Branch, label);
    }

    emitBranchFalse(label: Label): void {
        this.emitJump(OperationCode.BranchFalse, label);
    }

    emitBranchTrue(label: Label): void {
        this.emitJump(OperationCode.BranchTrue, label);
    }

    emitSystemCall(sysCall: SystemCallOperation, numberOfArguments: number): void {
        const descriptor = new SystemCallDescriptor(sysCall);
        descriptor.arguments.push(new IntegerDescriptor(numberOfArguments));
        this.emit(OperationCode.SystemCall, descriptor);
    }

    emit(opCode: OperationCode, ...args: Array<InstructionArgument>): void {
        this.code.push(new Instruction(opCode, ...args));
    }
}
