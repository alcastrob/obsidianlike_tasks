"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksEvents = void 0;
const logging_1 = require("../lib/logging");
var Event;
(function (Event) {
    Event["CacheUpdate"] = "obsidian-tasks-plugin:cache-update";
    Event["RequestCacheUpdate"] = "obsidian-tasks-plugin:request-cache-update";
    Event["ReloadOpenSearchResults"] = "obsidian-tasks-plugin:reload-open-search-results";
    Event["ReloadVault"] = "obsidian-tasks-plugin:reload-vault";
})(Event || (Event = {}));
class TasksEvents {
    constructor({ obsidianEvents }) {
        this.logger = logging_1.logging.getLogger('tasks.Events');
        this.obsidianEvents = obsidianEvents;
    }
    // ------------------------------------------------------------------------
    // CacheUpdate event
    onCacheUpdate(handler) {
        this.logger.debug('TasksEvents.onCacheUpdate()');
        const name = Event.CacheUpdate;
        // @ts-expect-error: error TS2345: Argument of type '(cacheData: CacheUpdateData) => void'
        // is not assignable to parameter of type '(...data: unknown[]) => unknown'.
        return this.obsidianEvents.on(name, handler);
    }
    triggerCacheUpdate(cacheData) {
        this.logger.debug('TasksEvents.triggerCacheUpdate()');
        this.obsidianEvents.trigger(Event.CacheUpdate, cacheData);
    }
    // ------------------------------------------------------------------------
    // RequestCacheUpdate event
    onRequestCacheUpdate(handler) {
        this.logger.debug('TasksEvents.onRequestCacheUpdate()');
        const name = Event.RequestCacheUpdate;
        // @ts-expect-error: error TS2345: Argument of type '(cacheData: CacheUpdateData) => void'
        // is not assignable to parameter of type '(...data: unknown[]) => unknown'.
        return this.obsidianEvents.on(name, handler);
    }
    triggerRequestCacheUpdate(fn) {
        this.logger.debug('TasksEvents.triggerRequestCacheUpdate()');
        this.obsidianEvents.trigger(Event.RequestCacheUpdate, fn);
    }
    // ------------------------------------------------------------------------
    // ReloadOpenSearchResults event
    onReloadOpenSearchResults(handler) {
        this.logger.debug('TasksEvents.onReloadOpenSearchResults()');
        const name = Event.ReloadOpenSearchResults;
        return this.obsidianEvents.on(name, handler);
    }
    triggerReloadOpenSearchResults() {
        this.logger.debug('TasksEvents.triggerReloadOpenSearchResults()');
        this.obsidianEvents.trigger(Event.ReloadOpenSearchResults);
    }
    // ------------------------------------------------------------------------
    // ReloadVault event
    onReloadVault(handler) {
        this.logger.debug('TasksEvents.onReloadVault()');
        const name = Event.ReloadVault;
        return this.obsidianEvents.on(name, handler);
    }
    triggerReloadVault() {
        this.logger.debug('TasksEvents.triggerReloadVault()');
        this.obsidianEvents.trigger(Event.ReloadVault);
    }
    off(eventRef) {
        this.logger.debug('TasksEvents.off()');
        this.obsidianEvents.offref(eventRef);
    }
}
exports.TasksEvents = TasksEvents;
//# sourceMappingURL=TasksEvents.js.map