import { ComponentSymbol, InterfaceSymbol } from './type-symbols';

export type ScopeSymbolType = ScopedSymbol | GlobalScopeSymbol;

enum GlobalScopeSymbolTag {
    Tag,
}
export class GlobalScopeSymbol {
    protected readonly _globalScopeSymbolTag: GlobalScopeSymbolTag = GlobalScopeSymbolTag.Tag;
}

export abstract class ScopedSymbol {
    constructor(public readonly scope: ScopeSymbolType) {}
}

export class ProgramScopeSymbol extends ScopedSymbol {
    constructor(scope: GlobalScopeSymbol, public readonly name: string) {
        super(scope);
    }
}

export abstract class NamedScopeSymbol extends ScopedSymbol {
    constructor(scope: ScopeSymbolType, public readonly identifier: string) {
        super(scope);
    }
}

enum BlockScopeSymbolTag {
    Tag,
}
export class BlockScopeSymbol extends ScopedSymbol {
    protected _blockScopeSymbolTag: BlockScopeSymbolTag = BlockScopeSymbolTag.Tag;
}

export class ImplementationSymbol extends ScopedSymbol {
    constructor(scope: ComponentSymbol, public readonly interfaceSymbol: InterfaceSymbol) {
        super(scope);
    }
}
