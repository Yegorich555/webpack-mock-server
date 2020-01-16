// eslint-disable-next-line import/no-extraneous-dependencies
import express from "express";
import log from "./logger";

express().listen(8765, function listenCallback() {
  log.info("Started", "");
  console.timeStamp();
});
