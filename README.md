# Advanced New File (Brackets plugin)

File creation plugin for [Adobe Brackets](https://github.com/adobe/brackets) inspired by
[AdvancedNewFile](https://github.com/skuroda/Sublime-AdvancedNewFile) 
for SublimeText.

Much faster than using the built-in "New File" command.

## Installation

Install from the extension manager. Search for Advanced New File.

## Usage

Press Ctrl+Shift+N to open the "New File" panel and enter the name
of the new file. Any folders in the path that do not exist will
be automatically created. You can also use the "Advanced New File"
menu item in the file menu.

## Preferences

You can open the prefences file from "Debug > Open Preferences File" 
or find it in 
```
    $HOME/.config/Brackets/brackets.json
``` 
on Linux and in
```
    %APPDATA%\Brackets\brackets.json
``` 
on Windows.

### Change Keyboard Shortcut

Add
```
    "brackets-advanced-new-file.shortcut": "shortcut-goes-here"
```
and replace "shortcut-goes-here" with a valid shortcut string (eg. Ctrl-Shift-A).

### Hide Menu Item

If you prefer to hide the menu item from the file menu add
```
    "brackets-advanced-new-file.hideMenuItem": true
```
to the preferences file.
