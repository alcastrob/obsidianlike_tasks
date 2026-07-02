"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresetsSettingsService = exports.RenameResult = void 0;
const RecordHelpers_1 = require("../../lib/RecordHelpers");
class RenameResult {
    constructor(originalName, isValid, errorMessage) {
        this.originalName = originalName;
        this.isValid = isValid;
        this.errorMessage = errorMessage;
    }
}
exports.RenameResult = RenameResult;
class PresetsSettingsService {
    /**
     * Validates multiple preset names against each other
     * @param renames Map of original keys to their current values in UI
     * @returns Object mapping each key to its validation result
     */
    validateRenames(renames) {
        const results = {};
        // Check each key against all others
        for (const [originalName, newName] of Object.entries(renames)) {
            const presetsWithOtherPendingRenames = {};
            for (const [otherOriginalName, otherNewName] of Object.entries(renames)) {
                // Skip the name being validated to avoid false duplicate matches.
                if (otherOriginalName !== originalName) {
                    presetsWithOtherPendingRenames[otherNewName] = '';
                }
            }
            // Pass empty string as keyBeingRenamed since we're not excluding any key from duplicate check
            results[originalName] = this.validateRename(presetsWithOtherPendingRenames, '', newName);
        }
        return results;
    }
    /**
     * Validates if a preset name is valid
     * @param presets The current presets map
     * @param keyBeingRenamed The key being renamed
     * @param newName The proposed name to validate
     * @returns An object with validation result and error message if any
     */
    validateRename(presets, keyBeingRenamed, newName) {
        // Check for empty name
        if (!newName || newName.trim() === '') {
            return new RenameResult(keyBeingRenamed, false, 'Preset name cannot be empty or all whitespace');
        }
        for (const existingKey of Object.keys(presets)) {
            // Skip the key being renamed
            if (existingKey === keyBeingRenamed) {
                continue;
            }
            if (existingKey.trim() === newName.trim()) {
                return new RenameResult(keyBeingRenamed, false, 'A preset with this name already exists');
            }
        }
        return new RenameResult(keyBeingRenamed, true, null);
    }
    /**
     * Adds a new preset to the map with a unique key
     * @param presets The current presets map (will not be modified)
     * @returns An object with the updated presets map and the new key
     */
    addPreset(presets) {
        const newKey = this.generateUniqueKey(presets);
        const newPresets = { ...presets };
        newPresets[newKey] = '';
        return {
            presets: newPresets,
            newKey,
        };
    }
    /**
     * Renames a key in the presets map, preserving order
     * @param presets The current presets map (will not be modified)
     * @param keyBeingRenamed The existing key that would be renamed
     * @param proposedNewName The new name being considered
     * @returns The updated presets map, or null if the operation failed (for example, duplicate key)
     */
    renamePreset(presets, keyBeingRenamed, proposedNewName) {
        // Validate inputs
        if (!proposedNewName || proposedNewName.trim() === '') {
            return null; // Empty keys are not allowed
        }
        proposedNewName = proposedNewName.trim();
        // Check if this would create a duplicate
        if (this.wouldCreateDuplicateKey(presets, keyBeingRenamed, proposedNewName)) {
            return null;
        }
        return (0, RecordHelpers_1.renameKeyInRecordPreservingOrder)(presets, keyBeingRenamed, proposedNewName);
    }
    /**
     * Deletes a preset from the map
     * @param presets The current presets map (will not be modified)
     * @param key The key to delete
     * @returns The updated presets map
     */
    deletePreset(presets, key) {
        const newPresets = { ...presets };
        delete newPresets[key];
        return newPresets;
    }
    /**
     * Updates the value of a preset
     * @param presets The current presets map (will not be modified)
     * @param key The key to update
     * @param value The new value
     * @returns The updated presets map
     */
    updatePresetValue(presets, key, value) {
        const newPresets = { ...presets };
        newPresets[key] = value;
        return newPresets;
    }
    /**
     * Checks if renaming a key would create a duplicate in the presets map
     * @param presets The presets map to check against
     * @param keyBeingRenamed The existing key that would be renamed
     * @param proposedNewName The new name being considered
     * @returns True if the proposed new name would conflict with an existing key
     */
    wouldCreateDuplicateKey(presets, keyBeingRenamed, proposedNewName) {
        // Normalize the proposedNewName once
        const normalizedNewName = proposedNewName.trim();
        // If it's the same key (after trimming), it's not a duplicate
        if (keyBeingRenamed.trim() === normalizedNewName) {
            return false;
        }
        // Check against all existing keys
        for (const existingKey of Object.keys(presets)) {
            // Skip the key being renamed (exact reference check)
            if (existingKey !== keyBeingRenamed && existingKey.trim() === normalizedNewName) {
                return true; // Found a duplicate
            }
        }
        return false;
    }
    /**
     * Generates a unique key for a new preset
     * @param presets The current presets map
     * @returns A unique key string
     */
    generateUniqueKey(presets) {
        const baseKey = 'new_key';
        let suffix = 1;
        while (Object.prototype.hasOwnProperty.call(presets, `${baseKey}_${suffix}`)) {
            suffix++;
        }
        return `${baseKey}_${suffix}`;
    }
    /**
     * Reorders a preset to a specific position in the map
     * @param presets The current presets map (will not be modified)
     * @param key The key to reorder
     * @param newIndex The target position (0-based index)
     * @returns The updated presets map, or null if the operation failed
     */
    reorderPreset(presets, key, newIndex) {
        const keys = Object.keys(presets);
        const currentIndex = keys.indexOf(key);
        // Validate inputs
        if (currentIndex === -1) {
            return null; // Key doesn't exist
        }
        if (newIndex < 0 || newIndex >= keys.length) {
            return null; // Invalid target position
        }
        if (currentIndex === newIndex) {
            // No change needed, but return a copy
            return { ...presets };
        }
        // Create new key order
        const newKeys = [...keys];
        // Remove the key from its current position
        newKeys.splice(currentIndex, 1);
        // Insert it at the new position
        newKeys.splice(newIndex, 0, key);
        // Rebuild the map in the new order
        const newPresets = {};
        for (const k of newKeys) {
            newPresets[k] = presets[k];
        }
        return newPresets;
    }
}
exports.PresetsSettingsService = PresetsSettingsService;
//# sourceMappingURL=PresetsSettingsService.js.map