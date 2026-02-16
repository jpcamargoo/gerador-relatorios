import winston from "winston";
import { config } from "../config/env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5_000_000,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 10_000_000,
      maxFiles: 5,
    }),
  ],
});
