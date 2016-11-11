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
 * Filesystem module.
 * @requires {@link core/tizen}
 * @requires {@link core/promise}
 * @namespace core/fs
 */

define(
    'core/fs',
    [
        'core/tizen',
        'core/promise'
    ],
    function coreFilesystem(tizen, Promise) {
        'use strict';

        /**
         * @type {string}
         */
        var URI_PREFIX = 'file://';

        /**
         * Returns file name for given path.
         * @memberof core/fs
         * @param {string} path
         * @return {string}
         */
        function basename(path) {
            return path.split('/').pop();
        }

        /**
         * Returns parent directory's path.
         * @memberof core/fs
         * @param {string} path
         * @return {string}
         */
        function getDirectoryPath(path) {
            return path.split('/').slice(0, -1).join('/');
        }

        /**
         * Returns system path for specified URI.
         * @memberof core/fs
         * @param {string} uri
         * @return {string}
         */
        function getSystemPath(uri) {
            return uri.replace(URI_PREFIX, '');
        }

        /**
         * Extracts file extension from file name.
         * @param {string} fileName
         * @param {boolean} [addDot] Flag indicating whether a dot should be
         * added in front of returned extension or not.
         * @memberof core/fs
         * @return {string} extension for specified file name.
         */
        function getFileExtension(fileName, addDot) {
            if (fileName.length && fileName[0] === '.') {
                fileName = fileName.substring(1);
            }

            var splitFileName = fileName.split('.'),
                ext = '';

            if (splitFileName.length > 1) {
                ext = splitFileName.pop();
                if (addDot === undefined || addDot) {
                    ext = '.' + ext;
                }
            }
            return ext;
        }

        /**
         * Returns file name without extension.
         * @memberof core/fs
         * @param {string} fileName Full file name.
         * @return {string} fileName  File name without extension.
         */
        function getFileNameWithoutExtension(fileName) {
            var name = isHidden(fileName) ? fileName.substring(1) : fileName,
                splitFileName = name.split('.');

            if (splitFileName.length > 1) {
                return (isHidden(fileName) ? '.' : '') +
                    splitFileName.slice(0, -1).join('.');
            }

            return fileName;
        }

        /**
         * Returns true if filename starts with a dot, false otherwise.
         * @memberof core/fs
         * @param {string} fileName
         * @return {boolean}
         */
        function isHidden(fileName) {
            return (fileName.length && fileName[0] === '.');
        }

        /**
         * Parses specified file path and returns data parts.
         * @memberof core/fs
         * @param {string} filePath
         * @return {object}
         */
        function getPathData(filePath) {
            var path = {
                    originalPath: filePath,
                    fileName: '',
                    parentDirectoryPath: ''
                },
                splitPath = filePath.split('/');

            path.fileName = splitPath.pop();
            path.parentDirectoryPath = splitPath.join('/') || '/';

            return path;
        }

        /**
         * Writes content to file stream.
         * @memberof core/fs
         * @param {File} fileHandler File handler.
         * @param {string} content File content.
         * @param {boolean} [isBase64] Flag indicating whether the content is
         * encoded base64 or not.
         * @return {Promise}
         */
        function writeFile(fileHandler, content, isBase64) {
            return new Promise(function promise(resolve, reject) {
                fileHandler.openStream('w', function writeFile(fileStream) {
                    if (isBase64) {
                        fileStream.writeBase64(content);
                    } else {
                        fileStream.write(content);
                    }

                    fileStream.close();

                    resolve();
                }, reject, 'UTF-8');
            });

        }

        /**
         * Opens specified directory or file.
         *
         * @memberof core/fs
         * @param {string} path Node path.
         * @param {string} [openMode] Open mode. If not specified, 'rw' mode is
         * being used.
         * @return {Promise<File>} Promise resolving File object.
         */
        function resolveFile(path, openMode) {
            return new Promise(function promise(resolve, reject) {
                tizen.filesystem.resolve(path, resolve, reject,
                    openMode || 'rw');
            });
        }

        /**
         * Creates a new file and writes content to it.
         * @memberof core/fs
         * @param {string} path File path.
         * @param {string} content File content.
         * @param {boolean} [isBase64] Flag indicating whether the content is
         * encoded base64 or not.
         * @return {Promise<File>} Promise resolving created file handler.
         */
        function writeToNewFile(path, content, isBase64) {
            var pathData = getPathData(path),
                fileHandler = null;

            return resolveFile(pathData.parentDirectoryPath)
                .then(function onGetDirectoryHandler(directoryHandler) {
                    return directoryHandler.createFile(pathData.fileName);
                })
                .then(function onCreateFile(handler) {
                    fileHandler = handler;
                    return writeFile(handler, content, isBase64);
                })
                .then(function afterWrite() {
                    return fileHandler;
                });
        }

        /**
         * Deletes specified file.
         *
         * @memberof core/fs
         * @param {File} directoryHandler
         * @param {string} filePath
         * @return {Promise}
         */
        function deleteFile(directoryHandler, filePath) {
            return new Promise(function promise(resolve, reject) {
                directoryHandler.deleteFile(filePath, resolve, reject);
            });
        }

        /**
         * Deletes specified directory.
         *
         * @memberof core/fs
         * @param {File} parentDirectoryHandler Directory.
         * @param {string} directoryPath
         * @param {boolean} [recursive] Flag indicating whether the deletion is
         * recursive or not. When set to true recursive deletion is allowed.
         * Also, this function deletes all data in all subdirectories and so
         * needs to be used with caution.
         * @return {Promise}
         */
        function deleteDirectory(parentDirectoryHandler, directoryPath,
                                 recursive) {
            return new Promise(function promise(resolve, reject) {
                parentDirectoryHandler.deleteDirectory(directoryPath,
                    !!recursive, resolve, reject);
            });
        }

        /**
         * Obtains a list of files from directory handler.
         * @param {File} directoryHandler
         * @param {object} [filter]
         * @return {Promise<File[]>} Promise resolving array of File objects.
         */
        function listFilesFromHandler(directoryHandler, filter) {
            return new Promise(function promise(resolve, reject) {
                directoryHandler.listFiles(resolve, reject, filter);
            });
        }

        /**
         * Deletes node (file or directory) with specified path.
         * @memberof core/fs
         * @param {string} nodePath Node path.
         * @return {Promise}
         */
        function deleteNode(nodePath) {
            var pathData = getPathData(nodePath),
                directoryHandler = null;

            return resolveFile(pathData.parentDirectoryPath)
                .then(function onResolvedDirectory(handler) {
                    directoryHandler = handler;
                    return listFilesFromHandler(handler, {
                        name: pathData.fileName
                    });
                })
                .then(function onListFiles(files) {
                    var deleteNodeFunction = null;
                    if (files[0].isDirectory) {
                        deleteNodeFunction = deleteDirectory;
                    } else {
                        deleteNodeFunction = deleteFile;
                    }

                    return deleteNodeFunction(
                        directoryHandler,
                        files[0].fullPath
                    );
                });
        }

        /**
         * Obtains a list of files from specified directory path.
         * @memberof core/fs
         * @param {string} directoryPath
         * @return {Promise<object>} Promise resolving object consisted of
         * two fields: 'files' that is an array of File objects and
         * 'directoryHandler' that is handler of listed directory.
         */
        function listFiles(directoryPath) {
            var directoryHandler = null;
            return resolveFile(directoryPath)
                .then(function onResolve(handler) {
                    directoryHandler = handler;
                    return listFilesFromHandler(handler);
                })
                .then(function onListFiles(files) {
                    return {
                        files: files,
                        directoryHandler: directoryHandler
                    };
                });
        }

        /**
         * Obtains a list of names of files from specified directory handler.
         * @memberof core/fs
         * @param {File} directoryHandler
         * @return {Promise<string[]>} Promise resolving an array of files
         * names.
         */
        function listFilesNames(directoryHandler) {
            return listFilesFromHandler(directoryHandler)
                .then(function onListFiles(files) {
                    return files.map(function getFile(file) {
                        return file.name;
                    });
                });
        }

        /**
         * Obtains a list of storages.
         * Obtained list can be filtered by type or label if 'filter' argument
         * is specified.
         * @memberof core/fs
         * @param {object} [filter] Filter object.
         * @param {string} [filter.type]
         * @param {string} [filter.label]
         * @return {Promise<object>} Promise resolving list of storages objects.
         */
        function getStorages(filter) {
            return new Promise(function promise(resolve) {
                tizen.filesystem.listStorages(function getStorages(storages) {
                    if (!filter) {
                        resolve(storages);
                    } else {
                        resolve(storages.filter(
                            function filterStorage(storage) {
                                return (!filter.type ||
                                    filter.type === storage.type) &&
                                    (!filter.label ||
                                    filter.label === storage.label);
                            }
                        ));
                    }
                });
            });
        }

        return {
            basename: basename,
            getDirectoryPath: getDirectoryPath,
            getSystemPath: getSystemPath,
            getFileExtension: getFileExtension,
            getFileNameWithoutExtension: getFileNameWithoutExtension,
            isHidden: isHidden,

            resolveFile: resolveFile,
            deleteDirectory: deleteDirectory,
            listFiles: listFiles,
            listFilesNames: listFilesNames,

            deleteFile: deleteFile,
            writeFile: writeFile,
            writeToNewFile: writeToNewFile,
            deleteNode: deleteNode,

            getPathData: getPathData,
            getStorages: getStorages
        };
    }
);
