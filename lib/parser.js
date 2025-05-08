"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormuleMagique = exports.Interpretor = exports.Parsing = void 0;
var utilities_1 = require("./utilities");
var Parsing = /** @class */ (function () {
    function Parsing() {
    }
    Parsing.prototype.do = function (tokens) {
        var result = this.parse(tokens);
        if (result.length !== 1 || result[0] === undefined) {
            throw new Error("Parsing Error");
        }
        return result[0];
    };
    Parsing.prototype.parse = function (tokens) {
        var _a, _b, _c, _d;
        if (this.isOperation(tokens)) {
            return [this.parseOperation(tokens)];
        }
        if (this.isFunction(tokens)) {
            return [this.parseFunction(tokens)];
        }
        // refactor
        if (((_a = tokens[0]) === null || _a === void 0 ? void 0 : _a.type) === "constant" && ((_b = tokens[1]) === null || _b === void 0 ? void 0 : _b.type) === "constant") {
            throw new Error("Parsing Error");
        }
        if (((_c = tokens[0]) === null || _c === void 0 ? void 0 : _c.type) === "constant" && ((_d = tokens[1]) === null || _d === void 0 ? void 0 : _d.type) === "punctuation") {
            throw new Error("Parsing Error");
        }
        return tokens;
    };
    // private isLeaf(token: Token): boolean {
    //   return ["constant", "variable"].includes(token.type);
    // }
    Parsing.prototype.parseOperation = function (tokens) {
        var _a;
        var operationIndex = this.findOperationIndex(tokens);
        var leftOperand = this.removeOutterParens(tokens.slice(0, operationIndex));
        var operation = tokens[operationIndex];
        var rightOperand = this.removeOutterParens(tokens.slice(operationIndex + 1, tokens.length));
        if (!rightOperand.length || !leftOperand.length) {
            throw new Error("Operations require two operands");
        }
        if (operation.value === "/" &&
            ((_a = rightOperand[0]) === null || _a === void 0 ? void 0 : _a.type) === "constant" &&
            rightOperand[0].value === 0) {
            throw new Error("Division by zero is not allowed");
        }
        operation.children = __spreadArray(__spreadArray([], this.parse(leftOperand), true), this.parse(rightOperand), true);
        return operation;
    };
    Parsing.prototype.parseFunction = function (tokens) {
        var _this = this;
        var value = tokens[0].value;
        var functionArguments = this.removeOutterParens(tokens.slice(1));
        var children = this.splitArguments(functionArguments).map(function (tokens) { return _this.parse(tokens)[0]; });
        return {
            type: "function",
            value: value,
            children: children,
        };
    };
    Parsing.prototype.splitArguments = function (tokens) {
        var _a;
        var parenLevel = 0;
        var splittedTokens = [[]];
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            if (token.type === "punctuation" && ["(", ")"].includes(token.value)) {
                parenLevel += token.value === "(" ? 1 : -1;
            }
            if (parenLevel === 0 && token.value === ",") {
                splittedTokens.push([]);
            }
            else {
                (_a = splittedTokens.at(-1)) === null || _a === void 0 ? void 0 : _a.push(token);
            }
        }
        return splittedTokens;
    };
    Parsing.prototype.removeOutterParens = function (tokens) {
        var openParenIndex = tokens.findIndex(function (_a) {
            var value = _a.value;
            return value === "(";
        });
        var closeParenIndex = tokens.reduce(function (lastIndex, token, index) { return (token.value === ")" ? index : lastIndex); }, 0);
        if (openParenIndex === -1 || closeParenIndex === -1) {
            return tokens;
        }
        return tokens.filter(function (_, i) { return i !== openParenIndex && i !== closeParenIndex; });
    };
    Parsing.prototype.isOperation = function (tokens) {
        var parenLevel = 0;
        for (var _i = 0, tokens_2 = tokens; _i < tokens_2.length; _i++) {
            var _a = tokens_2[_i], value = _a.value, type = _a.type;
            if (type === "punctuation") {
                parenLevel += value === "(" ? 1 : -1;
            }
            if (parenLevel === 0 && type === "operation") {
                return true;
            }
        }
        return false;
    };
    Parsing.prototype.findOperationIndex = function (tokens) {
        var parenLevel = 0;
        for (var _i = 0, _a = (0, utilities_1.enumerate)(tokens); _i < _a.length; _i++) {
            var _b = _a[_i], index = _b[0], _c = _b[1], value = _c.value, type = _c.type;
            if (type === "punctuation") {
                parenLevel += value === "(" ? 1 : -1;
            }
            if (parenLevel === 0 && type === "operation") {
                return index;
            }
        }
        return -1;
    };
    Parsing.prototype.isFunction = function (tokens) {
        if (this.isOperation(tokens)) {
            return false;
        }
        return tokens.some(function (_a) {
            var type = _a.type;
            return type === "function";
        });
    };
    return Parsing;
}());
exports.Parsing = Parsing;
var Interpretor = /** @class */ (function () {
    function Interpretor() {
        this.context = {};
    }
    Interpretor.prototype.evaluate = function (parseTree, context) {
        if (context === void 0) { context = {}; }
        this.context = context;
        return this.execute(parseTree);
    };
    Interpretor.prototype.execute = function (parseTree) {
        return parseTree.type === "operation"
            ? this.interpretOperation(parseTree)
            : parseTree.type === "function"
                ? this.interpretFunction(parseTree)
                : parseTree.type === "constant"
                    ? this.interpretConstant(parseTree)
                    : parseTree.type === "variable"
                        ? this.interpretVariable(parseTree)
                        : "ERROR";
    };
    Interpretor.prototype.interpretConstant = function (_a) {
        var value = _a.value;
        return value;
    };
    Interpretor.prototype.interpretVariable = function (_a) {
        var value = _a.value;
        if (!Object.keys(this.context).includes(value)) {
            throw new Error("Variable ".concat(value, " undefined in context"));
        }
        if (!this.context[value]) {
            throw new Error("Value ".concat(value, " undefined in context ").concat(JSON.stringify(this.context, null, 4)));
        }
        return this.context[value];
    };
    Interpretor.prototype.interpretFunction = function (_a) {
        var value = _a.value, _b = _a.children, children = _b === void 0 ? [] : _b;
        return value === "concat"
            ? this.concat.apply(this, children) : value === "replace"
            ? this.replace.apply(this, children) : "ERROR";
    };
    Interpretor.prototype.interpretOperation = function (_a) {
        var value = _a.value, _b = _a.children, children = _b === void 0 ? [] : _b;
        var leftOperand = children[0], rightOperand = children[1];
        if (!leftOperand) {
            throw new Error("Missing left operand in operation ".concat(value));
        }
        if (!rightOperand) {
            throw new Error("Missing right operand in operation ".concat(value));
        }
        return value === "+"
            ? this.add(leftOperand, rightOperand)
            : value === "-"
                ? this.subtract(leftOperand, rightOperand)
                : value === "*"
                    ? this.multiply(leftOperand, rightOperand)
                    : this.divide(leftOperand, rightOperand);
    };
    Interpretor.prototype.replace = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var source = args[0], target = args[1], replacement = args[2];
        if (!source) {
            throw new Error("Source is missing in function replace");
        }
        if (!target) {
            throw new Error("Target is missing in function replace");
        }
        if (!replacement) {
            throw new Error("Replacement is missing in function replace");
        }
        return "".concat(this.execute(source)).replaceAll("".concat(this.execute(target)), "".concat(this.execute(replacement)));
    };
    Interpretor.prototype.concat = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.map(function (node) { return _this.execute(node); }).join("");
    };
    Interpretor.prototype.divide = function (leftOperand, rightOperand) {
        return (Number(this.execute(leftOperand)) / Number(this.execute(rightOperand)));
    };
    Interpretor.prototype.multiply = function (leftOperand, rightOperand) {
        return (Number(this.execute(leftOperand)) * Number(this.execute(rightOperand)));
    };
    Interpretor.prototype.subtract = function (leftOperand, rightOperand) {
        return (Number(this.execute(leftOperand)) - Number(this.execute(rightOperand)));
    };
    Interpretor.prototype.add = function (leftOperand, rightOperand) {
        return (Number(this.execute(leftOperand)) + Number(this.execute(rightOperand)));
    };
    return Interpretor;
}());
exports.Interpretor = Interpretor;
var FormuleMagique = /** @class */ (function () {
    function FormuleMagique(parsing, interpretor) {
        this.parsing = parsing;
        this.interpretor = interpretor;
    }
    FormuleMagique.prototype.validate = function (formula) {
        try {
            this.parsing.do(formula);
            return {
                isValid: true,
            };
        }
        catch (_a) {
            return {
                isValid: false,
                comment: "Empty formula is not valid",
            };
        }
    };
    FormuleMagique.prototype.evaluate = function (formula, context) {
        return this.interpretor.evaluate(this.parsing.do(formula), context);
    };
    return FormuleMagique;
}());
exports.FormuleMagique = FormuleMagique;
