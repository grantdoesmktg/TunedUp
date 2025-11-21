# Development Setup - TunedUp Native

## Development Workflow

### Device Setup
- iPhone connected to same WiFi network as Mac
- Development build installed via Xcode (not Expo Go)
- Device in developer mode

### Starting Development Server

1. **Kill any stuck processes:**
   ```bash
   killall -9 node
   ```

2. **Start Metro bundler:**
   ```bash
   npx expo start
   ```

   Note: Do NOT use `--clear` flag as it causes issues. Do NOT use `--lan` flag.

3. **Get Mac's IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'
   ```
   Example output: `192.168.1.16`

4. **Connect iPhone to bundler:**
   - In the app on iPhone, shake device to open developer menu
   - Enter bundler URL: `http://[YOUR_MAC_IP]:8081`
   - Example: `http://192.168.1.16:8081`

### Reinstalling the App

If you need to delete and reinstall the app:

1. **Delete app from iPhone**

2. **Build and install via Xcode:**
   ```bash
   open ios/TunedUpNative.xcworkspace
   ```
   - Select your iPhone as the build target
   - Click Play button (Cmd+R) to build and install

3. **Start Metro bundler** (see steps above)

4. **Connect to bundler** using the IP address method

### Troubleshooting

**Metro won't start / stuck on "Waiting on http://localhost:8081":**
- Kill all node processes: `killall -9 node`
- Wait 3 seconds before restarting
- Start with simple `npx expo start` (no flags)

**"TunedUp Native is not available" error:**
- Metro bundler is not running
- Start Metro bundler following steps above
- Reconnect device to bundler using IP address

**Can't connect to bundler from iPhone:**
- Verify Mac's IP address hasn't changed
- Make sure both devices are on same WiFi network
- Metro must be running (check with `curl http://localhost:8081/status`)
- Should return: `packager-status:running`

### Important Notes

- Always use `npx expo start` without flags for most reliable connection
- The `--lan` flag can cause connection issues
- The `--clear` flag can cause Metro to hang indefinitely
- If multiple Metro processes get stuck, kill all node processes and start fresh
- Development build (installed via Xcode) is required, not Expo Go
