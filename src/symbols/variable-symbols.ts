import { ScopeSymbolType, NamedScopeSymbol } from './scope-symbols';
import { TypeSymbol } from './type-symbols';

export class VariableSymbol extends NamedScopeSymbol {
    constructor(
        scope: ScopeSymbolType,
        identifier: string,
        public readonly mutable: boolean,
        public readonly type: TypeSymbol,
    ) {
        super(scope, identifier);
    }
}

export class CollectionVariableSymbol extends NamedScopeSymbol {
    constructor(
        scope: ScopeSymbolType,
        identifier: string,
        public readonly type: TypeSymbol,
        public readonly parameters: Array<TypeSymbol>,
    ) {
        super(scope, identifier);
    }
}
