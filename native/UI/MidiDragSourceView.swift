//
// MidiDragSourceView.swift
// HarmonyLab AUv3 MIDI FX
//
// Native AppKit Dragging Source for seamless Drag-and-Drop of MIDI files into Logic Pro
//

import SwiftUI
import AppKit

public struct MidiDragButton: View {
    public let notes: [UInt8]
    public let chordName: String
    public let label: String

    public init(notes: [UInt8], chordName: String, label: String = "Drag MIDI") {
        self.notes = notes
        self.chordName = chordName
        self.label = label
    }

    public var body: some View {
        MidiDragRepresentable(notes: notes, chordName: chordName, label: label)
            .frame(height: 28)
    }
}

struct MidiDragRepresentable: NSViewRepresentable {
    let notes: [UInt8]
    let chordName: String
    let label: String

    func makeNSView(context: Context) -> DraggableMidiNSView {
        let view = DraggableMidiNSView()
        view.notes = notes
        view.chordName = chordName
        view.buttonLabel = label
        return view
    }

    func updateNSView(_ nsView: DraggableMidiNSView, context: Context) {
        nsView.notes = notes
        nsView.chordName = chordName
        nsView.buttonLabel = label
        nsView.needsDisplay = true
    }
}

class DraggableMidiNSView: NSView, NSDraggingSource {
    var notes: [UInt8] = []
    var chordName: String = "Chord"
    var buttonLabel: String = "Drag MIDI"

    private var isHovered = false

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        setupTracking()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupTracking()
    }

    private func setupTracking() {
        let area = NSTrackingArea(rect: bounds, options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect], owner: self, userInfo: nil)
        addTrackingArea(area)
    }

    override func mouseEntered(with event: NSEvent) {
        isHovered = true
        needsDisplay = true
    }

    override func mouseExited(with event: NSEvent) {
        isHovered = false
        needsDisplay = true
    }

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)

        let bgPath = NSBezierPath(roundedRect: bounds.insetBy(dx: 1, dy: 1), xRadius: 6, yRadius: 6)
        if isHovered {
            NSColor(red: 0.15, green: 0.45, blue: 0.95, alpha: 0.9).setFill()
        } else {
            NSColor(red: 0.12, green: 0.38, blue: 0.85, alpha: 0.85).setFill()
        }
        bgPath.fill()

        let strokeColor = NSColor(white: 1.0, alpha: 0.2)
        strokeColor.setStroke()
        bgPath.lineWidth = 1.0
        bgPath.stroke()

        // Draw Icon and Text
        let text = "⤹ \(buttonLabel)" as NSString
        let attributes: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: 11, weight: .bold),
            .foregroundColor: NSColor.white
        ]
        let textSize = text.size(withAttributes: attributes)
        let textRect = NSRect(
            x: (bounds.width - textSize.width) / 2,
            y: (bounds.height - textSize.height) / 2,
            width: textSize.width,
            height: textSize.height
        )
        text.draw(in: textRect, withAttributes: attributes)
    }

    override func mouseDown(with event: NSEvent) {
        guard !notes.isEmpty else { return }
        guard let fileURL = MidiFileWriter.createMidiFile(for: notes, chordName: chordName) else { return }

        let draggingItem = NSDraggingItem(pasteboardWriter: fileURL as NSURL)
        draggingItem.setDraggingFrame(bounds, contents: snapshot())

        beginDraggingSession(with: [draggingItem], event: event, source: self)
    }

    func draggingSession(_ session: NSDraggingSession, sourceOperationMaskFor context: NSDraggingContext) -> NSDragOperation {
        return .copy
    }

    private func snapshot() -> NSImage {
        let image = NSImage(size: bounds.size)
        image.lockFocus()
        draw(bounds)
        image.unlockFocus()
        return image
    }
}
