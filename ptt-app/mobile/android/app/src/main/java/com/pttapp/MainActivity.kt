package com.pttapp

import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.pttapp.modules.HardwareButtonModule

class MainActivity : ReactActivity() {

    /** The name registered by AppRegistry.registerComponent() in index.js */
    override fun getMainComponentName(): String = "PttApp"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    /**
     * Intercept volume-up key events before the system adjusts volume.
     * Returns true to consume the event (prevents volume HUD).
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (HardwareButtonModule.handleKeyEvent(event)) return true
        return super.dispatchKeyEvent(event)
    }
}
