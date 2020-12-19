import { ScopeSymbolType, NamedScopeSymbol } from './scope-symbols';
import { GenericSymbol } from './generic-symbols';

enum TypeSymbolTag {
    Tag,
}
export abstract class TypeSymbol extends NamedScopeSymbol {
    protected readonly _typeSymbolTag: TypeSymbolTag = TypeSymbolTag.Tag;
}

export class ConstantSymbol {
    constructor(public readonly identifier: string, public readonly type: TypeSymbol) {}
}

export class ProcedureSymbol extends TypeSymbol {
    constructor(
        scope: ScopeSymbolType,
        identifier: string,
        public readonly parameters: Array<TypeSymbol>,
        public readonly returnType: TypeSymbol,
    ) {
        super(scope, identifier);
    }
}

enum BuiltInTypeSymbolTag {
    Tag,
}
export class BuiltInTypeSymbol extends TypeSymbol {
    protected readonly _builtInTypeSymbol = BuiltInTypeSymbolTag.Tag;
}

enum InterfaceSymbolTag {
    Tag,
}
export class InterfaceSymbol extends TypeSymbol {
    protected readonly _interfaceSymbolTag = InterfaceSymbolTag.Tag;
    // TODO add protocol here.
}

enum ComponentSymbolTag {
    Tag,
}
export class ComponentSymbol extends TypeSymbol {
    protected readonly _componentSymbolTag = ComponentSymbolTag.Tag;

    constructor(
        scope: ScopeSymbolType,
        identifier: string,
        public readonly genericType: GenericSymbol,
        public readonly isEntryPoint: boolean,
    ) {
        super(scope, identifier);
    }
}

enum GenericComponentSymbolTag {
    Tag,
}
export class GenericComponentSymbol extends ComponentSymbol {
    protected readonly _genericComponentSymbolTag: GenericComponentSymbolTag = GenericComponentSymbolTag.Tag;

    constructor(scope: ScopeSymbolType, genericType: GenericSymbol) {
        super(scope, '@@@__ANY__GENERIC_COMPONENT__@@@', genericType, false);
    }
}

export class MessageSymbol extends TypeSymbol {
    constructor(scope: ScopeSymbolType, identifier: string, public readonly parameters: Array<TypeSymbol>) {
        super(scope, identifier);
    }
}
