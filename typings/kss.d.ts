declare module "kss" {
    interface IFile {
        base: string;
        contents: string;
        path: string;
    }

    interface IOptions {
        markdown?: boolean;
        mask?: string | RegExp;
        multiline?: boolean;
        typos?: boolean;
    }

    type CallbackFn = (error: Error | null, styleguide: IStyleguide) => void;

    export function parse(input: string | IFile[], options: IOptions): IStyleguide;
    export function traverse(directory: string | string[], options: IOptions): Promise<IStyleguide>;

    interface IStyleguide {
        customPropertyNames(): string[];
        customPropertyNames(names: string | string[]): IStyleguide;
        hasNumericReferences(): boolean;
        init(): IStyleguide;
        referenceDelimiter(): string;
        sections(): ISection[];
        sections(query: string | RegExp): false | ISection | ISection[];
        sections(sections: ISection | ISection[]): IStyleguide;
        toJSON(): string;
    }

    interface ISection {
        deprecated(): boolean;
        depth(): string;
        description(): string;
        experimental(): boolean;
        header(): string;
        markup(): false | string;
        modifiers(): IModifier[];
        modifiers(query: number | string): false | IModifier;
        parameters(): IParameter[];
        reference(): string;
        referenceURI(): string;
        toJSON(): object;
        weight(): string;
    }

    interface IModifier {
        className(): string;
        description(): string;
        markup(): string;
        name(): string;
        section(): ISection;
    }

    interface IParameter {
        description(): string;
        name(): string;
        section(): ISection;
    }
}
