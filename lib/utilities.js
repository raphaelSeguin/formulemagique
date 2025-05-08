"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumerate = enumerate;
function enumerate(list) {
    return Object.entries(list).map(function (_a) {
        var index = _a[0], value = _a[1];
        return [Number(index), value];
    });
}
