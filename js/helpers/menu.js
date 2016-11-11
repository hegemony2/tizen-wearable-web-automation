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

/*global define, tau, document, window*/

/**
 * Menu helper module.
 *
 * @module helpers/menu
 * @namespace helpers/menu
 * @memberof helpers
 */
define('helpers/menu', function menu() {
    'use strict';

    /**
     * Show hidden files label text.
     *
     * @private
     * @const {string}
     */
    var SHOW_HIDDEN_FILES_TEXT = 'Show hidden files',

        /**
         * Hide hidden files label text.
         *
         * @private
         * @const {string}
         */
        HIDE_HIDDEN_FILES_TEXT = 'Don\'t show hidden files',

        /**
         * Id of the hide/show hidden files menu item.
         *
         * @private
         * @const {number}
         */
        HIDDEN_FILE_ITEM_ID = 7,

        /**
         * Click listeners of the menu items for the circular screen.
         * Key: class name of the menu item.
         * Value: click callback function.
         *
         * @private
         * @type {object}
         */
        menuListeners = {},

        /**
         * Reference to the selector indicator element for the circular menu.
         *
         * @private
         * @type {HTMLElement}
         */
        selectorIndicator = null,

        /**
         * Reference to the hidden files menu item.
         *
         * @private
         * @type {HTMLElement}
         */
        hiddenFilesItem = null,

        /**
         * Id of the current menu item.
         *
         * @private
         * @type {number}
         */
        currentItemId = 0;

    /**
     * Sets current item id.
     *
     * @private
     * @param {Event} ev
     */
    function setCurrentItemId(ev) {
        currentItemId = ev.detail.index;
    }

    /**
     * Initializes menu element for devices with circular screen.
     *
     * @private
     * @param {HTMLElement} page Page containing the menu.
     * @param {HTMLElement} popup Popup displaying the menu.
     */
    function initializeForCircularScreen(page, popup) {
        var selectorWidget = null;
        var selectorEl = popup.querySelector('.ui-selector');
        var menuItems = popup.querySelectorAll('.ui-item');
        var popupHideCallback = null;

        page.addEventListener('pagebeforeshow', function onPageBeforeShow() {
            selectorWidget = tau.widget.Selector(selectorEl, {
                itemRadius: window.innerHeight / 2 * 0.8
            });

            selectorWidget.changeItem(currentItemId);
        });

        page.addEventListener('pagebeforehide', function onPageBeforeHide() {
            selectorWidget.destroy();
        });

        popup.addEventListener('popupshow', function onPopupShow() {
        	
            selectorWidget = tau.widget.Selector(selectorEl, {
                itemRadius: window.innerHeight / 2 * 0.8
            });

            selectorWidget.on('selectoritemchange', setCurrentItemId);
        });

        popup.addEventListener('popuphide', function onPopupHide() {
            if (typeof popupHideCallback === 'function') {
                popupHideCallback();
                popupHideCallback = null;
            }
            selectorWidget.off('selectoritemchange', setCurrentItemId);
        });

//        page.addEventListener('pageshow', onPageShow);
        
    	selectorIndicator = popup.querySelector('.ui-selector-indicator');
        selectorIndicator.addEventListener('click', function onClick() {
            var selectedItemId = parseInt(selectorIndicator.dataset.index, 10);
            var selectedItemClassList = menuItems[selectedItemId].classList;
            var i = 0;
            var length = selectedItemClassList.length;
            var listener = null;

            for (i = 0; i < length; i += 1) {
                listener = menuListeners[selectedItemClassList[i]];
                if (typeof listener === 'function') {
                    if (!selectedItemClassList.contains('hidden')) {
                        popupHideCallback = listener;
                        tau.closePopup(popup);
                    }
                    return;
                }
            }
        });        
    }

    /**
     * Initializes the menu on the specified page.
     *
     * @memberof helpers/menu
     * @public
     * @param {HTMLElement} page The page containing the menu.
     * @param {string} menuHandlerId ID of the button Button
     * that opens the menu popup after click.
     */
    function initializeMenu(page, menuHandlerId) {
        var handlerButton = document.getElementById(menuHandlerId);
        var popup = document.querySelector('.menu.' + (tau.support.shape.circle ? 'circle' : 'square'));

        handlerButton.addEventListener('click', function onClick() {
            tau.openPopup(popup);
        });

        if (tau.support.shape.circle) {
            initializeForCircularScreen(page, popup);
        }
    }

    /**
     * Binds the specified callback with the menu list item containing the
     * specified class.
     *
     * @memberof helpers/menu
     * @public
     * @param {string} className
     * @param {function} listener
     */
    function bindMenuClickEventListener(className, listener) {
        if (tau.support.shape.circle) {
//            menuListeners[className] = listener;
            document.querySelector('#files-menu-circle .' + className).addEventListener('click', listener);
        } else {
            document.querySelector('#files-menu-square .' + className).addEventListener('click', listener);
        }
    }

    /**
     * Sets visibility of a menu item containing the specified class name.
     *
     * @memberof helpers/menu
     * @public
     * @param {string} className
     * @param {boolean} isHidden
     */
    function setItemHidden(className, isHidden) {
        var menuItem = null;

        if (tau.support.shape.circle) {
            menuItem = document.getElementById('files-menu-circle')
                .getElementsByClassName(className)[0];
        } else {
            menuItem = document.getElementById('files-menu-square')
                .getElementsByClassName(className)[0].parentNode;
        }

        if (!menuItem) {
            return;
        }

        if (isHidden) {
            menuItem.classList.add('hidden');
        } else {
            menuItem.classList.remove('hidden');
        }
    }

    /**
     * Updates the hidden files menu item. Changes title and icon of the item
     * depending on the visible parameter.
     *
     * @memberof helpers/menu
     * @public
     * @param {boolean} visible
     */
    function updateHiddenFilesItem(visible) {
        var title = visible ? HIDE_HIDDEN_FILES_TEXT : SHOW_HIDDEN_FILES_TEXT;

        if (tau.support.shape.circle) {
            hiddenFilesItem.classList.toggle('hide', visible);
            hiddenFilesItem.dataset.title = title;
            if (parseInt(selectorIndicator.dataset.index, 10) ===
                HIDDEN_FILE_ITEM_ID) {
                selectorIndicator.querySelector('.ui-selector-indicator-text')
                    .innerText = title;
            }
        } else {
            hiddenFilesItem.innerText = title;
        }
    }

    return {
        initializeMenu: initializeMenu,
        bindMenuClickEventListener: bindMenuClickEventListener,
        setItemHidden: setItemHidden,
        updateHiddenFilesItem: updateHiddenFilesItem
    };
});
