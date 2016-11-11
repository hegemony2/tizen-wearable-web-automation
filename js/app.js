/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global define, window, tau*/

/**
 * App module.
 *
 * @module app
 * @requires {@link core/event}
 * @requires {@link core/systeminfo}
 * @requires {@link core/application}
 * @requires {@link views/main}
 * @requires {@link views/files}
 * @requires {@link views/file-info}
 * @requires {@link views/breadcrumb}
 * @namespace app
 */
define('app', [
    'core/event',
    'core/systeminfo',
    'core/application',
    'views/main'
], function viewsPageInit(require) {
    'use strict';

    /**
     * Core event module object.
     *
     * @private
     * @type {Module}
     */
    var e = require('core/event'),

        /**
         * Core application module object.
         *
         * @private
         * @type {Module}
         */
        app = require('core/application'),

        /**
         * Core systeminfo module object.
         *
         * @private
         * @type {Module}
         */
        sysInfo = require('core/systeminfo'),

        /**
         * Files view module.
         *
         * @private
         * @type {Module}
         */
        filesView = require('views/main');

    /**
     * Handles tizenhwkey event.
     *
     * @private
     * @param {Event} ev
     */
    function onHardwareKeysTap(ev) {
        var keyName = ev.keyName,
            pageId = tau.activePage.id;

        if (keyName === 'back') {
        	if (pageId === 'main') {
                app.exit();
            } else {
                tau.back();
            }
        }
    }

    /**
     * Handles core.systeminfo.battery.low event.
     *
     * @private
     */
    function onLowBattery() {
        app.exit();
    }

    /**
     * Registers event listeners.
     *
     * @private
     */
    function bindEvents() {
        window.addEventListener('tizenhwkey', onHardwareKeysTap);
//        sysInfo.listenBatteryLowState();
    }

    /**
     * Initializes module.
     *
     * @memberof app
     * @public
     */
    function init() {
        bindEvents();
//        sysInfo.checkBatteryLowState();
//        debugger;
    }

    e.on({
        'core.systeminfo.battery.low': onLowBattery
    });

    return {
        init: init
    };
});

