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

/*jslint regexp: true, evil: true, unparam: true, ass: true, nomen: true*/
/*jshint unused: true*/
/*global define*/

/**
 * Template manager module.
 * @requires {@link core/event}
 * @requires {@link core/http}
 * @requires {@link core/window}
 * @namespace core/template
 */

define(
    'core/template',
    [
        'core/event',
        'core/text',
        'core/http',
        'core/window'
    ],
    function template(e, text, http, window) {
        'use strict';

        /**
         * Compiled template cache
         */
        var templateDir = 'templates',
            templateExtension = '.tpl',
            cache = {},
            document = window.document,
            console = window.console,
            loopVariablesRegex = null,
            loopIterationRegex = /\{\{i\}\}/g,
            whitespaceRegex = /[\r\t\n]/g,
            loopTemplateRegex = /\{\{#([\w]*)\}\}(.*)\{\{\/(\1)\}\}/ig,
            conditionTemplateRegex = null,
            variablesRegex = null;

        /**
         * Regular expression matching template variable in loop
         * (with optional modifier).
         *
         * \{\{ - opening braces
         * this(\..+?)? - 'this' key and optional any sequence of chars
         * (\|(.+?))? - any sequence of chars prefixed with '|' (modifier)
         * \}\} - closing braces
         *
         * /ig -global, case-insensitive
         *
         */
        loopVariablesRegex = /\{\{this(\..+?)?(\|(.+?))?\}\}/g;

        /**
         * Regular expression matching template variable
         * (with optional modifier).
         *
         * \{\{ - opening braces
         * (.+?)- any sequence of chars in the condition
         * (\|(.+?))? - any sequence of chars prefixed with '|' (modifier)
         * \}\} - closing braces
         *
         * /ig -global, case-insensitive
         *
         */
        variablesRegex = /\{\{(.+?)(\|(.+?))?\}\}/g;

        /**
         * Regular expression matching template conditions.
         *
         * \{\{ - opening braces
         * \? - mandatory question mark at the start
         * (typeof\s|[^a-zA-Z0-9]*) - special stuff e.g. !, typeof
         * (.+?) - any sequence of chars in the condition
         * \}\} - closing braces
         * (.*?) - body
         * \{\{ - opening braces
         * \/ - backslash
         * (\1)(\2) - the same sequence as found before
         * \}\} - closing braces
         *
         * /ig - global, case-insensitive
         *
         */
        conditionTemplateRegex =
            /\{\{\?(typeof\s|[^a-zA-Z0-9]*)(.+?)\}\}(.*?)\{\{\/(\1)(\2)\}\}/ig;


        /**
         * Generates code for template variable in loop.
         * @param {string} match The matched substring.
         * @param {string} $1 First submatch (property).
         * @param {string} $2 Second submatch (modifier prop).
         * @param {string} $3 Third submatch (modifier name).
         * @return {string}
         */
        function templateLoopVariable(match, $1, $2, $3) {
            var prop = ($1 !== undefined) ? $1 : '',
                ret = '\'+d[i]' + prop + '+\'';

            // Check if the modifier is a function
            if ($3 !== undefined) {
                if (typeof text[$3] === 'function') {
                    ret = '\'+this.' + $3 + '(d[i]' + prop + ')+\'';
                } else {
                    console.error(
                        'Modifier \'' + $3 + '\' is not implemented'
                    );
                }
            }

            return ret;
        }

        /**
         * Generates code for template loops.
         * @param {string} match The matched substring.
         * @param {string} $1 First submatch (array variable).
         * @param {string} $2 Second submatch (body).
         * @return {string}
         */
        function templateLoop(match, $1, $2) {
            return '\';var i=0,l=data.' + $1 +
                '.length,d=data.' + $1 + ';for(;i<l;i++){s+=\'' +
                $2
                .replace(loopVariablesRegex, templateLoopVariable)
                .replace(loopIterationRegex, '\'+i+\'') +
                '\'}s+=\'';
        }

        /**
         * Generates code for template conditions.
         * @param {string} match The matched substring.
         * @param {string} $1 First submatch (typeof, negation).
         * @param {string} $2 Second submatch (condition).
         * @param {string} $3 Third submatch (body).
         * @return {string}
         */
        function templateCondition(match, $1, $2, $3) {
            var pref = 'data.';

            // Check property condition
            if ($2.match(/this(\.)/g)) {
                pref = 'd[i].';
                $2 = $2.replace(/this(\.)/g, '');
            }

            return '\';if(' + $1 + pref + $2 + '){s+=\'' + $3 + '\'}s+=\'';
        }

        /**
         * Generates code for template variable.
         * @param {string} match The matched substring.
         * @param {string} $1 First submatch (property).
         * @param {string} $2 Second submatch (modifier prop).
         * @param {string} $3 Third submatch (modifier name).
         * @return {string}
         */
        function templateVariable(match, $1, $2, $3) {
            var ret = '\'+data.' + $1 + '+\'';

            // Check if the modifier is a function
            if ($3 !== undefined) {
                if (typeof text[$3] === 'function') {
                    ret = '\' + this.' + $3 + '(data.' + $1 + ') +\'';
                } else {
                    console.error('Modifier \'' + $3 + '\' is not implemented');
                }
            }

            return ret;
        }

        /**
         * Saves compiled template to cache.
         * @param {string} tplName Template name.
         * @param {function} tplData Template data.
         */
        function save(tplName, tplData) {
            cache[tplName] = tplData;
        }

        /**
         * Compiles a template.
         * @param {string} tplName Template name.
         * @param {string} template Template.
         * @return {function} Compiled template.
         * @throws {Error} Error in template syntax.
         */
        function compile(tplName, template) {
            var content = cache[tplName];

            if (!content) {
                // initialize empty string
                content = 'try { var s=\'\';s+=\'' +
                    // replace all weird whitespace with spaces
                    template.replace(whitespaceRegex, ' ')
                    .split('\'').join('\\\'') // escape quotes
                    .replace(
                        /**
                         * Handle loops.
                         *
                         * In the loop, 'i' is the key and 'this' is the value
                         *
                         * Example:
                         *     {{#arr}}<li>key:{{i}} value:{{this}}</li>{{/arr}}
                         */
                        loopTemplateRegex,
                        templateLoop
                    )
                    .replace(
                        /**
                         * Handle conditions.
                         *
                         * Example:
                         *     {{?logged}}Logged{{/logged}}
                         * becomes:
                         *     if(data.logged){s+='Logged'}
                         *
                         * Some of other possible conditions:
                         *     {{?!variable}}test{{/!variable}}
                         *     {{?typeof variable !== "undefined"}}
                         *         test
                         *     {{/typeof variable !== "undefined"}}
                         *     {{?variable === "value"}}
                         *         test
                         *     {{/variable === "value"}}
                         */
                        conditionTemplateRegex,
                        templateCondition
                    )
                       /**
                        * Handle other references by adding 'data.'.
                        *
                        * Example:
                        *     {{user.name}}
                        * becomes:
                        *     s+=data.user.name
                        *
                        * \{\{ - opening braces
                        * (.+?)- any sequence of chars in the condition
                        * (\|(.+?))? - any sequence of chars prefixed with '|'
                        * \}\} - closing braces
                        *
                        * /g -global
                        *
                        */
                    .replace(variablesRegex, templateVariable) +
                        '\';return s;' + // return the string
                        '} catch (e) {' +
                        '    throw Error(\'Error in template ' + tplName +
                        ': \' + e.message); }';

                content = new Function('data', content);
                save(tplName, content);
            }

            return content;
        }

        /**
         * Loads a template using AJAX.
         * @param {string} tplName Template name.
         * @param {object} [options] Options.
         * @param {boolean} [options.async=false] Async mode.
         * @param {function} [onSuccess] Success callback.
         * @return {function|undefined}
         */
        function loadOne(tplName, options, onSuccess) {
            var tplPath = [
                    templateDir,
                    [tplName, templateExtension].join('')
                ].join('/'),
                tplCompiled = null,
                async = null,
                onReqSuccess = null;

            options = options || {};
            async = typeof options.async === 'boolean' ? options.async : false;

            onReqSuccess = function onReqSuccess(data) {
                tplCompiled = compile(tplName, data);
                if (async === false) {
                    if (typeof onSuccess === 'function') {
                        onSuccess();
                    }
                }
            };

            http.request({
                url: tplPath,
                async: async,
                success: onReqSuccess,
                error: function error(textStatus) {
                    console.error(tplPath + ' loading error: ' + textStatus);
                }
            });

            if (async === false) {
                return tplCompiled;
            }
            return undefined;
        }

        /**
         * Loads templates.
         * @memberof core/template
         * @param {string[]} tplNames Template names.
         * @param {object} [options] Options.
         * @param {boolean} [options.async=false] Async mode.
         */
        function load(tplNames, options) {
            var cachedTemplates = 0,
                i = 0,
                onSuccess = function onSuccess() {
                    cachedTemplates += 1;
                    // if all templates are cached fire event
                    if (cachedTemplates >= tplNames.length) {
                        e.fire('loaded');
                    }
                };

            options = options || {};
            options.async = typeof options.async === 'boolean' ?
                    options.async : false;

            if (Array.isArray(tplNames)) {
                for (i = 0; i < tplNames.length; i += 1) {
                    loadOne(tplNames[i], options, onSuccess);
                }
            }
        }

        /**
         * Returns template completed by specified parameters.
         * @param {function} tplCompiled Compiled template.
         * @param {array|object} [tplParams] Template parameters.
         * @return {string} Completed template.
         */
        function getCompleted(tplCompiled, tplParams) {
            /*jshint validthis:true*/
            return tplCompiled.call(text, tplParams);
        }

        /**
         * Returns template in HTML format.
         * @memberof core/template
         *
         * @example
         * // Variable
         * // test.tpl content: {{foo}}
         * get('test', {foo: '123'}) // returns '123'
         *
         * @example
         * // Variable with modifier
         * // test.tpl content: {{foo|upper}}
         * get('test', {foo: 'test'}) // returns 'TEST'
         * @see {@link core/text} See available modifiers.
         *
         * @example
         * // Variables
         * // test.tpl content: {{foo}} {{bar}}
         * get('test', {foo: '123', bar: 456}) // returns '123 456'
         *
         * @example
         * // Object property
         * // test.tpl content: {{obj.prop}}
         * get('test', {obj: {prop: 'test'}}) // returns 'test'
         *
         * @example
         * // Array element
         * // test.tpl content: {{arr[0]}}
         * get('test', {arr: ['test']}) // returns 'test'
         *
         * @example
         * // Array loop
         * // test.tpl content: {{#arr}}{{i}}-{{this}} {{/arr}}
         * get('test', {arr: ['test', 'test2']}) // returns '0-test 1-test2 '
         *
         * @example
         * // Array loop with prop
         * // test.tpl content: {{#arr}}{{this.prop}} {{/arr}}
         * get('test', {arr: [{'prop': 'test'}, {'prop': 'test2'}]})
         * // returns 'test test2 '
         *
         * @example
         * // Array loop with prop condition
         * // test.tpl content: {{#arr}}{{?this.prop}}test{{/this.prop}}{{/arr}}
         * get('test', {arr: [{'prop': true}, {'prop': false}]})
         * // returns 'test'
         *
         * @example
         * // Condition true
         * // test.tpl content: {{?variable}}test{{/variable}}
         * get('test', {variable: true}) // returns 'test'
         *
         * @example
         * // Condition false
         * // test.tpl content: {{?!variable}}test{{/!variable}}
         * get('test', {variable: false}) // returns 'test'
         *
         * @example
         * // Condition typeof
         * // test.tpl content:
         * // {{?typeof variable !== "undefined"}}
         * //     test
         * // {{/typeof variable !== "undefined"}}
         * get('test', {variable: 'value'}) // returns 'test'
         *
         * @example
         * // Condition variable
         * // test.tpl content:
         * // {{?variable === "value"}}test{{/variable === "value"}}
         * get('test', {variable: 'value'}) // returns 'test'
         *
         * @param {string} tplName Template name.
         * @param {string} [tplParams] Template parameters.
         * @return {string} Completed template.
         */
        function get(tplName, tplParams) {
            var tplCompiled = cache[tplName] || loadOne(tplName);
            return getCompleted(tplCompiled, tplParams);
        }

        /**
         * Returns first HTML element from completed template.
         * @memberof core/template
         * @param {string} tplName Template name.
         * @param {string} [tplParams] Template parameters.
         * @return {HTMLElement} First element from the completed template.
         */
        function getElement(tplName, tplParams) {
            var html = get(tplName, tplParams),
                tempElement = document.createElement('div');

            tempElement.innerHTML = html;
            return tempElement.firstChild;
        }

        /**
         * Returns completed template as DocumentFragment.
         * @memberof core/template
         * @param {string} tplName Template name.
         * @param {string} [tplParams] Template parameters.
         * @return {DocumentFragment} First element from the completed template.
         */
        function getAsFragment(tplName, tplParams) {
            var html = get(tplName, tplParams),
                tempElement = document.createElement('div'),
                fragment = document.createDocumentFragment();

            tempElement.innerHTML = html;

            while (tempElement.firstChild) {
                fragment.appendChild(tempElement.firstChild);
            }
            return fragment;
        }

        /**
         * Returns the compiled template.
         * @memberof core/template
         * @param {string} tplName Template name.
         * @return {function} Compiled template.
         */
        function getCompiled(tplName) {
            return cache[tplName] || loadOne(tplName);
        }

        return {
            load: load,
            getCompiled: getCompiled,
            getElement: getElement,
            getAsFragment: getAsFragment,
            get: get
        };
    }
);
