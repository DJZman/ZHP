import Foundation
import AVFoundation
import MediaPlayer

/**
 * HardwareButtonModule (iOS)
 *
 * Detects Volume Up key presses via AVAudioSession outputVolume KVO.
 * Immediately resets volume to 0.5 after each change to suppress the
 * on-screen volume HUD and allow repeated presses.
 *
 * Emits "volumeButtonEvent" with value "down" (press) or "up" (release).
 * iOS doesn't expose key-up events for volume buttons, so we synthesize
 * "up" after a 200ms debounce.
 *
 * Usage:
 *   In AppDelegate.swift call HardwareButtonModule.shared.start()
 *   Or register via the standard RN bridge (see .m bridge file).
 */
@objc(HardwareButtonModule)
class HardwareButtonModule: RCTEventEmitter {

    private var lastVolume: Float = 0.5
    private var volumeView: MPVolumeView?
    private var releaseTimer: Timer?
    private var isObserving = false

    override static func requiresMainQueueSetup() -> Bool { true }

    override func supportedEvents() -> [String]! {
        return ["volumeButtonEvent"]
    }

    override func startObserving() {
        guard !isObserving else { return }
        isObserving = true

        let session = AVAudioSession.sharedInstance()
        try? session.setActive(true)

        // Hidden MPVolumeView is required for outputVolume KVO to work
        DispatchQueue.main.async {
            let vv = MPVolumeView(frame: CGRect(x: -200, y: -200, width: 0, height: 0))
            vv.alpha = 0.01
            UIApplication.shared.windows.first?.addSubview(vv)
            self.volumeView = vv
        }

        lastVolume = session.outputVolume
        session.addObserver(self, forKeyPath: "outputVolume", options: [.new], context: nil)
    }

    override func stopObserving() {
        guard isObserving else { return }
        isObserving = false
        AVAudioSession.sharedInstance().removeObserver(self, forKeyPath: "outputVolume")
        volumeView?.removeFromSuperview()
        volumeView = nil
    }

    override func observeValue(
        forKeyPath keyPath: String?,
        of object: Any?,
        change: [NSKeyValueChangeKey: Any]?,
        context: UnsafeMutableRawPointer?
    ) {
        guard keyPath == "outputVolume",
              let newVol = change?[.newKey] as? Float else { return }

        // Only fire on volume-up press
        if newVol > lastVolume {
            sendEvent(withName: "volumeButtonEvent", body: "down")

            // Reset to centre so next press is always detectable
            DispatchQueue.main.async {
                let slider = self.volumeView?.subviews.compactMap({ $0 as? UISlider }).first
                slider?.setValue(0.5, animated: false)
            }

            // Synthesise "up" after 200 ms (iOS has no key-up event)
            releaseTimer?.invalidate()
            releaseTimer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: false) { [weak self] _ in
                self?.sendEvent(withName: "volumeButtonEvent", body: "up")
            }
        }

        lastVolume = 0.5 // always reset tracked value
    }
}
