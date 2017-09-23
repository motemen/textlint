// LICENSE : MIT
"use strict";
const interopRequire = require("interop-require");
const ObjectAssign = require("object-assign");
const debug = require("debug")("textlint:plugin-loader");
const assert = require("assert");
import TextLintModuleMapper from "../engine/textlint-module-mapper";

export function mapRulesConfig(rulesConfig, pluginName) {
    const mapped = {};
    if (rulesConfig === undefined || typeof rulesConfig !== "object") {
        return mapped;
    }
    return TextLintModuleMapper.createMappedObject(rulesConfig, pluginName);
}

/**
 * get plugin names from `configFileRaw` object
 * @param configFileRaw
 * @returns {Array}
 */
export function getPluginNames(configFileRaw) {
    const plugins = configFileRaw.plugins;
    if (!plugins) {
        return [];
    }
    if (Array.isArray(plugins)) {
        return plugins;
    }
    return Object.keys(plugins);
}

/**
 * get pluginConfig object from `configFileRaw` that is loaded .textlintrc
 * @param {Object} configFileRaw
 * @returns {Object}
 * @example
 * ```js
 * "plugins": {
 *   "pluginA": {},
 *   "pluginB": {}
 * }
 * ```
 *
 * to
 *
 * ```js
 * {
 *   "pluginA": {},
 *   "pluginB": {}
 * }
 * ```
 *
 *
 *
 * ```js
 * "plugins": ["pluginA", "pluginB"]
 * ```
 *
 * to
 *
 * ```
 * // `true` means turn on
 * {
 *   "pluginA": true,
 *   "pluginB": true
 * }
 * ```
 */
export function getPluginConfig(configFileRaw) {
    const plugins = configFileRaw.plugins;
    if (!plugins) {
        return {};
    }
    if (Array.isArray(plugins)) {
        if (plugins.length === 0) {
            return {};
        }
        // { "pluginA": true, "pluginB": true }
        return plugins.reduce((results, pluginName) => {
            results[pluginName] = true;
            return results;
        }, {});
    }
    return plugins;
}

// load rulesConfig from plugins
/**
 *
 * @param pluginNames
 * @param {TextLintModuleResolver} moduleResolver
 * @returns {{}}
 */
export function loadRulesConfig(pluginNames = [], moduleResolver) {
    const pluginRulesConfig = {};
    pluginNames.forEach(pluginName => {
        const pkgPath = moduleResolver.resolvePluginPackageName(pluginName);
        const plugin = interopRequire(pkgPath);
        if (!plugin.hasOwnProperty("rulesConfig")) {
            return;
        }
        debug(`${pluginName} has rulesConfig`);
        // set config of <rule> to "<plugin>/<rule>"
        ObjectAssign(pluginRulesConfig, mapRulesConfig(plugin.rulesConfig, pluginName));
    });
    return pluginRulesConfig;
}

export function loadAvailableExtensions(pluginNames = [], moduleResolver) {
    const availableExtensions = [];
    pluginNames.forEach(pluginName => {
        const pkgPath = moduleResolver.resolvePluginPackageName(pluginName);
        const plugin = interopRequire(pkgPath);
        if (!plugin.hasOwnProperty("Processor")) {
            return;
        }
        const Processor = plugin.Processor;
        debug(`${pluginName} has Processor`);
        assert(
            typeof Processor.availableExtensions === "function",
            "Processor.availableExtensions() should be implemented"
        );
        availableExtensions.push(...Processor.availableExtensions());
    });
    return availableExtensions;
}
