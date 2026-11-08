#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

# 1. Build
./Scripts/build.sh

# 2. Install to /Applications
echo "Installing HarmonyLab.app to /Applications..."
rm -rf /Applications/HarmonyLab.app
cp -R build/HarmonyLab.app /Applications/

# 3. Force LaunchServices and pluginkit to register the AUv3 extension
echo "Registering AUv3 extension with LaunchServices and pluginkit..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f /Applications/HarmonyLab.app
pluginkit -a /Applications/HarmonyLab.app/Contents/PlugIns/HarmonyLabAU.appex

# 4. Restart CoreAudio AudioUnit registry
echo "Restarting audiocomponentregistrard..."
killall -9 audiocomponentregistrard 2>/dev/null || true

# 5. Clear stale Logic Pro AU cache
rm -f ~/Library/Caches/AudioUnitCache/com.apple.audiounits.cache
rm -f ~/Library/Caches/AudioUnitCache/com.apple.audiounits.sandboxed.cache

echo "=== HarmonyLab successfully installed to /Applications and registered! ==="
