import { djb2, serializeWithKeys } from "./utilities";

export type Token = Func | Constant | Punctuation | Operation | Variable;
export type Func = {
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

export const constant = (value: Constant["value"]): Constant => ({
  type: "constant",
  value,
});
export const func = (value: Func["value"]): Func => ({
  type: "function",
  value,
});
export const punctuation = (value: Punctuation["value"]): Punctuation => ({
  type: "punctuation",
  value,
});
export const operation = (value: Operation["value"]): Operation => ({
  type: "operation",
  value,
});
export const variable = (value: Variable["value"]): Variable => ({
  type: "variable",
  value,
});

export const hashTokens = (tokens: Token[]) =>
  djb2(
    tokens.map((token) => serializeWithKeys(token, ["type", "value"])).join("")
  );

export class Parsing {
  private memo = new Map<string, ParseTree>();
  constructor(private readonly functionCollection: FunctionCollection) {}
  do(tokens: Token[]): ParseTree {
    const key = hashTokens(tokens);
    if (this.memo.has(key)) {
      return this.memo.get(key)!;
    }
    const result = this.parse(tokens);
    if (result.length !== 1 || result[0] === undefined) {
      throw new Error("Parsing Error");
    }
    const response = result[0]
    this.memo.set(key, response);
    return response
  }
  private parse(tokens: ParseTree[]): ParseTree[] {
    this.checkParenthesisParity(tokens);
    const deparennedTokens = this.removeOutterParens(tokens);
    if (this.isOperation(deparennedTokens)) {
      return [this.parseOperation(deparennedTokens)];
    }
    if (this.isFunction(deparennedTokens)) {
      return [this.parseFunction(deparennedTokens)];
    }
    if (
      deparennedTokens[0]?.type === deparennedTokens[1]?.type
    ) {
      throw new Error("Parsing Error");
    }
    return deparennedTokens;
  }
  private parseOperation(tokens: ParseTree[]): ParseTree {
    const operationIndex = this.findOperationIndex(tokens);
    const operation = tokens[operationIndex]!;
    const leftOperand = tokens.slice(0, operationIndex);
    const rightOperand = tokens.slice(operationIndex + 1, tokens.length);
    if (!rightOperand.length || !leftOperand.length) {
      throw new Error(`Operation ${operation.value} require two operands`);
    }
    this.checkDivideByZero(operation, rightOperand);
    operation.children = [
      ...this.parse(leftOperand),
      ...this.parse(rightOperand),
    ];
    return operation;
  }
  private checkDivideByZero(operation: Token, rightOperand: Token[]): void {
    if (
      operation.value === "/" &&
      rightOperand[0]?.type === "constant" &&
      rightOperand[0].value === 0
    ) {
      throw new Error("Division by zero is not allowed");
    }
  }
  private parseFunction(tokens: ParseTree[]): ParseTree {
    const value = tokens[0]!.value as Func["value"];
    if (!this.functionCollection.has(value)) {
      throw new Error(`Function value does not exist`)
    }
    const functionArguments = tokens.slice(2, -1);
    const children = this.splitArguments(functionArguments).map(
      (tokens) => this.parse(tokens)[0]!
    );

    return {
      ...func(value),
      children,
    };
  }
  private splitArguments(tokens: Token[]): Token[][] {
    let parenLevel = 0;
    const splitTokens: Token[][] = [[]];
    for (const token of tokens) {
      if (token.type === "punctuation" && ["(", ")"].includes(token.value)) {
        parenLevel += token.value === "(" ? 1 : -1;
      }
      if (parenLevel === 0 && token.value === ",") {
        splitTokens.push([]);
      } else {
        splitTokens.at(-1)?.push(token);
      }
    }
    return splitTokens;
  }
  private removeOutterParens(tokens: Token[]): Token[] {
    if (this.isOperation(tokens)) {
      return tokens;
    }
    if (tokens.at(0)?.value === "(" && tokens.at(-1)?.value === ")") {
      return tokens.slice(1, -1);
    }
    return tokens;
  }
  private checkParenthesisParity(tokens: Token[]): void {
    const parity = tokens.reduce(
      (count, { type, value }, index) =>
        {
          if (count < 0) {
            throw new Error(`Excess of closing parenthesis at ${index - 1}`)
          }
          return (count +=
            type !== "punctuation"
              ? 0
              : value === "("
                ? 1
                : value === ")"
                  ? -1
                  : 0);
        },
      0
    );
    if (parity !== 0) {
      throw new Error("Parenthesis mismatch");
    }
  }
  private isOperation(tokens: Token[]): boolean {
    let parenLevel = 0;
    for (const { value, type } of tokens) {
      if (type === "punctuation") {
        parenLevel += value === "(" ? 1 : -1;
      }
      if (parenLevel === 0 && type === "operation") {
        return true;
      }
    }
    return false;
  }
  private findOperationIndex(tokens: Token[]): number {
    let parenLevel = 0;
    const operatorIndices = tokens.reduce(
      (indices, { type, value }, index) => {
        if (type === "punctuation") {
          parenLevel += value === "(" ? 1 : -1;
        }
        if (parenLevel === 0 && type === "operation") {
          indices[value] = indices[value] === -1 ? index : indices[value];
        }
        return indices;
      },
      {
        "*": -1,
        "+": -1,
        "-": -1,
        "/": -1,
      }
    );
    return operatorIndices["+"] > -1
      ? operatorIndices["+"]
      : operatorIndices["-"] > -1
      ? operatorIndices["-"]
      : operatorIndices["/"] > -1
      ? operatorIndices["/"]
      : operatorIndices["*"];
  }
  private isFunction(tokens: Token[]): boolean {
    return tokens[0]?.type === "function";
  }
}

export class Evaluator {
  private context: Record<string, number | string> = {};
  constructor(private readonly functionCollection: FunctionCollection) {}
  evaluate(
    parseTree: ParseTree,
    context: Record<string, number | string> = {}
  ) {
    this.context = context;
    return this.execute(parseTree);
  }
  private execute(parseTree: ParseTree): number | string {
    return parseTree.type === "operation"
      ? this.evaluateOperation(parseTree)
      : parseTree.type === "function"
      ? this.evaluateFunction(parseTree)
      : parseTree.type === "constant"
      ? this.evaluateConstant(parseTree)
      : parseTree.type === "variable"
      ? this.evaluateVariable(parseTree)
      : "ERROR";
  }
  private evaluateConstant({
    value,
  }: Constant & { children?: ParseTree[] }): string | number {
    // ajouter une erreur si !== string | numbe ??
    return value;
  }
  private evaluateVariable({
    value,
  }: Variable & { children?: ParseTree[] }): string | number {
    if (!Object.keys(this.context).includes(value)) {
      throw new Error(`Variable ${value} undefined in context`);
    }
    if (!this.context[value]) {
      throw new Error(
        `Value ${value} undefined in context ${JSON.stringify(
          this.context,
          null,
          4
        )}`
      );
    }
    // ajouter une erreur si !== string | numbe ??
    return this.context[value];
  }
  private evaluateFunction({
    value: functionName,
    children = [],
  }: Func & { children?: ParseTree[] }): string | number {
    if (!this.functionCollection.hasWithArity(functionName, children.length)) {
      throw new Error(`Unknown function ${functionName}`);
    }
    const args = children.map((token) => this.execute(token));
    return this.functionCollection.call(functionName, args);
  }
  private evaluateOperation({
    value,
    children = [],
  }: Operation & { children?: ParseTree[] }): string | number {
    const [leftOperand, rightOperand] = children;
    if (!leftOperand) {
      throw new Error(`Missing left operand in operation ${value}`);
    }
    if (!rightOperand) {
      throw new Error(`Missing right operand in operation ${value}`);
    }
    return value === "+"
      ? this.add(leftOperand, rightOperand)
      : value === "-"
      ? this.subtract(leftOperand, rightOperand)
      : value === "*"
      ? this.multiply(leftOperand, rightOperand)
      : this.divide(leftOperand, rightOperand);
  }
  private divide(leftOperand: ParseTree, rightOperand: ParseTree): number {
    return (
      Number(this.execute(leftOperand)) / Number(this.execute(rightOperand))
    );
  }
  private multiply(leftOperand: ParseTree, rightOperand: ParseTree): number {
    return (
      Number(this.execute(leftOperand)) * Number(this.execute(rightOperand))
    );
  }
  private subtract(leftOperand: ParseTree, rightOperand: ParseTree): number {
    return (
      Number(this.execute(leftOperand)) - Number(this.execute(rightOperand))
    );
  }
  private add(leftOperand: ParseTree, rightOperand: ParseTree): number {
    return (
      Number(this.execute(leftOperand)) + Number(this.execute(rightOperand))
    );
  }
}

type Status = {
  isValid: boolean;
  comment?: string;
};

export class FormuleMagique {
  private readonly parsing: Parsing;
  private readonly evaluator: Evaluator;
  constructor(functionCollection: FunctionCollection) {
    this.parsing = new Parsing(functionCollection);
    this.evaluator = new Evaluator(functionCollection);
  }
  validate(formula: Token[]): Status {
    try {
      this.parsing.do(formula);
      return {
        isValid: true,
      };
    } catch (error) {
      return {
        isValid: false,
        comment: (error as Error).message,
      };
    }
  }
  parse(formula: Token[]): ParseTree {
    return this.parsing.do(formula);
  }
  evaluate(
    formula: ParseTree,
    context: Record<string, number | string> = {}
  ): number | string {
    return this.evaluator.evaluate(formula, context);
  }
}

type UsableFunc = (...args: (string | number)[]) => string | number;

export class FunctionCollection {
  private collection = new Map<string, UsableFunc>();
  private arities = new Map<string, number>()
  register(func: UsableFunc, arity: number): FunctionCollection {
    this.collection.set(func.name, func);
    this.arities.set(func.name, arity)
    return this;
  }
  has(name: string): boolean {
    return this.collection.has(name);
  }
  hasWithArity(name: string, arity: number): boolean {
    return (
      this.collection.has(name) && this.arities.get(name) === arity
    );
  }
  call(name: string, args: (string | number)[]) {
    if (!this.collection.has(name)) {
      throw new Error(`Unknown function ${name}`);
    }
    const func = this.collection.get(name)!;
    if (this.arities.get(name) !== args.length) {
      throw new Error(
        `Arity error: function ${func.name} requires ${func.length} arguments`
      );
    }
    return func.apply(null, args);
  }
}

export const functionCollection = new FunctionCollection()
  .register(function replace(...args: (string | number)[]): string {
    const [source, target, replacement] = args;
    if (!source) {
      throw new Error("Source is missing in function replace");
    }
    if (!target) {
      throw new Error("Target is missing in function replace");
    }
    if (!replacement) {
      throw new Error("Replacement is missing in function replace");
    }
    return `${source}`.replaceAll(`${target}`, `${replacement}`);
  }, 3)
  .register(function concat(...args: (number | string)[]): string {
    return args.map((node) => node).join("");
  }, 2);


export const formuleMagique = new FormuleMagique(functionCollection);
