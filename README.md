# Simple implementation of a parser and interpretor
## Purpose: 
- build formulas with simple arithmetic operators (+, -, *, /) and functions (replace, concat).
- provide custom functions
- Validate syntax
- execute in context: provide values for the variables used in the formula 

## How
A formula is essentially a list of tokens. Tokens are constants, variables, operators, functions and punctuation. A syntactically valid formulas can be evaluated. A context is an object containing the variables used in the formula. Given a context, a valid formula can be evaluated and return a string or a number.

## Examples:

### build a formula
```
const formula: Token[] = [
    { type: "constant", value: 42 },
    { type: "operation", value: "-" },
    { type: "punctuation", value: "(" },
    { type: "constant", value: 11 },
    { type: "operation", value: "-" },
    { type: "constant", value: 1 },
    { type: "punctuation", value: ")" },
]
```
### validate a formula
```
const formuleMagique = new FormuleMagique()
formuleMagique.validate(formula) // { isValid: true}
formuleMagique.validate(formula) // { isValid: false, comment: "invalid operation"}
```
### evaluate a formula against a context
```
const context = {intro: "Hello, ", outro: "World !"}
const result = formuleMagique.evaluate(formula, context)
```


## TO DO
- detection d'erreurs de parsing / validation d'input
- applique priorité des operateurs * / et + - (avec ou sans parens) (* / - +)
- register functions and operators aside (FunctionCatalogue ?)
- memoize parser 
