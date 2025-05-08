import { describe, expect, test } from "vitest";
import {
  Interpretor,
  Operation,
  ParseTree,
  Parsing,
  type Token,
} from "./parser";

describe("Parsing and interpreting", () => {
  describe("Parsing", () => {
    test("Parsing instantiates ", () => {
      expect(() => new Parsing()).not.toThrow();
    });
    test("Parse constant A", () => {
      const parser = new Parsing();
      const parsed = parser.do([{ type: "constant", value: "A" }]);
      expect(parsed).toStrictEqual({
        type: "constant",
        value: "A",
      });
    });
    test("Parse constant B", () => {
      const parser = new Parsing();
      const parsed = parser.do([{ type: "constant", value: "B" }]);
      expect(parsed).toStrictEqual({
        type: "constant",
        value: "B",
      });
    });
    test("Parse constant concat(A, B)", () => {
      const parser = new Parsing();
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
      const parser = new Parsing();
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
      const parser = new Parsing();
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
        expect(() => new Parsing().do(tokens)).toThrow();
      }
    );
  });
  describe("Interpreting", () => {
    test("constant yields same value", () => {
      const formula: ParseTree = {
        type: "constant",
        value: "my value",
        children: [],
      }
      const result = new Interpretor().evaluate(formula);
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
      }
      const result = new Interpretor().evaluate(formula);
      expect(result).toStrictEqual(46);
    });
    test("addition of two variables", () => {
      const context = { a: 123, b: 321 }
      const formula: ParseTree = {
        type: "operation",
        value: "+",
        children: [
          { type: "variable", value: "a", children: [] },
          { type: "variable", value: "b", children: [] },
        ],
      }
      const result = new Interpretor().evaluate(formula, context);
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
      const result = new Interpretor().evaluate(formula, context);
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
      const result = new Interpretor().evaluate(formula, context);
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
      const result = new Interpretor().evaluate(formula, context);
      expect(result).toStrictEqual("L'âge du capitaine est : 46");
    });
  });
  describe("Parse and interpret", () => {
    test.each([
      {
        formula: [
          { type: "constant", value: 1 },
          { type: "operation", value: "+" },
          { type: "constant", value: 1 },
        ],
        result: 2,
      },
      {
        formula: [
          { type: "constant", value: 6 },
          { type: "operation", value: "*" },
          { type: "constant", value: 6 },
        ],
        result: 36,
      },
      {
        formula: [
          { type: "constant", value: 72 },
          { type: "operation", value: "/" },
          { type: "constant", value: 9 },
        ],
        result: 8,
      },
      {
        formula: [
          { type: "constant", value: 42 },
          { type: "operation", value: "-" },
          { type: "constant", value: 11 },
        ],
        result: 31,
      },
    ] as { formula: Token[]; result: number }[])(
      "Simple operations",
      ({ formula, result }) => {
        expect(
          new Interpretor().evaluate(new Parsing().do(formula))
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
            new Interpretor().evaluate(new Parsing().do(formula))
          ).toStrictEqual(result);
        }
      );
    });
    test("Concat variable and replace", () => {
      const formula: Token[] = [
        { type: "function", value: "replace" },
        { type: "punctuation", value: "(" },
        { type: "function", value: "concat" },
        { type: "punctuation", value: "(" },
        { type: "variable", value: "a" },
        { type: "punctuation", value: "," },
        { type: "variable", value: "b" },
        { type: "punctuation", value: ")" },
        { type: "punctuation", value: "," },
        { type: "constant", value: "Morceau" },
        { type: "punctuation", value: "," },
        { type: "constant", value: "Bout" },
        { type: "punctuation", value: ")" },
      ];
      const parsed = new Parsing().do(formula);
      const context = { a: "Marabout, ", b: "Morceau de ficelle" };
      const result = new Interpretor().evaluate(parsed, context);
      expect(result).toStrictEqual("Marabout, Bout de ficelle");
    });
  });
});
