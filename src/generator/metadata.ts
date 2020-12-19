import {
    ComponentSymbol,
    ProcedureSymbol,
    ImplementationSymbol,
    VariableSymbol,
    CollectionVariableSymbol,
    InterfaceSymbol,
    BuiltInTypeSymbol,
    MessageSymbol,
} from '../symbols/symbols';
import {
    ComponentDescriptor,
    ProcedureDescriptor,
    ImplementationDescriptor,
    InterfaceDescriptor,
    VariableDescriptor,
    BooleanDescriptor,
    BuiltInTypeDescriptor,
    CharacterDescriptor,
    FloatDescriptor,
    IntegerDescriptor,
    TextDescriptor,
    MessageDescriptor,
} from '@composita/il';

type AnyVariableSymbols = VariableSymbol | CollectionVariableSymbol;

export class Metadata {
    private readonly componentMapping = new Map<ComponentSymbol, ComponentDescriptor>();
    private readonly interfaceMapping = new Map<InterfaceSymbol, InterfaceDescriptor>();
    private readonly implementationMapping = new Map<ImplementationSymbol, ImplementationDescriptor>();
    private readonly procedureMapping = new Map<ProcedureSymbol, ProcedureDescriptor>();
    private readonly variableMapping = new Map<AnyVariableSymbols, VariableDescriptor>();
    private readonly messageMapping = new Map<MessageSymbol, MessageDescriptor>();

    private readonly globalDescriptor = new ComponentDescriptor('@___@GLOBAL_DESCRIPTOR@___@');

    getGlobalComponent(): ComponentDescriptor {
        return this.globalDescriptor;
    }

    pushComponent(symbol: ComponentSymbol, descriptor: ComponentDescriptor): void {
        this.componentMapping.set(symbol, descriptor);
    }

    findComponent(symbol: ComponentSymbol): ComponentDescriptor {
        const result = this.componentMapping.get(symbol);
        if (result === undefined) {
            throw new Error('Unknown Symbol <-> Component Mapping.');
        }
        return result;
    }

    pushInterface(symbol: InterfaceSymbol, descriptor: InterfaceDescriptor): void {
        this.interfaceMapping.set(symbol, descriptor);
    }

    findInterface(symbol: InterfaceSymbol): InterfaceDescriptor {
        const result = this.interfaceMapping.get(symbol);
        if (result === undefined) {
            throw new Error('Unknown Symbol <-> Interface Mapping.');
        }
        return result;
    }

    pushImplementation(symbol: ImplementationSymbol, descriptor: ImplementationDescriptor): void {
        this.implementationMapping.set(symbol, descriptor);
    }

    findImplementation(symbol: ImplementationSymbol): ImplementationDescriptor {
        const result = this.implementationMapping.get(symbol);
        if (result === undefined) {
            throw new Error('Unknown Symbol <-> Component Mapping.');
        }
        return result;
    }

    pushProcedure(symbol: ProcedureSymbol, descriptor: ProcedureDescriptor): void {
        this.procedureMapping.set(symbol, descriptor);
    }

    findProcedure(symbol: ProcedureSymbol): ProcedureDescriptor {
        const result = this.procedureMapping.get(symbol);
        if (result === undefined) {
            throw new Error('Unkknown Symbol <-> Component Mapping.');
        }
        return result;
    }

    pushVariable(symbol: AnyVariableSymbols, descriptor: VariableDescriptor): void {
        this.variableMapping.set(symbol, descriptor);
    }

    findVariable(symbol: AnyVariableSymbols): VariableDescriptor {
        const result = this.variableMapping.get(symbol);
        if (result === undefined) {
            throw new Error('Unkknown Symbol <-> Variable Mapping.');
        }
        return result;
    }

    pushMessage(symbol: MessageSymbol, descriptor: MessageDescriptor): void {
        this.messageMapping.set(symbol, descriptor);
    }

    findMessage(symbol: MessageSymbol): MessageDescriptor {
        const result = this.messageMapping.get(symbol);
        if (result === undefined) {
            throw new Error('Unkknown Symbol <-> Message Mapping.');
        }
        return result;
    }

    builtInTypeDescriptor(symbol: BuiltInTypeSymbol): BuiltInTypeDescriptor {
        switch (symbol.identifier) {
            case 'INTEGER':
                return new IntegerDescriptor();
            case 'REAL':
                return new FloatDescriptor();
            case 'BOOLEAN':
                return new BooleanDescriptor();
            case 'CHARACTER':
                return new CharacterDescriptor();
            case 'TEXT':
                return new TextDescriptor();
            default:
                throw new Error('Unsupported variable built in type symbol.');
        }
    }
}
