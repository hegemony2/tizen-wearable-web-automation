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

/*global define, document, tau*/

/**
 * Main page module.
 *
 * @module views/main
 * @requires {@link core/template}
 * @requires {@link core/event}
 * @requires {@link helpers/popup}
 * @requires {@link helpers/dom}
 * @requires {@link models/filesystem}
 * @requires {@link models/state}
 * @namespace views/main
 * @memberof views
 */
define(
    'views/main', [
                   'core/template'
                   , 'core/event'
                   ,'helpers/menu'
                   ,'helpers/popup'],
    function viewsMain(require) {
        'use strict';

        /**
         * Template core module.
         *
         * @private
         * @type {Module}
         */
        var template = require('core/template');
        var events = require('core/event');
        var page = null;
        var deviceListEl = null;
        var hasLoggedIn = false;
        var devices = null;
        var menu = require('helpers/menu');
        var popups = require('helpers/popup');

        function login(callback, args) {

            var url = "https://www.mychamberlain.com/";
            var method = "POST";
            var formData = "Email=" + localStorage.getItem("automation.username") + "&password=" + localStorage.getItem("automation.p3f853d72");
            console.log("formData: " + formData);
            var http = new XMLHttpRequest();

            console.log("login:  var http done;");

            if (!hasLoggedIn) {
            	
                http.open(method, url, true);

                console.log("login:  http.open done;");

                http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                http.onreadystatechange = function() {

                	console.log("http.onreadystatechange");
                	
                    if (http.readyState === 4 && http.status === 200) {
                        console.log("sent login");
                        hasLoggedIn = true;
                        callback.apply(this, args);
                    } else {
                        console.log("else");
                    }

                };
                http.send(formData);

                console.log("login:  http.send(formData) done;");

            } else {
                callback.apply(this, args);
            }

        }

        function getAllDevices() {

            var url = "https://www.mychamberlain.com/api/MyQDevices/GetAllDevices?brandName=Chamberlain";
            var method = "GET";
            var http = new XMLHttpRequest();

            console.log("getAllDevices()");
            
            http.open(method, url, true);
            
            console.log("getAllDevices() http.open");
            
            http.onreadystatechange = function() {

                if (http.readyState === 4 && http.status === 200) {
                    // console.log(http.getAllResponseHeaders());
                    console.log("retrieved devices");
                    // console.log(http.responseText);
                    devices = JSON.parse(http.responseText);
                    reloadDeviceList();
                    // debugger;
                } else {
                    console.log("not connected");
                }

            };
            http.send();
            
            console.log("getAllDevices() http.send");
        }

        function triggerStateChange(event) {

            // var deviceId = checkboxObj.id;
            var deviceId = event.target.id;
            var paramArray = new Array();
            paramArray.push(deviceId);

            login(performStateChange, paramArray);

        }

        function performStateChange(deviceId) {

            var deviceArrPos = getDeviceArrPosFromDevicesById(deviceId);
            var device = devices[deviceArrPos];
            var url = "";

            var method = "POST";
            var http = new XMLHttpRequest();

            var deviceObjTargetState = "0";
            var targetState = "0"; // closed

            
            if (device.isGarageDoor) {
                if (device.State === "2") {
                    targetState = "1"; // open
                } else {
                    deviceObjTargetState = "2";
                }

                url = "https://www.mychamberlain.com/Device/TriggerStateChange?myQDeviceId=" + deviceId + "&attributename=desireddoorstate&attributevalue=" + targetState;

            } else {
                if (device.State === "0") {
                    targetState = "1"; // on
                    deviceObjTargetState = "1";
                }

                url = "https://www.mychamberlain.com/Device/TriggerStateChange?myQDeviceId=" + deviceId + "&attributename=desiredlightstate&attributevalue=" + targetState;
            }

            http.open(method, url, true);
            http.setRequestHeader("Content-type", "json");
            http.onreadystatechange = function() {

                if (http.readyState === 4 && http.status === 200) {
                    console.log("triggered state change");
                    // now need to set the checkbox appropriately
                    devices[deviceArrPos].State = deviceObjTargetState;
                    // perhaps wait also until it is done;
                } else {
                    // no change--set the device back to where it was;
                }
                reloadDeviceList();
            };
            http.send();

        }

        function setOnOff(baseResponse) {

            for (var i = 0; i < baseResponse.length; i++) {

                if (baseResponse[i].DeviceTypeId === 2) {
                    baseResponse[i].isGarageDoor = true;
                    if (baseResponse[i].State === "2") {
                        baseResponse[i].isOn = false;
                    } else {
                        baseResponse[i].isOn = true;
                    }
                } else {
                    baseResponse[i].isGarageDoor = false;

                    if (baseResponse[i].State === "0") {
                        baseResponse[i].isOn = false;
                    } else {
                        baseResponse[i].isOn = true;
                    }
                }

            }
            return (baseResponse);

        }

        function getDeviceArrPosFromDevicesById(id) {

            var device = -1;

            for (var i = 0; i < devices.length; i++) {
                if (devices[i].MyQDeviceId == id) {
                    device = i;
                    break;
                }
            }

            return (device);

        }

        /**
         * Handles the hardware key events.
         *
         * @private
         * @param {Object}
         *            event - The object contains data of key event
         */
        function keyEventHandler(event) {
            if (event.keyName === "back") {
                try {
                    tizen.application.getCurrentApplication().exit();
                } catch (ignore) {}
            }
        }

        /**
         * Sets default event listeners.
         *
         * @private
         */
        function setDefaultEvents() {
            document.addEventListener("tizenhwkey", keyEventHandler);
            
            menu.bindMenuClickEventListener('menu-username', onUsernameMenuItemClicked);
            menu.bindMenuClickEventListener('menu-p3f853d72', onp3f853d72MenuItemClicked);
            
//            menu.bindMenuClickEventListener('menu-about',onAboutMenuItemClicked);
            
            
            
        }
        
        function onUsernameMenuItemClicked() {
        	console.log("onUsernameMenuItemClicked");
        	var username = localStorage.getItem("automation.username");
            popups.showInput('Username:', onEnterUsername, username);
        }
        
        function onEnterUsername(username) {
        	console.log("username: " + username);
        	localStorage.setItem("automation.username", username);
        }

        function onp3f853d72MenuItemClicked() {
        	console.log("onp3f853d72MenuItemClicked");
        	var p3f853d72 = localStorage.getItem("automation.p3f853d72");
            popups.showPasswordInput('Password:', onEnterp3f853d72, p3f853d72);
        }
        
        function onEnterp3f853d72(p3f853d72) {
        	console.log("p3f853d72: " + p3f853d72);
        	localStorage.setItem("automation.p3f853d72", p3f853d72);
        }
        
        function reloadDeviceList() {
            // debugger;

            devices = setOnOff(devices);

            deviceListEl.innerHTML = template.get('devices-content', {
                devices: devices
            });

            var checkboxes = document.getElementsByName("deviceList");
            for (var i = 0; i < checkboxes.length; i++) {
                var checkbox = checkboxes[i];
                checkbox.addEventListener("click", triggerStateChange);
            }

        }


        function init() {

            // debugger;
            console.log("init!");

            page = document.getElementById('main');
            deviceListEl = document.getElementById('devices-content');
            login(getAllDevices, null);
            setDefaultEvents();
            menu.initializeMenu(page, 'open-files-menu');

        }

        return {
            init: init
        };
    });