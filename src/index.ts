import { FunctionCollection, FormuleMagique } from "./parser";

export const functionCollection = new FunctionCollection()
  .register(function replace(...args: (string | number)[]): string {
    const [source, target, replacement] = args;
    return `${source}`.replaceAll(`${target}`, `${replacement}`);
  }, 3)
  .register(function concat(...args: (number | string)[]): string {
    return args.map((node) => node).join("");
  }, 2);

export const formuleMagique = new FormuleMagique(functionCollection);

export {
  FormuleMagique,
  FunctionCollection,
  constant,
  operation,
  variable,
  punctuation,
  func,
} from "./parser";
