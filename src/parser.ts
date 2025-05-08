import { enumerate } from "./utilities";

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

export class Parsing {
  constructor() {}
  do(tokens: Token[]): ParseTree {
    const result = this.parse(tokens);
    if (result.length !== 1 || result[0] === undefined) {
      throw new Error("Parsing Error");
    }
    return result[0];
  }
  private parse(tokens: ParseTree[]): ParseTree[] {
    if (this.isOperation(tokens)) {
      return [this.parseOperation(tokens)];
    }
    if (this.isFunction(tokens)) {
      return [this.parseFunction(tokens)];
    }
    // refactor
    if (tokens[0]?.type === "constant" && tokens[1]?.type === "constant") {
      throw new Error("Parsing Error");
    }
    if (tokens[0]?.type === "constant" && tokens[1]?.type === "punctuation") {
      throw new Error("Parsing Error");
    }
    return tokens;
  }
  // private isLeaf(token: Token): boolean {
  //   return ["constant", "variable"].includes(token.type);
  // }
  private parseOperation(tokens: ParseTree[]): ParseTree {
    const operationIndex = this.findOperationIndex(tokens);
    const leftOperand = this.removeOutterParens(
      tokens.slice(0, operationIndex)
    );
    const operation = tokens[operationIndex]!;
    const rightOperand = this.removeOutterParens(
      tokens.slice(operationIndex + 1, tokens.length)
    );
    if (!rightOperand.length || !leftOperand.length) {
      throw new Error(`Operations require two operands`);
    }
    if (
      operation.value === "/" &&
      rightOperand[0]?.type === "constant" &&
      rightOperand[0].value === 0
    ) {
      throw new Error("Division by zero is not allowed");
    }
    operation.children = [
      ...this.parse(leftOperand),
      ...this.parse(rightOperand),
    ];
    return operation;
  }
  private parseFunction(tokens: ParseTree[]): ParseTree {
    const value = tokens[0]!.value as Function["value"];
    const functionArguments = this.removeOutterParens(tokens.slice(1));
    const children = this.splitArguments(functionArguments).map(
      (tokens) => this.parse(tokens)[0]!
    );
    return {
      type: "function",
      value,
      children,
    };
  }
  private splitArguments(tokens: Token[]): Token[][] {
    let parenLevel = 0;
    const splittedTokens = [[]] as Token[][];
    for (const token of tokens) {
      if (token.type === "punctuation" && ["(", ")"].includes(token.value)) {
        parenLevel += token.value === "(" ? 1 : -1;
      }
      if (parenLevel === 0 && token.value === ",") {
        splittedTokens.push([]);
      } else {
        splittedTokens.at(-1)?.push(token);
      }
    }
    return splittedTokens;
  }
  private removeOutterParens(tokens: Token[]): Token[] {
    const openParenIndex = tokens.findIndex(({ value }) => value === "(");
    const closeParenIndex = tokens.reduce(
      (lastIndex, token, index) => (token.value === ")" ? index : lastIndex),
      0
    );
    if (openParenIndex === -1 || closeParenIndex === -1) {
      return tokens;
    }
    return tokens.filter(
      (_, i) => i !== openParenIndex && i !== closeParenIndex
    );
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
    for (const [index, { value, type }] of enumerate(tokens)) {
      if (type === "punctuation") {
        parenLevel += value === "(" ? 1 : -1;
      }
      if (parenLevel === 0 && type === "operation") {
        return index;
      }
    }
    return -1;
  }

  private isFunction(tokens: Token[]): boolean {
    if (this.isOperation(tokens)) {
      return false;
    }
    return tokens.some(({ type }) => type === "function");
  }
}

export class Interpretor {
  constructor(private readonly context: Record<string, number | string>) {}
  execute(parseTree: ParseTree): number | string {
    return parseTree.type === "operation"
      ? this.interpretOperation(parseTree)
      : parseTree.type === "function"
      ? this.interpretFunction(parseTree)
      : parseTree.type === "constant"
      ? this.interpretConstant(parseTree)
      : parseTree.type === "variable"
      ? this.interpretVariable(parseTree)
      : "ERROR";
  }
  private interpretConstant({
    value,
  }: Constant & { children?: ParseTree[] }): string | number {
    return value;
  }
  private interpretVariable({
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
    return this.context[value];
  }
  private interpretFunction({
    value,
    children = [],
  }: Function & { children?: ParseTree[] }): string | number {
    return value === "concat"
      ? this.concat(...children)
      : value === "replace"
      ? this.replace(...children)
      : "ERROR";
  }
  private interpretOperation({
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
  private replace(...args: ParseTree[]): string {
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
    return `${this.execute(source)}`.replaceAll(
      `${this.execute(target)}`,
      `${this.execute(replacement)}`
    );
  }
  private concat(...args: ParseTree[]): string {
    return args.map((node) => this.execute(node)).join("");
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
