"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCall = exports.Logger = exports.logging = exports.LogManager = void 0;
exports.logCallDetails = logCallDetails;
exports.log = log;
/*
 * EventEmitter2 is an implementation of the EventEmitter module found in Node.js.
 * In addition to having a better benchmark performance than EventEmitter and being
 * browser-compatible, it also extends the interface of EventEmitter with many
 * additional non-breaking features.
 *
 * This has been added as EventEmitter in Node.JS is not available in the browser.
 * https://www.npmjs.com/package/eventemitter2
 */
const eventemitter2_1 = require("eventemitter2");
/**
 * Logger class to handle consistency of logs across the plugin.
 *
 * @class LogManager
 * @extends {EventEmitter2}
 */
class LogManager extends eventemitter2_1.EventEmitter2 {
    constructor() {
        super(...arguments);
        this.options = {
            minLevels: {
                '': 'info',
                tasks: 'info',
            },
        };
        // Prevent the console logger from being added twice
        this.consoleLoggerRegistered = false;
        this.arrAvg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    /**
     * Set the minimum log levels for the module name or global.
     *
     * @param {LogOptions} options
     * @return {*}  {LogManager}
     */
    configure(options) {
        this.options = Object.assign({}, this.options, options);
        return this;
    }
    /**
     * Returns a logger instance for the given module name.
     *
     * @param {string} module
     * @return {*}  {Logger}
     */
    getLogger(module) {
        let minLevel = 'none';
        let match = '';
        for (const key in this.options.minLevels) {
            if (module.startsWith(key) && key.length >= match.length) {
                minLevel = this.options.minLevels[key];
                match = key;
            }
        }
        return new Logger(this, module, minLevel);
    }
    /**
     *
     *
     * @param {(logEntry: LogEntry) => void} listener
     * @return {*}  {LogManager}
     */
    onLogEntry(listener) {
        this.on('log', listener);
        return this;
    }
    /**
     * Registers a logger that write to the console.
     *
     * @return {*}  {LogManager}
     */
    registerConsoleLogger() {
        if (this.consoleLoggerRegistered)
            return this;
        this.onLogEntry((logEntry) => {
            let msg = `[${window.moment().format('YYYY-MM-DD-HH:mm:ss.SSS')}][${logEntry.level}][${logEntry.module}]`;
            if (logEntry.traceId) {
                msg += `[${logEntry.traceId}]`;
            }
            msg += ` ${logEntry.message}`;
            if (logEntry.objects === undefined) {
                logEntry.objects = '';
            }
            switch (logEntry.level) {
                case 'trace':
                    console.trace(msg, logEntry.objects);
                    break;
                case 'debug':
                    console.debug(msg, logEntry.objects);
                    break;
                case 'info':
                    console.info(msg, logEntry.objects);
                    break;
                case 'warn':
                    console.warn(msg, logEntry.objects);
                    break;
                case 'error':
                    console.error(msg, logEntry.objects);
                    break;
                default:
                    console.log(`{${logEntry.level}} ${msg}`, logEntry.objects);
            }
        });
        this.consoleLoggerRegistered = true;
        return this;
    }
}
exports.LogManager = LogManager;
exports.logging = new LogManager();
/**
 * Main logging library, to view the logs a logger listener must be added. The
 * Console Logger is already implemented for this project.
 *
 * @class Logger
 */
class Logger {
    /**
     * Creates an instance of Logger.
     * @param {EventEmitter2} logManager
     * @param {string} module
     * @param {string} minLevel
     */
    constructor(logManager, module, minLevel) {
        this.levels = {
            trace: 1,
            debug: 2,
            info: 3,
            warn: 4,
            error: 5,
        };
        this.logManager = logManager;
        this.module = module;
        this.minLevel = this.levelToInt(minLevel);
    }
    /**
     * Converts a string level (trace/debug/info/warn/error) into a number
     *
     * @param minLevel
     */
    levelToInt(minLevel) {
        if (minLevel.toLowerCase() in this.levels)
            return this.levels[minLevel.toLowerCase()];
        else
            return 99;
    }
    /**
     * Central logging method.
     * @param logLevel
     * @param message
     */
    log(logLevel, message, objects) {
        const level = this.levelToInt(logLevel);
        if (level < this.minLevel)
            return;
        const logEntry = {
            level: logLevel,
            module: this.module,
            message,
            objects,
            traceId: undefined,
        };
        // Obtain the line/file through a thoroughly hacky method
        // This creates a new stack trace and pulls the caller from it.  If the caller
        // if .trace()
        // const error = new Error('');
        // if (error.stack) {
        //     const cla = error.stack.split('\n');
        //     let idx = 1;
        //     while (idx < cla.length && cla[idx].includes('at Logger.Object.')) idx++;
        //     if (idx < cla.length) {
        //         logEntry.location = cla[idx].slice(cla[idx].indexOf('at ') + 3, cla[idx].length);
        //     }
        // }
        this.logManager.emit('log', logEntry);
    }
    trace(message, objects) {
        this.log('trace', message, objects);
    }
    debug(message, objects) {
        this.log('debug', message, objects);
    }
    info(message, objects) {
        this.log('info', message, objects);
    }
    warn(message, objects) {
        this.log('warn', message, objects);
    }
    error(message, objects) {
        this.log('error', message, objects);
    }
    /**
     * Central logging method with a trace ID to track calls between modules/components.
     * @param logLevel
     * @param message
     */
    logWithId(logLevel, traceId, message, objects) {
        const level = this.levelToInt(logLevel);
        if (level < this.minLevel)
            return;
        const logEntry = {
            level: logLevel,
            module: this.module,
            message,
            objects,
            traceId,
        };
        this.logManager.emit('log', logEntry);
    }
    traceWithId(traceId, message, objects) {
        this.logWithId('trace', traceId, message, objects);
    }
    debugWithId(traceId, message, objects) {
        this.logWithId('debug', traceId, message, objects);
    }
    infoWithId(traceId, message, objects) {
        this.logWithId('info', traceId, message, objects);
    }
    warnWithId(traceId, message, objects) {
        this.logWithId('warn', traceId, message, objects);
    }
    errorWithId(traceId, message, objects) {
        this.logWithId('error', traceId, message, objects);
    }
}
exports.Logger = Logger;
// Comment from the original author:
// I was calculating metrics on call times to debug some performance issues.
// This is a simple JS hashmap where the id could be one of the 4 items.
// (see the comment-out code in logCall below...)
const timingMap = {};
/**
 * This deceleration will log the time taken to run the function it is attached to. Be
 * careful where it is added as it increases the output.
 *
 * @return {*}
 */
const logCall = (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    //const logger = logging.getLogger('taskssql.perf');
    descriptor.value = function (...args) {
        const startTime = new Date(Date.now());
        const result = originalMethod.apply(this, args);
        const endTime = new Date(Date.now());
        const name = `${target?.constructor?.name}${propertyKey}`;
        const time = endTime.getTime() - startTime.getTime();
        if (timingMap[name] === undefined) {
            timingMap[name] = [];
        }
        timingMap[name].push(time);
        //console.log(timingMap);
        // if (endTime.getTime() - startTime.getTime() > 50) {
        //     console.debug(
        //         `[debug][taskssql.perf] ${String(timingMap[name].avg).padEnd(4)}${String(
        //             endTime.getTime() - startTime.getTime(),
        //         ).padEnd(4)} ${target?.constructor?.name.padEnd(10)}${propertyKey.padEnd(20)}`,
        //     );
        //     // logger.debug(
        //     //     `${target?.constructor?.name}:${propertyKey}:called with ${args.length} arguments. Took: ${
        //     //         endTime.getTime() - startTime.getTime()
        //     //     }ms`,
        //     // );
        // }
        return result;
    };
    return descriptor;
};
exports.logCall = logCall;
function logCallDetails() {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const logger = exports.logging.getLogger('tasks');
        descriptor.value = async function (...args) {
            const startTime = new Date(Date.now());
            const result = await originalMethod.apply(this, args);
            const endTime = new Date(Date.now());
            const elapsed = endTime.getTime() - startTime.getTime();
            logger.debug(`${typeof target}:${propertyKey} called with ${args.length} arguments. Took: ${elapsed}ms ${JSON.stringify(args)}`);
            return result;
        };
        return descriptor;
    };
}
/**
 * Provides a simple log function that can be used to log messages against default module.
 *
 * @param {TLogLevelName} logLevel
 * @param {string} message
 */
function log(logLevel, message) {
    const logger = exports.logging.getLogger('tasks');
    switch (logLevel) {
        case 'trace':
            logger.trace(message);
            break;
        case 'debug':
            logger.debug(message);
            break;
        case 'info':
            logger.info(message);
            break;
        case 'warn':
            logger.warn(message);
            break;
        case 'error':
            logger.error(message);
            break;
        default:
            break;
    }
}
//# sourceMappingURL=logging.js.map