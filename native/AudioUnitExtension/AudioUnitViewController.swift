//
// AudioUnitViewController.swift
// HarmonyLab AUv3 MIDI FX
//
// Principal class for the App Extension, wrapping SwiftUI in NSHostingView
//

import CoreAudioKit
import SwiftUI
import AppKit

@objc(AudioUnitViewController)
public class AudioUnitViewController: AUViewController, AUAudioUnitFactory {
    private var audioUnit: HarmonyLabAudioUnit?
    private var viewModel: HarmonyLabViewModel?
    private var hostingView: NSHostingView<HarmonyLabRootView>?

    public override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    public override func loadView() {
        view = NSView(frame: NSRect(x: 0, y: 0, width: 860, height: 620))
    }

    private func setupUI() {
        let vm: HarmonyLabViewModel
        if let existing = self.viewModel {
            vm = existing
        } else {
            let newVm = HarmonyLabViewModel(audioUnit: self.audioUnit)
            self.viewModel = newVm
            vm = newVm
        }

        let rootView = HarmonyLabRootView(viewModel: vm)
        let hosting = NSHostingView(rootView: rootView)
        hosting.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(hosting)

        NSLayoutConstraint.activate([
            hosting.topAnchor.constraint(equalTo: view.topAnchor),
            hosting.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hosting.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hosting.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        self.hostingView = hosting
    }

    public func createAudioUnit(with componentDescription: AudioComponentDescription) throws -> AUAudioUnit {
        let au = try HarmonyLabAudioUnit(componentDescription: componentDescription, options: [])
        self.audioUnit = au

        // Pre-create ViewModel to sync all loaded slots & configuration to C++ engine immediately
        let vm = HarmonyLabViewModel(audioUnit: au)
        self.viewModel = vm

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.hostingView?.removeFromSuperview()
            self.setupUI()
        }

        return au
    }
}
