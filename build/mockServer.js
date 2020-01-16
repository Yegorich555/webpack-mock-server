"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line import/no-extraneous-dependencies
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("./logger"));
express_1.default().listen(8765, function listenCallback() {
    logger_1.default.info("Started", "");
    console.timeStamp();
});
