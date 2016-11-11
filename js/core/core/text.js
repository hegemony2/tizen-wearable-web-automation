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
 * Text module
 * @requires {@link core/window}
 * @namespace core/text
 */

define(
    'core/text',
    [
        'core/window'
    ],
    function coreText(window) {
        'use strict';

        // Methods from the prototype are used so that the module works also
        // on other types like numbers.
        var str = window.String.prototype,

            // List of entities for escaping.
            replaceMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#x27;',
                '`': '&#x60;'
            },
            replaceRegex = new RegExp(
                '[' + Object.keys(replaceMap).join('') + ']',
                'g'
            ),
            replaceFunction = function replace(char) {
                return replaceMap[char];
            };

        /**
         * Trims whitespace from text.
         * @memberof core/text
         * @param {string} txt Text to modify.
         * @return {string} Modified text.
         */
        function trim(txt) {
            return str.trim.call(txt);
        }

        /**
         * Makes text uppercase.
         * @memberof core/text
         * @param {string} txt Text to modify.
         * @return {string} Modified text.
         */
        function upper(txt) {
            return str.toUpperCase.call(txt);
        }

        /**
         * Makes text lowercase.
         * @memberof core/text
         * @param {string} txt Text to modify.
         * @return {string} Modified text.
         */
        function lower(txt) {
            return str.toLowerCase.call(txt);
        }

        /**
         * Escapes HTML entities.
         * @memberof core/text
         * @param {string} txt
         * @return {string}
         */
        function escape(txt) {
            return str.replace.call(txt, replaceRegex, replaceFunction);
        }

        /**
         * Replaces newline characters with <br/> tags.
         * @memberof core/text
         * @param {string} txt
         * @return {string}
         */
        function nl2br(txt) {
            return str.replace.call(txt, /\n/g, '<br/>');
        }

        /**
         * Capitalizes the first letter.
         * @param {string} txt
         * @return {string}
         */
        function capitalize(txt) {
            return str.toUpperCase.call(
                str.charAt.call(txt, 0)
            ) + str.substring.call(txt, 1);
        }

        return {
            trim: trim,
            upper: upper,
            lower: lower,
            escape: escape,
            nl2br: nl2br,
            capitalize: capitalize
        };
    }
);
