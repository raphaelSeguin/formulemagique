import { describe, expect, test } from "vitest";
import {
  constant,
  formuleMagique,
  func,
  Evaluator,
  operation,
  ParseTree,
  Parsing,
  punctuation,
  variable,
  type Token,
  functionCollection,
} from "./parser";

describe("Parsing", () => {
  test("Parse constant A", () => {
    const parser = new Parsing(functionCollection);
    const parsed = parser.do([{ type: "constant", value: "A" }]);
    expect(parsed).toStrictEqual({
      type: "constant",
      value: "A",
    });
  });
  test("Parse constant B", () => {
    const parser = new Parsing(functionCollection);
    const parsed = parser.do([{ type: "constant", value: "B" }]);
    expect(parsed).toStrictEqual({
      type: "constant",
      value: "B",
    });
  });
  test("Parse constant concat(A, B)", () => {
    const parser = new Parsing(functionCollection);
    const parsed = parser.do([
      { type: "function", value: "concat" },
      { type: "punctuation", value: "(" },
      { type: "constant", value: "A" },
      { type: "punctuation", value: "," },
      { type: "constant", value: "B" },
      { type: "punctuation", value: ")" },
    ]);
    expect(parsed).toStrictEqual({
      type: "function",
      value: "concat",
      children: [
        { type: "constant", value: "A" },
        { type: "constant", value: "B" },
      ],
    });
  });

  test("parse addition of constants", () => {
    const parser = new Parsing(functionCollection);
    const parsed = parser.do([
      { type: "constant", value: "A" },
      { type: "operation", value: "+" },
      { type: "constant", value: "B" },
    ]);
    expect(parsed).toStrictEqual({
      type: "operation",
      value: "+",
      children: [
        { type: "constant", value: "A" },
        { type: "constant", value: "B" },
      ],
    });
  });

  test("parse addition of three constants", () => {
    const parser = new Parsing(functionCollection);
    const parsed = parser.do([
      { type: "constant", value: "A" },
      { type: "operation", value: "+" },
      { type: "constant", value: "B" },
      { type: "operation", value: "+" },
      { type: "constant", value: "C" },
    ]);
    expect(parsed).toStrictEqual({
      type: "operation",
      value: "+",
      children: [
        { type: "constant", value: "A" },
        {
          type: "operation",
          value: "+",
          children: [
            { type: "constant", value: "B" },
            { type: "constant", value: "C" },
          ],
        },
      ],
    });
  });
});
describe("Parsing errors", () => {
  test.each([
    [{ type: "operation", value: "+" }],
    [
      [
        { type: "constant", value: 1 },
        { type: "operation", value: "-" },
      ],
    ],
    [
      [
        { type: "operation", value: "/" },
        { type: "constant", value: 0 },
      ],
    ],
    [
      [
        { type: "constant", value: 1 },
        { type: "operation", value: "+" },
        { type: "constant", value: 1 },
        { type: "constant", value: 1 },
      ],
    ],
    [
      [
        { type: "constant", value: 1 },
        { type: "operation", value: "+" },
        { type: "constant", value: 1 },
        { type: "operation", value: "+" },
      ],
    ],
    [
      [
        { type: "punctuation", value: "," },
        { type: "constant", value: 1 },
        { type: "operation", value: "+" },
        { type: "constant", value: 1 },
      ],
    ],
    [
      [
        { type: "constant", value: 1 },
        { type: "operation", value: "/" },
        { type: "constant", value: 0 },
      ],
    ],
  ] as Token[][][])(
    `operations with syntax errors throw errors`,
    (tokens: Token[]) => {
      expect(() => new Parsing(functionCollection).do(tokens)).toThrow();
    }
  );
  test.each([
    [[punctuation("("), punctuation(")")]],
    [
      [
        punctuation("("),
        constant(2),
        operation("+"),
        punctuation("("),
        constant("5"),
        operation("*"),
        constant(3),
        punctuation(")"),
      ],
    ],
  ])(`parenthsis mismatch throw`, (tokens: Token[]) => {
    expect(() => new Parsing(functionCollection).do(tokens)).toThrow();
  });
});
describe("Evaluating", () => {
  test("constant yields same value", () => {
    const formula: ParseTree = {
      type: "constant",
      value: "my value",
      children: [],
    };
    const result = new Evaluator(functionCollection).evaluate(formula);
    expect(result).toStrictEqual("my value");
  });
  test("addition of two constants", () => {
    const formula: ParseTree = {
      type: "operation",
      value: "+",
      children: [
        { type: "constant", value: 12, children: [] },
        { type: "constant", value: "34", children: [] },
      ],
    };
    const result = new Evaluator(functionCollection).evaluate(formula);
    expect(result).toStrictEqual(46);
  });
  test("addition of two variables", () => {
    const context = { a: 123, b: 321 };
    const formula: ParseTree = {
      type: "operation",
      value: "+",
      children: [
        { type: "variable", value: "a", children: [] },
        { type: "variable", value: "b", children: [] },
      ],
    };
    const result = new Evaluator(functionCollection).evaluate(formula, context);
    expect(result).toStrictEqual(444);
  });
  test("function concat on variables", () => {
    const context = { a: "hello", b: " world" };
    const formula: ParseTree = {
      type: "function",
      value: "concat",
      children: [
        { type: "variable", value: "a", children: [] },
        { type: "variable", value: "b", children: [] },
      ],
    };
    const result = new Evaluator(functionCollection).evaluate(formula, context);
    expect(result).toStrictEqual("hello world");
  });
  test("function concat on variables", () => {
    const context = { a: "hello", b: " world" };
    const formula: ParseTree = {
      type: "function",
      value: "concat",
      children: [
        { type: "variable", value: "a", children: [] },
        { type: "variable", value: "b", children: [] },
      ],
    };
    const result = new Evaluator(functionCollection).evaluate(formula, context);
    expect(result).toStrictEqual("hello world");
  });
  test("concat operations (nesting)", () => {
    const context = { a: 12, b: 34 };
    const formula: ParseTree = {
      type: "function",
      value: "concat",
      children: [
        {
          type: "constant",
          value: "L'âge du capitaine est : ",
          children: [],
        },
        {
          type: "operation",
          value: "+",
          children: [
            {
              type: "variable",
              value: "a",
              children: [],
            },
            {
              type: "variable",
              value: "b",
              children: [],
            },
          ],
        },
      ],
    };
    const result = new Evaluator(functionCollection).evaluate(formula, context);
    expect(result).toStrictEqual("L'âge du capitaine est : 46");
  });
  test('Undefined variable error', () => {
    const formula: Token[] = [ variable("nulles"), operation("+"), variable("inconnus")]
    const parsed = formuleMagique.parse(formula)
    expect(() => formuleMagique.evaluate(parsed, {nulles: 1})).toThrow() 
  })
});
describe("Parse and evaluate", () => {
  test.each([
    {
      formula: [constant(1), operation("+"), constant(1)],
      result: 2,
    },
    {
      formula: [constant(6), operation("*"), constant(6)],
      result: 36,
    },
    {
      formula: [constant(72), operation("/"), constant(9)],
      result: 8,
    },
    {
      formula: [constant(42), operation("-"), constant(11)],
      result: 31,
    },
  ] as { formula: Token[]; result: number }[])(
    "Simple operations",
    ({ formula, result }) => {
      expect(
        new Evaluator(functionCollection).evaluate(
          new Parsing(functionCollection).do(formula)
        )
      ).toStrictEqual(result);
    }
  );
  describe("Operations with parenthesis", () => {
    test.each([
      {
        formula: [
          { type: "constant", value: 42 },
          { type: "operation", value: "-" },
          { type: "punctuation", value: "(" },
          { type: "constant", value: 11 },
          { type: "operation", value: "-" },
          { type: "constant", value: 1 },
          { type: "punctuation", value: ")" },
        ],
        result: 32,
      },
      {
        formula: [
          // (6 * 7) - (((10 / 2) + 6) - 1)
          { type: "punctuation", value: "(" },
          { type: "constant", value: 6 },
          { type: "operation", value: "*" },
          { type: "constant", value: 7 },
          { type: "punctuation", value: ")" },
          { type: "operation", value: "-" },
          { type: "punctuation", value: "(" },
          { type: "punctuation", value: "(" },
          { type: "punctuation", value: "(" },
          { type: "constant", value: 10 },
          { type: "operation", value: "/" },
          { type: "constant", value: 2 },
          { type: "punctuation", value: ")" },
          { type: "operation", value: "+" },
          { type: "constant", value: 6 },
          { type: "punctuation", value: ")" },
          { type: "operation", value: "-" },
          { type: "constant", value: 1 },
          { type: "punctuation", value: ")" },
        ],
        result: 32,
      },
    ] as { formula: Token[]; result: number }[])(
      "Operations with parenthesis",
      ({ formula, result }) => {
        expect(
          new Evaluator(functionCollection).evaluate(
            new Parsing(functionCollection).do(formula)
          )
        ).toStrictEqual(result);
      }
    );
  });
  describe("Operators priority", () => {
    test("* before +", () => {
      const formula = formuleMagique.parse([
        constant(2),
        operation("*"),
        constant(4),
        operation("+"),
        constant(3),
      ]);
      expect(formuleMagique.evaluate(formula)).toStrictEqual(11);
    });
    test("* before /", () => {
      const formula = formuleMagique.parse([
        constant(12),
        operation("*"),
        constant(3),
        operation("/"),
        constant(2),
        operation("*"),
        constant(3),
      ]);
      expect(formuleMagique.evaluate(formula)).toStrictEqual(6);
    });
    test("subtract inside parens before outside", () => {
      const formula = formuleMagique.parse([
        punctuation("("),
        constant(12),
        operation("-"),
        constant(2),
        punctuation(")"),
        operation("*"),
        constant(3),
      ]);
      expect(formuleMagique.evaluate(formula)).toStrictEqual(30);
    });
    test("divide inside parens before outside", () => {
      const formula = formuleMagique.parse([
        constant(12),
        operation("*"),
        punctuation("("),
        constant(10),
        operation("/"),
        constant(5),
        punctuation(")"),
        operation("*"),
        constant(3),
      ]);
      expect(formuleMagique.evaluate(formula)).toStrictEqual(72);
    });
  });
  test("deep parens", () => {
    const formula = formuleMagique.parse([
      constant(3),
      operation("+"),
      punctuation("("),
      punctuation("("),
      constant(2),
      operation("+"),
      constant(5),
      punctuation(")"),
      operation("*"),
      constant(2),
      punctuation(")"),
      operation("/"),
      punctuation("("),
      constant(4),
      operation("+"),
      constant(3),
      punctuation(")"),
    ]);
    expect(formuleMagique.evaluate(formula)).toStrictEqual(5);
  });
  test("Concat variable and replace", () => {
    const formula: Token[] = [
      func("replace"),
      punctuation("("),
      func("concat"),
      punctuation("("),
      variable("a"),
      punctuation(","),
      variable("b"),
      punctuation(")"),
      punctuation(","),
      constant("Morceau"),
      punctuation(","),
      constant("Bout"),
      punctuation(")"),
    ];
    const parsed = new Parsing(functionCollection).do(formula);
    const context = { a: "Marabout, ", b: "Morceau de ficelle" };
    const result = new Evaluator(functionCollection).evaluate(parsed, context);
    expect(result).toStrictEqual("Marabout, Bout de ficelle");
  });
});
