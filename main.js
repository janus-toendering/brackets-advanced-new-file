/**
 * 
 * @author Janus Tøndering <janus@toendering.dk>
 * @license MIT
 */

/*jslint white: true, vars: true, node: true, nomen: true */
/*global define,brackets,$*/

define(function(require, exports, module) {
    "use strict";
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        Commands = brackets.getModule("command/Commands"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        ModalBar = brackets.getModule("widgets/ModalBar"),
        FileUtils = brackets.getModule("file/FileUtils"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
        AppInit = brackets.getModule("utils/AppInit");
    
    var html = "<div align='right'><input type='text' autocomplete='off' id='advancedNewFile' placeholder='Enter new filename\u2026' style='width: 30em'></div>";

    var panel;

    function mkdir(dir)
    {
        var promise = $.Deferred();
        dir.create(function(err, stat){
            if(err) { promise.reject(err); }
            else    { promise.resolve(); }
        });
        return promise;
    }
    
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
    
    function createEmptyFile(file)
    {
        var promise = $.Deferred();
        file.write("", {}, function(err, stat){
            if(err) { promise.reject(err); }
            else    { promise.resolve(); }
        });
        return promise;
    }
    
    function tryOpenExistingFile(file)
    {
        var promise = $.Deferred();
        file.exists(function(err, exists){
            if(!err && exists)
            {
                return CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: file.fullPath});
            }
            promise.reject();
        });
        return promise;
    }
    
    function createNewFile(filename)
    {
        var basePath = ProjectManager.getProjectRoot().fullPath;
        var file = FileSystem.getFileForPath(basePath + "/" + filename);
        var dir = FileUtils.getDirectoryPath(file.fullPath);

        // TODO - Don't overwrite existing files
        tryOpenExistingFile(file)
            .then(function(){ panel.close(); })
            .fail(function(){
                mkdirp(dir)
                    .then(function(){
                        return createEmptyFile(file);
                    })
                    .then(function(){
                        return CommandManager.execute(Commands.FILE_ADD_TO_WORKING_SET, {fullPath: file.fullPath});
                    })
                    .always(function(){
                        panel.close();
                    })
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
    
    AppInit.appReady(function(){
        var NEW_FILE_EXECUTE = "toendering.advanced_new_file.newFile";
        CommandManager.register("Create new file", NEW_FILE_EXECUTE,openModalBar);
        KeyBindingManager.addBinding(NEW_FILE_EXECUTE, { key: "Opt-Alt-N" });
    });
});
