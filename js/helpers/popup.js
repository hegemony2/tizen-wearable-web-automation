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

/*global define, document, tau, window*/

/**
 * Popup helper module.
 *
 * @module helpers/popup
 * @namespace helpers/popup
 * @memberof helpers
 */
define('helpers/popup', function popup() {
    'use strict';

    /**
     * Toast popup close timeout (in milliseconds).
     *
     * @private
     * @const {number}
     */
    var TOAST_CLOSE_TIMEOUT = 1000,

        /**
         * Reference to the text element of the toast.
         *
         * @private
         * @type {HTMLElement}
         */
        toastMessage = null,

        /**
         * Reference to the toast popup.
         *
         * @private
         * @type {HTMLElement}
         */
        messagePopup = null,

        /**
         * Reference to the input element of the input popup.
         *
         * @private
         * @type {HTMLElement}
         */
        inputElement = null,
        passwordElement = null,

        /**
         * Reference to the text element of the input popup.
         *
         * @private
         * @type {HTMLElement}
         */
        inputMessage = null,
        passwordMessage = null,

        /**
         * Reference to the apply button of the input popup.
         *
         * @private
         * @type {HTMLElement}
         */
        inputApplyButton = null,
        passwordApplyButton = null,

        /**
         * Reference to the input popup.
         *
         * @private
         * @type {HTMLElement}
         */
        inputPopup = null,
        passwordPopup = null,

        /**
         * Toast auto close flag.
         *
         * @private
         * @type {boolean}
         */
        autoClose = false,

        /**
         * Toast exit callback function.
         *
         * @private
         * @type {function}
         */
        exitCallback = null,

        /**
         * Reference to the confirm element.
         *
         * @private
         * @type {HTMLElement}
         */
        confirmPopup = null,

        /**
         * Reference to the text message element of the confirm popup.
         *
         * @private
         * @type {HTMLElement}
         */
        confirmMessage = null,

        /**
         * Reference to the confirm button of the confirm popup.
         *
         * @private
         * @type {HTMLElement}
         */
        confirmButton = null,

        /**
         * Confirm callback function.
         *
         * @private
         * @type {function}
         */
        confirmCallback = null;

    /**
     * Displays a toast with the specified text.
     *
     * @memberof helpers/popup
     * @public
     * @param {string} message
     * @param {object} params
     */
    function showToast(message, params) {
        toastMessage.innerText = message;
        if (params) {
            autoClose = params.autoClose;
            exitCallback = params.onExit;
        } else {
            autoClose = false;
            exitCallback = null;
        }
        tau.openPopup(messagePopup);
    }

    /**
     * Displays a toast with the specified text.
     *
     * @memberof helpers/popup
     * @public
     * @param {string} message
     * @param {function} onExit
     * @param {string} [defaultValue]
     */
    function showInput(message, onExit, defaultValue) {
        inputMessage.innerText = message;
        inputElement.value = defaultValue || '';
        exitCallback = onExit;
        tau.openPopup(inputPopup);
    }
    
    function showPasswordInput(message, onExit, defaultValue) {
        passwordMessage.innerText = message;
        passwordElement.value = defaultValue || '';
        exitCallback = onExit;
        tau.openPopup(passwordPopup);
    }

    /**
     * Handles popupshow event on the toast.
     *
     * @private
     */
    function onMessagePopupShow() {
        if (autoClose) {
            window.setTimeout(function onTimeout() {
                tau.closePopup(messagePopup);
            }, TOAST_CLOSE_TIMEOUT);
        }
    }

    /**
     * Handles popuphide event on the toast.
     *
     * @private
     */
    function onMessagePopupHide() {
        if (typeof exitCallback === 'function') {
            exitCallback();
        }
    }

    /**
     * Handles click event on the apply button from the input popup.
     *
     * @private
     */
    function onInputApplyClick() {
        if (typeof exitCallback === 'function') {
            exitCallback(inputElement.value);
        }
    }

    function onPasswordApplyClick() {
        if (typeof exitCallback === 'function') {
            exitCallback(passwordElement.value);
        }
    }
    
    /**
     * Displays the confirm popup with the specified message and executes the
     * specified callback if the yes button is clicked.
     *
     * @memberof helpers/popup
     * @public
     * @param {string} message
     * @param {function} onYesClick
     */
    function showConfirmPopup(message, onYesClick) {
        confirmMessage.innerText = message;
        confirmCallback = onYesClick;
        tau.openPopup(confirmPopup);
    }

    /**
     * Handles click event on the yes button from the confirm popup.
     *
     * @private
     */
    function onConfirmButtonClick() {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
    }

    /**
     * Registers event listeners on popups.
     *
     * @private
     */
    function bindEvents() {
        inputApplyButton.addEventListener('click', onInputApplyClick);
        passwordApplyButton.addEventListener('click', onPasswordApplyClick);
    }

    /**
     * Initializes the module.
     *
     * @memberof helpers/popup
     * @public
     */
    function init() {
        inputPopup = document.getElementById('input-popup');
        inputApplyButton = document.getElementById('input-apply-btn');
        inputMessage = inputPopup.querySelector('.message');
        inputElement = inputPopup.querySelector('input');   
        
        passwordPopup = document.getElementById('password-popup');
        passwordApplyButton = document.getElementById('password-apply-btn');
        passwordMessage = passwordPopup.querySelector('.message');
        passwordElement = passwordPopup.querySelector('input');
        
        
        bindEvents();
    }

    return {
        init: init,
        showToast: showToast,
        showInput: showInput,
        showPasswordInput: showPasswordInput,
        showConfirmPopup: showConfirmPopup
    };
});
