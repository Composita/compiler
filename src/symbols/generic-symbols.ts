import { InterfaceSymbol } from './type-symbols';

export class InterfaceDeclarationSymbol {
    constructor(public readonly interfaceSymbol: InterfaceSymbol, public readonly cardinality: CardinalitySymbol) {}
}

export class CardinalitySymbol {
    constructor(public readonly min: number, public readonly max: number = min) {
        if (min < 1) {
            throw new Error('cardinality must be greater 0');
        }
        if (max !== undefined && max < min) {
            throw new Error(`min ${min} must be greater than max ${max}`);
        }
    }

    unlimited(): boolean {
        return this.max === Infinity;
    }
}

export class GenericSymbol {
    constructor(
        public readonly offered: Array<InterfaceDeclarationSymbol>,
        public readonly required: Array<InterfaceDeclarationSymbol>,
    ) {
        GenericSymbol.validate(this.offered, 'Offered interface defined multiple times.');
        GenericSymbol.validate(this.required, 'Required interface defined multiple times.');
    }

    private static validate(data: Array<InterfaceDeclarationSymbol>, msg: string): void {
        const uniqueNames = new Array<string>(...new Set(data.map((offer) => offer.interfaceSymbol.identifier)));
        if (uniqueNames.length !== data.length) {
            throw new Error(msg);
        }
    }

    private static matchInterfaceDeclarations(
        genericAInterfaces: Array<InterfaceDeclarationSymbol>,
        genericBInterfaces: Array<InterfaceDeclarationSymbol>,
        minCompare: (a: number, b: number) => boolean,
        maxCompare: (a: number, b: number) => boolean,
    ): boolean {
        return (
            genericAInterfaces.filter(
                (genericAInterface) =>
                    genericBInterfaces.find(
                        (genericBInterface) =>
                            genericAInterface.interfaceSymbol === genericBInterface.interfaceSymbol &&
                            maxCompare(genericAInterface.cardinality.max, genericBInterface.cardinality.max) &&
                            minCompare(genericAInterface.cardinality.min, genericBInterface.cardinality.min),
                    ) !== undefined,
            ).length === genericAInterfaces.length
        );
    }

    canBeSubstitutedBy(other: GenericSymbol): boolean {
        return (
            GenericSymbol.matchInterfaceDeclarations(
                this.offered,
                other.offered,
                (a, b) => a >= b,
                (a, b) => a >= b,
            ) &&
            GenericSymbol.matchInterfaceDeclarations(
                this.required,
                other.required,
                (a, b) => a <= b,
                (a, b) => a <= b,
            )
        );
    }

    canSubstitute(other: GenericSymbol): boolean {
        return other.canBeSubstitutedBy(this);
    }
}
