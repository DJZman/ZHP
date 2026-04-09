package com.pttapp.modules

import android.view.KeyEvent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native module that captures volume key events from MainActivity
 * and emits them as "volumeButtonEvent" JS events.
 *
 * In MainActivity.kt add:
 *
 *   override fun dispatchKeyEvent(event: KeyEvent): Boolean {
 *     if (HardwareButtonModule.handleKeyEvent(event)) return true
 *     return super.dispatchKeyEvent(event)
 *   }
 *
 * This consumes the event so volume does NOT change.
 */
class HardwareButtonModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var instance: HardwareButtonModule? = null

        fun handleKeyEvent(event: KeyEvent): Boolean {
            if (event.keyCode != KeyEvent.KEYCODE_VOLUME_UP) return false

            val action = if (event.action == KeyEvent.ACTION_DOWN) "down" else "up"
            instance?.emit(action)
            return true // consume — prevents system volume HUD
        }
    }

    override fun getName() = "HardwareButtonModule"

    override fun initialize() {
        super.initialize()
        instance = this
    }

    override fun invalidate() {
        instance = null
        super.invalidate()
    }

    private fun emit(action: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("volumeButtonEvent", action)
    }

    @ReactMethod
    fun addListener(eventName: String) { /* required by RN */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* required by RN */ }
}
