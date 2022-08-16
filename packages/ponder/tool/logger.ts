/* eslint-disable @typescript-eslint/no-explicit-any */
import { CONFIG } from "./config";

enum LogLevel {
  // Silent 0
  Error, // 1
  Info, // 2
  Warn, // 3
  Debug, // 4
}

const logger = {
  error: (...args: any) => {
    if (CONFIG.logLevel > LogLevel.Error) console.log(...args);
  },
  info: (...args: any) => {
    if (CONFIG.logLevel > LogLevel.Info) console.log(...args);
  },
  warn: (...args: any) => {
    if (CONFIG.logLevel > LogLevel.Warn) console.log(...args);
  },
  debug: (...args: any) => {
    if (CONFIG.logLevel > LogLevel.Debug) console.log(...args);
  },
};

export { logger, LogLevel };