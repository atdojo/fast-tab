# Fast Tab
Its fast.  
### Search
Command is optional. It would execute actions like `close` for all filtered tabs.
```bash
[Search Query] [Command]
```

### Shortcuts
**Outside Popup**  
`alt f` - Open extension popup  
**Inside Popup**  
`arrow up` - Select previous tab  
`arrow down` - Select next tab  
`enter` - Go to selected tab or execute command  

### Commands 
Commands can be added after a search query. The following example would close all tabs that remain when searched `Hello World`
```
Hello World :close 
```
`:close` - Close all filtered tabs  
`:mute` - Muted all filtered tabs  
`:unmute` - Unmute all filtered tabs  
`:reload` - Reload all filtered tabs  
`:detach` - Detach all filtered tabs to a new window  
`:detachsingle` - Detach all filtered tabs into seperate windows  
`:merge` - Merge all filtered tabs into one window  

# Installation
1. Download [Zip](https://github.com/atdojo/fast-tab/archive/refs/heads/main.zip)
2. Unzip
3. Go to [chrome://extensions/](chrome://extensions/)
4. Enable developer mode (right top corner)
5. Click on "Load unpacked"
6. Select "fast-tab-main"
7. Done. Happy tabbing