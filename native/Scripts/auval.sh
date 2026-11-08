#!/bin/bash
set -e

echo "=== Validating HarmonyLab AUv3 MIDI FX with auval ==="
echo "Type: aumi, Subtype: hmlb, Manufacturer: PBrn"
echo ""

auval -v aumi hmlb PBrn
