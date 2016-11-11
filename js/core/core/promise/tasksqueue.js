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
 * Tasks queue helper module for core/promise module.
 *
 * The module allows to create a queue of functions that will be executed in
 * background.
 * Background execution is implemented based on MessageChannel or postMessage
 * if MessageChannel is not available on the platform.
 *
 * @namespace core/promise/tasksqueue
 */

define(
    'core/promise/tasksqueue',
    ['core/window'],
    function corePromiseTasksQueue(window) {
        'use strict';

        /**
         * Number of last created instance of tasks queue.
         * @memberof core/promise/tasksqueue
         * @type {number}
         */
        var instanceNo = 0;

        /**
         * Represents a queue of tasks and executes them in background, one
         * after another.
         * @memberof core/promise/tasksqueue
         * @constructor
         * @return {object}
         */
        function TasksQueue() {

            /**
             * The queue of tasks.
             * @type {function[]}
             */
            var queue = [],

                /**
                 * Indicates whether the list is flushing or not.
                 * @type {boolean}
                 */
                isExecuting = false,

                /**
                 * Indicates whether MessageChannel is available on the platform
                 * or not.
                 * @type {boolean}
                 */
                isMessageChannel = !!window.MessageChannel,

                /**
                 * MessageChannel object using for executing asynchronous tasks.
                 * Message Channel is used instead of setTimeout due to
                 * better performance.
                 * @type {MessageChannel}
                 */
                channel = isMessageChannel ? new window.MessageChannel() : null,

                /**
                 * Message key sent by postMessage.
                 * @type {string}
                 */
                postMessageKey = '$promiseMessage$' + (instanceNo += 1),

                /**
                 * Function that sends a request to execute all tasks.
                 * @type {function}
                 */
                requestExecuteAll = null;

            /**
             * Executes all tasks from the queue.
             */
            function executeAll() {
                var task = null;

                while (queue.length) {
                    task = queue.shift();
                    try {
                        task();
                    } catch (e) {
                        window.console.error(
                            'Core_tasksqueue error: ' + e.message
                        );
                    }
                }

                isExecuting = false;
            }

            /**
             * Sends request by MessageChannel to execute all tasks.
             */
            function sendRequestMC() {
                channel.port2.postMessage(0);
            }

            /**
             * Sends request by postMessage to execute all tasks.
             */
            function sendRequestPM() {
                window.postMessage(postMessageKey, '*');
            }

            /**
             * Handles requests from postMessage.
             * @param {Event} ev
             */
            function receiveRequestPM(ev) {
                if (ev.source !== window || ev.data !== postMessageKey) {
                    return;
                }
                executeAll();
            }

            /**
             * Adds specified task to the end of the queue and executes all
             * tasks.
             * @param {function} task
             * @memberof core/promise/tasksqueue.TasksQueue
             */
            this.pushTaskAndExecuteAll = function pushTaskAndExecuteAll(task) {
                queue.push(task);

                if (!isExecuting) {
                    isExecuting = true;
                    requestExecuteAll();
                }
            };

            if (isMessageChannel) {
                channel.port1.onmessage = executeAll;
                requestExecuteAll = sendRequestMC;
            } else {
                window.addEventListener('message', receiveRequestPM, false);
                requestExecuteAll = sendRequestPM;
            }
        }

        return TasksQueue;
    }
);
