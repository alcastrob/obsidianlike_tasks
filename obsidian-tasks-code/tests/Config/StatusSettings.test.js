"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const StatusSettings_1 = require("../../src/Config/StatusSettings");
const Status_1 = require("../../src/Statuses/Status");
const StatusConfiguration_1 = require("../../src/Statuses/StatusConfiguration");
const StatusRegistry_1 = require("../../src/Statuses/StatusRegistry");
describe('StatusSettings', () => {
    it('verify default status settings', () => {
        const defaultStatusSettings = new StatusSettings_1.StatusSettings();
        // Core statuses
        expect(defaultStatusSettings.coreStatuses.length).toEqual(2);
        expect(defaultStatusSettings.coreStatuses[0].symbol).toEqual(' ');
        expect(defaultStatusSettings.coreStatuses[1].symbol).toEqual('x');
        // Custom statuses
        expect(defaultStatusSettings.customStatuses.length).toEqual(2);
        expect(defaultStatusSettings.customStatuses[0].symbol).toEqual('/');
        expect(defaultStatusSettings.customStatuses[1].symbol).toEqual('-');
        // This captures the default contents of both core and custom statuses
        (0, JestApprovals_1.verifyAsJson)(defaultStatusSettings);
    });
    function setThreeCustomStatuses(settings) {
        StatusSettings_1.StatusSettings.deleteAllCustomStatuses(settings);
        const pro = new StatusConfiguration_1.StatusConfiguration('P', 'Pro', 'C', false);
        const imp = new StatusConfiguration_1.StatusConfiguration('!', 'Important', 'x', false);
        const con = new StatusConfiguration_1.StatusConfiguration('C', 'Con', 'P', false);
        StatusSettings_1.StatusSettings.addStatus(settings.customStatuses, pro);
        StatusSettings_1.StatusSettings.addStatus(settings.customStatuses, imp);
        StatusSettings_1.StatusSettings.addStatus(settings.customStatuses, con);
        return { pro, imp, con };
    }
    it('should add a status', () => {
        // Arrange
        const settings = new StatusSettings_1.StatusSettings();
        expect(settings.coreStatuses.length).toEqual(2);
        expect(settings.customStatuses.length).toEqual(2);
        // Act
        const newStatus = new StatusConfiguration_1.StatusConfiguration('!', 'Important', 'x', false);
        StatusSettings_1.StatusSettings.addStatus(settings.customStatuses, newStatus);
        // Assert
        expect(settings.customStatuses.length).toEqual(3);
        expect(settings.customStatuses[2]).toStrictEqual(newStatus);
    });
    it('should replace a status, if present', () => {
        // Arrange
        const settings = new StatusSettings_1.StatusSettings();
        const { imp } = setThreeCustomStatuses(settings);
        expect(settings.customStatuses.length).toEqual(3);
        expect(settings.customStatuses[1]).toStrictEqual(imp);
        // Act
        const newImp = new StatusConfiguration_1.StatusConfiguration('!', 'ReallyImportant', 'X', true);
        StatusSettings_1.StatusSettings.replaceStatus(settings.customStatuses, imp, newImp);
        // Assert
        expect(settings.customStatuses.length).toEqual(3);
        expect(settings.customStatuses[1]).toStrictEqual(newImp);
    });
    it('should bulk-add new statuses, reporting errors', () => {
        // Arrange
        const newStatuses = [
            ['>', 'Forwarded', 'x', 'TODO'],
            ['<', 'Schedule', 'x', 'TODO'],
            ['?', 'Question', 'x', 'TODO'],
            ['-', 'Dropped - should not be added as duplicate of core Cancelled', 'x', 'CANCELLED'],
            ['>', 'Forwarded', 'x', 'TODO'], // is a duplicate so should not be added
            ['<', 'Duplicate - should not be added as duplicate of Schedule above', 'x', 'TODO'],
            ['', 'Empty - should not be added as no status character', 'x', 'TODO'],
        ];
        const settings = new StatusSettings_1.StatusSettings();
        // Act
        const result = StatusSettings_1.StatusSettings.bulkAddStatusCollection(settings, newStatuses);
        // Assert
        expect(result).toStrictEqual(['The status Forwarded (>) is already added.']);
    });
    it('should delete a status', () => {
        // Arrange
        const settings = new StatusSettings_1.StatusSettings();
        const { pro, imp, con } = setThreeCustomStatuses(settings);
        expect(settings.customStatuses.length).toEqual(3);
        // Act
        const result = StatusSettings_1.StatusSettings.deleteStatus(settings.customStatuses, imp);
        // Assert
        expect(result).toEqual(true);
        expect(settings.customStatuses.length).toEqual(2);
        expect(settings.customStatuses[0]).toStrictEqual(pro);
        expect(settings.customStatuses[1]).toStrictEqual(con);
        // Delete a second time. It should now report that nothing was deleted.
        const result2 = StatusSettings_1.StatusSettings.deleteStatus(settings.customStatuses, imp);
        expect(result2).toEqual(false);
    });
    it('should delete all custom statuses', () => {
        // Arrange
        const settings = new StatusSettings_1.StatusSettings();
        setThreeCustomStatuses(settings);
        expect(settings.customStatuses.length).toEqual(3);
        // Act
        StatusSettings_1.StatusSettings.deleteAllCustomStatuses(settings);
        // Assert
        expect(settings.customStatuses.length).toEqual(0);
    });
    it('should reset all custom statuses', () => {
        // Arrange
        const settings = new StatusSettings_1.StatusSettings();
        // Stomp on the current custom settings.
        settings.customStatuses.forEach((s) => {
            StatusSettings_1.StatusSettings.replaceStatus(settings.customStatuses, s, new StatusConfiguration_1.StatusConfiguration(s.symbol, 'NONSENSE NAME', 'x', false, StatusConfiguration_1.StatusType.DONE));
        });
        // Add some additional custom settings.
        StatusSettings_1.StatusSettings.addStatus(settings.customStatuses, new StatusConfiguration_1.StatusConfiguration('%', 'ANYTHING', '_', true, StatusConfiguration_1.StatusType.NON_TASK));
        // Act
        StatusSettings_1.StatusSettings.resetAllCustomStatuses(settings);
        // Assert
        expect(settings.customStatuses.length).toEqual(2);
        expect(settings.customStatuses[0]).toMatchInlineSnapshot(`
            StatusConfiguration {
              "availableAsCommand": true,
              "name": "In Progress",
              "nextStatusSymbol": "x",
              "symbol": "/",
              "type": "IN_PROGRESS",
            }
        `);
        expect(settings.customStatuses[1]).toMatchInlineSnapshot(`
            StatusConfiguration {
              "availableAsCommand": true,
              "name": "Cancelled",
              "nextStatusSymbol": " ",
              "symbol": "-",
              "type": "CANCELLED",
            }
        `);
    });
    it('should return a combined list of all statuses', () => {
        // Arrange
        const settings = new StatusSettings_1.StatusSettings();
        // Act
        const allStatuses = StatusSettings_1.StatusSettings.allStatuses(settings);
        // Assert
        const allSymbolsInOrder = allStatuses.map((status) => status.symbol).join('|');
        expect(allSymbolsInOrder).toEqual(' |x|/|-');
    });
    it('should apply settings to a StatusRegistry', () => {
        // Arrange
        const settings = new StatusSettings_1.StatusSettings();
        const { pro, imp, con } = setThreeCustomStatuses(settings);
        expect(settings.coreStatuses.length).toEqual(2);
        expect(settings.customStatuses.length).toEqual(3);
        const statusRegistry = new StatusRegistry_1.StatusRegistry();
        expect(statusRegistry.registeredStatuses.length).toEqual(4);
        // Act
        StatusSettings_1.StatusSettings.applyToStatusRegistry(settings, statusRegistry);
        // Assert
        const statuses = statusRegistry.registeredStatuses;
        expect(statuses.length).toEqual(5);
        expect(statuses[2]).toStrictEqual(new Status_1.Status(pro));
        expect(statuses[3]).toStrictEqual(new Status_1.Status(imp));
        expect(statuses[4]).toStrictEqual(new Status_1.Status(con));
    });
});
//# sourceMappingURL=StatusSettings.test.js.map