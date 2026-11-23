LECCOM Schedule Builder
=======================

HOW TO OPEN
-----------
1. Double-click "LECCOM Schedule Builder.exe".
2. The schedule opens in your default browser.
3. A small LECCOM icon appears in the Windows notification area (system tray).

The app keeps running while the browser is open. Closing the browser tab does
not stop the local app. To stop it, right-click the tray icon and choose Exit.

If the browser does not open, right-click the tray icon and choose Open
Schedule Builder.

FIRST-RUN WARNING
-----------------
This release is unsigned, so Windows SmartScreen may show a warning the first
time it runs. Choose "More info", then "Run anyway". The app is a local program
and does not connect to the internet.

WHERE YOUR DATA IS SAVED
------------------------
Data is saved automatically in:

  %LOCALAPPDATA%\LECCOM Schedule Builder\data.json

Daily backups are kept in the "backups" folder next to data.json. The app keeps
the most recent 30 backups.

Right-click the tray icon and choose "Open data folder" to find these files.

MOVING OR BACKING UP
--------------------
For normal backups, use the app's Export JSON button. To restore, use Import
JSON.

To move to another computer, copy the whole "LECCOM Schedule Builder" folder
from %LOCALAPPDATA% while the app is closed, or use Export JSON and Import JSON.

UPDATING
--------
Close the app from the tray, replace the old .exe with the new one, and open it
again. Your data is stored separately and is not replaced by an update.

MOVING FROM THE OLD BROWSER VERSION
-----------------------------------
If you used the old development version at http://127.0.0.1:5173, your browser
stored the schedule separately. Open the old version, choose Export JSON, then
open this app and choose Import JSON once.

TECHNICAL NOTES
---------------
- Address: http://leccom.localhost:8080
- If port 8080 is busy, the app uses the next free port from 8081 to 8090.
  Use the tray menu's Open command to open the correct address.
- The local server accepts connections only from this computer.
- Windows 10 or Windows 11 is required.
- No installation or administrator rights are needed.
- Only one copy of the app runs at a time.
