#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

APP_NAME="HarmonyLab.app"
EXT_NAME="HarmonyLabAU.appex"
ARCH="$(uname -m)"
SDK_PATH="$(xcrun --show-sdk-path 2>/dev/null || echo '/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk')"
TARGET="${ARCH}-apple-macos14.0"

echo "=== Building HarmonyLab AUv3 MIDI FX & Standalone App ==="
echo "Target: $TARGET"
echo "SDK:    $SDK_PATH"

mkdir -p build/obj/ModuleCache
mkdir -p "build/$APP_NAME/Contents/MacOS"
mkdir -p "build/$APP_NAME/Contents/PlugIns/$EXT_NAME/Contents/MacOS"

# 1. Compile C++ DSP Engine & Objective-C++ Audio Unit
echo "[1/4] Compiling C++ DSP & AudioUnit..."
clang++ -c -fobjc-arc -std=c++17 -O3 -target "$TARGET" -isysroot "$SDK_PATH" \
    -fmodules-cache-path="$DIR/build/obj/ModuleCache" \
    -I Shared Shared/HarmonyLabDSP.mm -o build/obj/HarmonyLabDSP.o

clang++ -c -fobjc-arc -std=c++17 -O3 -target "$TARGET" -isysroot "$SDK_PATH" \
    -fmodules-cache-path="$DIR/build/obj/ModuleCache" \
    -I Shared Shared/HarmonyLabAudioUnit.mm -o build/obj/HarmonyLabAudioUnit.o

# 2. Compile App Extension (AUv3 Plugin)
echo "[2/4] Compiling AUv3 App Extension (HarmonyLabAU.appex)..."
swiftc -O -target "$TARGET" -sdk "$SDK_PATH" \
    -module-cache-path "$DIR/build/obj/ModuleCache" \
    -module-name HarmonyLabAU \
    -parse-as-library -emit-executable \
    -Xlinker -e -Xlinker _NSExtensionMain \
    -import-objc-header Shared/HarmonyLabAudioUnit.h \
    UI/*.swift Shared/VoicingsData.swift AudioUnitExtension/AudioUnitViewController.swift \
    build/obj/HarmonyLabDSP.o build/obj/HarmonyLabAudioUnit.o \
    -framework AudioToolbox -framework CoreAudioKit -framework CoreMIDI \
    -framework SwiftUI -framework AppKit -framework Foundation -framework AVFoundation -lc++ \
    -o "build/$APP_NAME/Contents/PlugIns/$EXT_NAME/Contents/MacOS/HarmonyLabAU"

# 3. Compile Standalone App Container
echo "[3/4] Compiling Standalone macOS App..."
swiftc -O -target "$TARGET" -sdk "$SDK_PATH" \
    -module-cache-path "$DIR/build/obj/ModuleCache" \
    -module-name HarmonyLab \
    -parse-as-library -emit-executable \
    -import-objc-header Shared/HarmonyLabAudioUnit.h \
    UI/*.swift Shared/VoicingsData.swift StandaloneApp/*.swift \
    build/obj/HarmonyLabDSP.o build/obj/HarmonyLabAudioUnit.o \
    -framework AudioToolbox -framework CoreAudioKit -framework CoreMIDI \
    -framework SwiftUI -framework AppKit -framework Foundation -framework AVFoundation -lc++ \
    -o "build/$APP_NAME/Contents/MacOS/HarmonyLab"

# 4. Copy Plists and Sign with Ad-Hoc Entitlements
echo "[4/4] Packaging & Signing..."
cp AudioUnitExtension/Info.plist "build/$APP_NAME/Contents/PlugIns/$EXT_NAME/Contents/Info.plist"
cp StandaloneApp/Info.plist "build/$APP_NAME/Contents/Info.plist"

codesign --force --sign - --entitlements AudioUnitExtension/Entitlements.plist "build/$APP_NAME/Contents/PlugIns/$EXT_NAME"
codesign --force --sign - --entitlements StandaloneApp/Entitlements.plist "build/$APP_NAME"

echo "=== Build Complete! App bundle at: native/build/$APP_NAME ==="
