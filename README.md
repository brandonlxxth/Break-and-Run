# Break & Run

A simple and intuitive scoreboard app for tracking pool games. Supports multiple game modes including Race to, Sets of, and Best of matches.

## Features

- **Multiple Game Modes**: Race to, Sets of, and Best of
- **Player Statistics**: Track wins, losses, and draws between player pairs
- **Dish Tracking**: Record break dishes and reverse dishes
- **Game History**: View detailed frame-by-frame and set-by-set breakdowns
- **Resume Games**: Continue games if the app is closed accidentally
- **Landscape Support**: Works in both portrait and landscape orientations
- **Dark & Light Themes**: Automatically adapts to your system theme

## Installation (Sideloading)

This guide will help you install the app on your Android phone using ADB (Android Debug Bridge).

### Prerequisites

- An Android phone with USB debugging enabled
- A computer (Windows, Mac, or Linux)
- A USB cable to connect your phone to your computer
- The APK file (`app-debug.apk`)

### Step 1: Enable USB Debugging on Your Phone

1. Open **Settings** on your Android phone
2. Scroll down and tap **About phone** (or **About device**)
3. Find **Build number** and tap it **7 times** until you see a message saying "You are now a developer!"
4. Go back to Settings and tap **Developer options** (or **System** > **Developer options**)
5. Turn on **USB debugging**
6. If prompted, tap **OK** to confirm

### Step 2: Install ADB on Your Computer

#### Windows

1. Download the **Platform Tools** from [Google's website](https://developer.android.com/tools/releases/platform-tools)
2. Extract the ZIP file to a folder (e.g., `C:\platform-tools`)
3. Open **Command Prompt** or **PowerShell**
4. Navigate to the platform-tools folder:
   ```
   cd C:\platform-tools
   ```

#### Mac

1. Open **Terminal**
2. Install using Homebrew (if you have it):
   ```
   brew install android-platform-tools
   ```
   
   Or download from [Google's website](https://developer.android.com/tools/releases/platform-tools) and extract to a folder

#### Linux

1. Open **Terminal**
2. Install using your package manager:
   ```
   sudo apt-get install android-tools-adb
   ```
   
   Or download from [Google's website](https://developer.android.com/tools/releases/platform-tools)

### Step 3: Connect Your Phone

1. Connect your phone to your computer using a USB cable
2. On your phone, you may see a popup asking "Allow USB debugging?" - tap **Allow** (and optionally check "Always allow from this computer")
3. Open Command Prompt/Terminal and type:
   ```
   adb devices
   ```
4. You should see your device listed. If it shows "unauthorized", check your phone for the USB debugging permission popup

### Step 4: Install the App

1. Make sure you have the `app-debug.apk` file
2. In Command Prompt/Terminal, navigate to the folder containing the APK file
3. Run the following command:
   ```
   adb install app-debug.apk
   ```
4. Wait for the installation to complete. You should see "Success" when it's done
5. The app will now appear in your app drawer!

### Troubleshooting

**"adb: command not found"**
- Make sure you've installed ADB and are in the correct directory, or add ADB to your system PATH

**"device unauthorized"**
- Check your phone for the USB debugging permission popup and tap "Allow"

**"INSTALL_FAILED_UPDATE_INCOMPATIBLE"**
- You may have an older version installed. Uninstall it first:
  ```
  adb uninstall com.example.poolscoreboard
  ```
  Then try installing again

**Note**: If you previously installed "Pool Scoreboard", you may need to uninstall it first before installing "Break & Run"

**"INSTALL_FAILED_INSUFFICIENT_STORAGE"**
- Free up some space on your phone

**Device not showing up in `adb devices`**
- Make sure USB debugging is enabled
- Try a different USB cable
- On some phones, you may need to change the USB connection mode to "File Transfer" or "MTP"

### Building the APK Yourself

If you want to build the APK from source:

1. Clone or download this repository
2. Open the project in Android Studio
3. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
4. The APK will be generated in `app/build/outputs/apk/debug/app-debug.apk`

## Usage

1. **Create a New Game**: Tap "New Game", enter player names, select a game mode, and choose who breaks first
2. **Track Scores**: Use the +1, Dish, and -1 buttons to track frames
3. **View History**: Tap "Past Games" to see detailed game history
4. **Resume Games**: If you close the app during a game, you can resume it from the home screen

## Support

If you encounter any issues or have questions, please contact the developer.

## License

This app is provided as-is for personal use.

