import { describe, expect, test } from "vitest";
import { Interpretor, Parsing, type Token } from "./parser";

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
  describe("Interpreting", () => {
    test("constant yields same value", () => {
      const result = new Interpretor({}).execute({
        type: "constant",
        value: "my value",
        children: [],
      });
      expect(result).toStrictEqual("my value");
    });
    test("addition of two constants", () => {
      const result = new Interpretor({}).execute({
        type: "operation",
        value: "+",
        children: [
          { type: "constant", value: 12, children: [] },
          { type: "constant", value: "34", children: [] },
        ],
      });
      expect(result).toStrictEqual(46);
    });
    test("addition of two variables", () => {
      const result = new Interpretor({ a: 123, b: 321 }).execute({
        type: "operation",
        value: "+",
        children: [
          { type: "variable", value: "a", children: [] },
          { type: "variable", value: "b", children: [] },
        ],
      });
      expect(result).toStrictEqual(444);
    });
    test("function concat on variables", () => {
      const result = new Interpretor({ a: "hello", b: " world" }).execute({
        type: "function",
        value: "concat",
        children: [
          { type: "variable", value: "a", children: [] },
          { type: "variable", value: "b", children: [] },
        ],
      });
      expect(result).toStrictEqual("hello world");
    });
    test("function concat on variables", () => {
      const result = new Interpretor({ a: "hello", b: " world" }).execute({
        type: "function",
        value: "concat",
        children: [
          { type: "variable", value: "a", children: [] },
          { type: "variable", value: "b", children: [] },
        ],
      });
      expect(result).toStrictEqual("hello world");
    });
    test("concat operations (nesting)", () => {
      const result = new Interpretor({ a: 12, b: 34 }).execute({
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
      });
      expect(result).toStrictEqual("L'âge du capitaine est : 46");
    });
  })
  describe('End to end', () => {
    test('Concat variable and replace', () => {
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
        ]
      const parsed = new Parsing().do(formula)
      const context = {a: "Marabout, ", b: "Morceau de ficelle"}
      const result = new Interpretor(context).execute(parsed)
      expect(result).toStrictEqual("Marabout, Bout de ficelle")
    })
  })
});
