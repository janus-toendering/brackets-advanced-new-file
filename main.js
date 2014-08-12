/**
 * 
 * @author Janus Tøndering <janus@toendering.dk>
 * @license MIT
 */

/*jslint white: true, vars: true, node: true, nomen: true */
/*global define,brackets,$,appshell*/

define(function(require, exports, module) {
    "use strict";
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        Commands = brackets.getModule("command/Commands"),
        Menus = brackets.getModule("command/Menus"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        ModalBar = brackets.getModule("widgets/ModalBar"),
        FileUtils = brackets.getModule("file/FileUtils"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        AppInit = brackets.getModule("utils/AppInit");

    var html = "<div align='right'><input type='text' autocomplete='off' id='advancedNewFile' placeholder='Enter new filename\u2026' style='width: 30em'></div>";

    var panel;

    // Commands
    var NEW_FILE_EXECUTE = "toendering.advanced_new_file.newFile";

    // define preferences
    var prefs = PreferencesManager.getExtensionPrefs("brackets-advanced-new-file");
    prefs.definePreference("shortcut", "string", "");
    prefs.definePreference("hideMenuItem", "boolean", false);

    function mkdir(dir)
    {
        var promise = $.Deferred();
        dir.create(function(err, stat){
            if(err) { promise.reject(err); }
            else    { promise.resolve(); }
        });
        return promise;
    }
    
    /**
     * Implementation of "mkdir -p" unix command
     * @param {string} path
     * @returns {jQuery.Deferred}
     */
    function mkdirp(path)
    {
        var dir = FileSystem.getDirectoryForPath(path);
        var promise = $.Deferred();
        
        dir.exists(function(err, exists){
            if(!exists)
            {
                var parentFolder = path.replace(/\/+\s*$/, "").split('/').slice(0, -1).join('/');
                mkdirp(parentFolder).then(function(){
                    dir.create(function(err, stat){
                        if(err) { promise.reject(err); }
                        else    { promise.resolve(); }
                    });
                })
                .fail(function(err){
                    promise.reject(err);
                });
            }
            else {
                promise.resolve();
            }
        });
        
        return promise;
    }
    
    /**
     * Creates a new empty file (will truncate existing files)
     * @param {File} file
     * @returns {jQuery.Deferred}
     */
    function createEmptyFile(file)
    {
        var promise = $.Deferred();
        file.write("", {}, function(err, stat){
            if(err) { promise.reject(err); }
            else    { promise.resolve(); }
        });
        return promise;
    }

    /**
     * Open file in brackets
     * @param {File} file
     * @returns {jQuery.Deferred}
     */
    function addFileToWorkingSet(file)
    {
        return CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: file.fullPath});
    }
    
    /**
     * Open file in brackets if it exists.
     * @param {File} file
     * @returns {jQuery.Deferred} promise that is resolved if found, rejected otherwise
     */
    function tryOpenExistingFile(file)
    {
        var promise = $.Deferred();
        file.exists(function(err, exists){
            if(!err && exists)
            {
                return addFileToWorkingSet(file);
            }
            promise.reject();
        });
        return promise;
    }
    
    /**
     * Create filename if it doesn't exist, opens it otherwise
     * @param {string} filename
     */
    function createNewFile(filename)
    {
        var basePath = ProjectManager.getProjectRoot().fullPath;
        var file = FileSystem.getFileForPath(basePath + "/" + filename);
        var dir = FileUtils.getDirectoryPath(file.fullPath);

        tryOpenExistingFile(file)
            .then(function(){ panel.close(); })
            .fail(function(){
                mkdirp(dir)
                    .then(function()   { return createEmptyFile(file); })
                    .then(function()   { return addFileToWorkingSet(file); })
                    .always(function() { panel.close(); })
                    .fail(function(err){
                        Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERROR, "Error", err);
                    });
            });
    }
    
    function handleKeyDown(e)
    {
        if(e.keyCode === 13)
        {
            createNewFile(e.target.value.trim());
            e.preventDefault();
        }
    }
    
    function openModalBar()
    {
        panel = new ModalBar.ModalBar(html, true);
        var input = panel.getRoot().find("input").first();
        input.on('keydown', handleKeyDown);
        $(panel).on("close", function(){
            input.off("keydown", handleKeyDown);
        });
    }
    
    function getShortcutString(platform)
    {
        return prefs.get("shortcut") || "Ctrl-Shift-N";
    }
    
    function registerKeyBindings()
    {
        KeyBindingManager.addBinding(NEW_FILE_EXECUTE, { key: getShortcutString() });
    }
    
    function addMenuItems()
    {
        if(!prefs.get("hideMenuItem"))
        {
            var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
            menu.addMenuItem(NEW_FILE_EXECUTE, null, Menus.AFTER, Commands.FILE_NEW_UNTITLED);
        }
    }
    
    AppInit.appReady(function(){
        CommandManager.register("Advanced New File", NEW_FILE_EXECUTE,openModalBar);

        registerKeyBindings();
        addMenuItems();
    });
});
