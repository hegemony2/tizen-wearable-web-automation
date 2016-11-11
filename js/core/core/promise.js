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

/*global define, window*/

/**
 * Based on project:
 * https://github.com/then/promise
 * under MIT license.
 *
 * Promise module.
 *
 * @namespace core/promise
 * @requires {@link core/promise/tasksqueue}
 */

define(
    'core/promise',
    [
        'core/promise/tasksqueue',
        'core/window'
    ],
    function corePromise(TasksQueue, global) {
        'use strict';

        /**
         * Executes function handled by promise.
         *
         * Ensures that the onFulfilled and onRejected functions are executed
         * only once and that onRejected is executed even if the function throws
         * an exception.
         *
         * @param {function} promiseFn Function that is executed.
         * @param {function} onFulfilled Function that is executed by promiseFn
         * when promiseFn is fulfilled.
         * @param {function} onRejected Function that is executed by promiseFn
         * when promiseFn is rejected.
         */
        function doResolve(promiseFn, onFulfilled, onRejected) {
            var done = false;
            try {
                promiseFn(
                    function fulfill(value) {
                        if (done) {
                            return;
                        }
                        done = true;
                        onFulfilled(value);
                    },
                    function reject(reason) {
                        if (done) {
                            return;
                        }
                        done = true;
                        onRejected(reason);
                    }
                );
            } catch (ex) {
                if (done) {
                    return;
                }
                done = true;
                onRejected(ex);
            }
        }

        /**
         * Object that contains all functions that will be executed in order
         * to fulfill or reject a promise.
         *
         * @private
         * @param {function} onFulfilled Function that is executed after
         * promise fulfillment. It takes two arguments: function resolve and
         * function reject.
         * @param {function} onRejected Function that is executed after
         * promise rejection. It takes one argument: object that is a reason
         * of rejection.
         * @param {function} resolve Function that is the first argument for
         * onFulfilled function.
         * @param {function} reject Function that is the second argument for
         * onFulfilled function.
         * @constructor
         */
        function Deferred(onFulfilled, onRejected, resolve, reject) {
            this.onFulfilled =
                typeof onFulfilled === 'function' ? onFulfilled : null;
            this.onRejected =
                typeof onRejected === 'function' ? onRejected : null;
            this.resolve = resolve;
            this.reject = reject;
        }

        /**
         * Promise constructor.
         * @memberof core/promise
         * @param {function} fn Function handled by the promise.
         * @constructor
         */
        function Promise(fn) {
            // There is checking if 'this' equals 'window' because the unit
            // tests are executed on PhantomJS and on PhantomJS this === window
            // inside a function when the function is called without the 'new'
            // operator
            if (typeof this !== 'object' ||
                (typeof window !== 'undefined' && this === window)) {
                throw new global.TypeError(
                    'Promises must be constructed via new'
                );
            }
            if (typeof fn !== 'function') {
                throw new global.TypeError('not a function');
            }

            /**
             * If is 'true', the promise is fulfilled. If is 'false', the
             * promise is rejected. If is 'null', the promise is still deferred.
             * @type {boolean}
             */
            var isFulfilled = null,

                /**
                 * Value of fulfilled promise.
                 * @type {*}
                 */
                value = null,

                /**
                 * Array of Deferred elements, that hold functions of promises.
                 * These promises make a chain - after fulfillment of one of
                 * them the next one is being fulfilled and so on.
                 * Deferred elements will be handled after fulfillment/rejection
                 * of 'this' promise.
                 * @type {Deferred[]}
                 */
                deferreds = [],

                /**
                 * Tasks queue.
                 * @type {object}
                 */
                tasksQueue = new TasksQueue(),

                /**
                 * This.
                 * @type {Promise}
                 */
                self = this;

            /**
             * Function called when the promise function is fulfilled.
             * @param {*} [newValue] Result of execution of function handled by
             * the promise.
             */
            function resolve(newValue) {
                if (newValue === self) {
                    reject(new global.TypeError(
                        'A promise cannot be resolved with itself'
                    ));
                    return;
                }
                if (newValue && typeof newValue.then === 'function') {
                    doResolve(function then(a, b) {
                        newValue.then(a, b);
                    }, resolve, reject);
                    return;
                }
                isFulfilled = true;
                value = newValue;
                finish();
            }

            /**
             * Executes a promise represented by the specified Deferred object
             * or saves it for later execution if 'this' promise is not
             * fulfilled or rejected yet.
             *
             * @param {Deferred} deferred
             */
            function handle(deferred) {
                if (isFulfilled === null) {
                    deferreds.push(deferred);
                    return;
                }
                tasksQueue.pushTaskAndExecuteAll(function task() {
                    var callback = isFulfilled ?
                            deferred.onFulfilled : deferred.onRejected,
                        result = null;
                    if (callback === null) {
                        callback = isFulfilled ?
                            deferred.resolve : deferred.reject;
                        callback(value);
                        return;
                    }
                    try {
                        result = callback(value);
                    }
                    catch (e) {
                        deferred.reject(e);
                        return;
                    }
                    deferred.resolve(result);
                });
            }

            /**
             * Called after fulfillment the promise. Handles all deferred
             * objects.
             */
            function finish() {
                var i = 0,
                    len = deferreds.length;

                for (i = 0; i < len; i += 1) {
                    handle(deferreds[i]);
                }

                deferreds = null;
            }

            /**
             * Function called when the promise function is rejected or threw
             * an exception.
             * @param {*} [newValue] Result of rejection of the function handled
             * by the promise.
             */
            function reject(newValue) {
                isFulfilled = false;
                value = newValue;
                finish();
            }

            /**
             * Allows to add functions that will be executed after execution of
             * the function handled by the promise.
             *
             * @memberof core/promise.Promise
             * @param {function} onFulfilled Function that will be executed when
             * the promise is fulfilled.
             * @param {function} [onRejected] Function that will be executed
             * when the promise is rejected.
             * @return {Promise} Promise that handles the specified functions.
             */
            this.then = function then(onFulfilled, onRejected) {
                return new Promise(function task(resolve, reject) {
                    handle(new Deferred(onFulfilled, onRejected, resolve,
                        reject));
                });
            };

            /**
             * Allows to add a function that will be executed after rejection of
             * the promise.
             *
             * @memberof core/promise.Promise
             * @param {function} onRejected Function that will be executed when
             * the promise is rejected.
             * @returns {Promise} Promise that handles the specified function.
             */
            this.catch = function Promise_catch(onRejected) {
                return this.then(null, onRejected);
            };

            doResolve(fn, resolve, reject);
        }

        return Promise;
    }
);
