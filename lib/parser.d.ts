export type Token = Function | Constant | Punctuation | Operation | Variable;
export type Function = {
    type: "function";
    value: "add" | "concat" | "replace";
};
export type Constant = {
    type: "constant";
    value: number | string;
};
export type Punctuation = {
    type: "punctuation";
    value: "," | "(" | ")";
};
export type Operation = {
    type: "operation";
    value: "+" | "-" | "*" | "/";
};
export type Variable = {
    type: "variable";
    value: string;
};
export type ParseTree = Token & {
    children?: ParseTree[];
};
export declare class Parsing {
    constructor();
    do(tokens: Token[]): ParseTree;
    private parse;
    private parseOperation;
    private parseFunction;
    private splitArguments;
    private removeOutterParens;
    private isOperation;
    private findOperationIndex;
    private isFunction;
}
export declare class Interpretor {
    private context;
    evaluate(parseTree: ParseTree, context?: Record<string, number | string>): string | number;
    private execute;
    private interpretConstant;
    private interpretVariable;
    private interpretFunction;
    private interpretOperation;
    private replace;
    private concat;
    private divide;
    private multiply;
    private subtract;
    private add;
}
type Status = {
    isValid: boolean;
    comment?: string;
};
export declare class FormuleMagique {
    private readonly parsing;
    private readonly interpretor;
    private constructor();
    validate(formula: Token[]): Status;
    evaluate(formula: Token[], context: Record<string, number | string>): number | string;
}
export {};
