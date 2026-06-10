package com.culpeos.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Culpeos"

  /**
   * react-native-screens (used by the navigation stack) requires Android to NOT restore the
   * fragment hierarchy from a saved instance state, or it crashes recreating native screens.
   * Passing null here lets React Native rebuild the view tree itself.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    rewriteShareIntent(intent)
    super.onCreate(null)
  }

  /**
   * Warm starts (the app is already running when a share arrives) deliver the intent here.
   * React Native only emits a JS `url` event for ACTION_VIEW intents that carry a Uri, so we
   * rewrite before delegating to super, which forwards the (now VIEW) intent to the Linking layer.
   */
  override fun onNewIntent(intent: Intent) {
    rewriteShareIntent(intent)
    super.onNewIntent(intent)
  }

  /**
   * Turns an incoming share (ACTION_SEND, text/plain) into a `culpeos://share?content=...`
   * VIEW intent in place. React Native's Linking module reads `intent.getData()` for both the
   * cold-start URL and warm `url` events, so this is all the bridging the JS side needs — no
   * native module required. The raw, messy shared text is percent-encoded and decoded back in JS.
   *
   * We combine EXTRA_SUBJECT and EXTRA_TEXT because some apps (notably Google Maps) put the
   * human-readable name in the subject and only a bare URL in the text. Prepending the subject
   * as its own line lets the backend's text parser pick up the name instead of falling back to
   * a generic title like "Google Maps Location".
   */
  private fun rewriteShareIntent(intent: Intent?) {
    if (intent == null || intent.action != Intent.ACTION_SEND) return
    val text = intent.getStringExtra(Intent.EXTRA_TEXT)
    val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT)
    // Temporary: surfaces the raw extras so a real Google Maps share can be inspected via
    // `adb logcat -s CulpeosShare` on a device with Play Services. Remove once verified.
    Log.i("CulpeosShare", "subject=$subject | text=$text")
    val shared = listOfNotNull(subject, text).joinToString("\n").ifEmpty { return }
    intent.action = Intent.ACTION_VIEW
    intent.data = Uri.parse("culpeos://share?content=" + Uri.encode(shared))
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
