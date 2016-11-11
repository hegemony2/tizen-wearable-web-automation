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

/*global define*/

/**
 * HTTP module
 * @requires {@link core/window}
 * @namespace core/http
 */

define(
    'core/http',
    [
        'core/window'
    ],
    function coreHttp(window) {
        'use strict';

        /**
         * Creates and send request
         * @memberof core/http
         * @param {object} options Options.
         * @param {string} options.url Url.
         * @param {boolean} [options.async=false] Async mode.
         * @param {function} [options.success] Success callback.
         * @param {function} [options.progress] Progress callback.
         * @param {function} [options.error] Error callback.
         * @return {XMLHttpRequest} req Request object.
         */
        function request(options) {
            var req = null,
                async = null,
                url = null;

            options = options || {};
            async = typeof options.async === 'boolean' ? options.async : false;
            url = options.url !== undefined ? options.url : null;

            if (url === null) {
                throw new Error('The url is empty');
            }

            req = new window.XMLHttpRequest();
            req.open('GET', url, async);


            req.addEventListener('load', function load() {
                if (typeof options.success === 'function') {
                    options.success(req.response);
                }
            }, false);

            req.addEventListener('error', function error(evt) {
                if (typeof options.error === 'function') {
                    options.error(evt.target.status);
                }
            }, false);

            req.addEventListener('progress', function progress(evt) {
                if (typeof options.progress === 'function') {
                    options.progress(evt);
                }
            }, false);

            req.send();

            return req;
        }

        return {
            request: request
        };
    }
);
