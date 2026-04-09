# PTT Walkie-Talkie App

A push-to-talk walkie-talkie app for iOS and Android.

## Architecture

**Fully P2P** — audio and video flow directly between devices via WebRTC.  
The signaling server's only job is to:
- Map users to socket IDs (presence/directory)
- Relay WebRTC offers/answers/ICE candidates
- Arbitrate PTT floor control (who is allowed to transmit)
- Relay call invites and push notifications

```
Device A ──[WebRTC audio/video]──▶ Device B
         ◀─────────────────────── Device B

Device A ──[Socket.io signaling]──▶ Server ──▶ Device B
         (offer/answer/ICE, floor, call invite)
```

## Features

- **Push-to-talk** — hold to transmit, release to listen
- **1-on-1 & group channels** — up to 6 people (mesh P2P)
- **Physical button support**
  - Volume Up key (Android: native KeyEvent intercept, iOS: AVAudioSession KVO)
  - Bluetooth PTT accessories (BLE HID)
  - Headset inline button
- **Phone contacts integration** — browse device contacts, see who's on the app
- **From any contact / PTT screen**: start Voice Call, Video Call, or Text message
- **Native call UI** — CallKit (iOS) and ConnectionService (Android) via react-native-callkeep

## Project Structure

```
ptt-app/
├── backend/          Node.js + Express + Socket.io + Prisma (signaling only)
└── mobile/           React Native bare workflow (iOS + Android)
```

## Quick Start

### 1. Backend

```bash
cd ptt-app/backend
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install
npm run db:generate         # prisma generate
npm run db:migrate          # prisma migrate dev
npm run dev                 # starts on port 3001
```

### 2. Mobile

```bash
cd ptt-app/mobile
npm install

# Android
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

### 3. Configuration

Edit `mobile/src/services/api.ts` and update `API_BASE` to point to your server.

## Environment

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing user JWTs |
| `PORT` | Server port (default 3001) |
| `TWILIO_*` | Optional: phone OTP verification |
| `FIREBASE_*` | Optional: push notifications |

## Key Files

| File | Purpose |
|---|---|
| `mobile/src/hooks/usePTT.ts` | PTT state machine + floor control |
| `mobile/src/hooks/useHardwareButton.ts` | Volume key + BT button events |
| `mobile/src/services/webrtc.ts` | P2P WebRTC peer connections |
| `mobile/src/services/socket.ts` | Socket.io client |
| `mobile/src/screens/ptt/PTTScreen.tsx` | Main walkie-talkie UI |
| `mobile/android/.../HardwareButtonModule.kt` | Android volume key interception |
| `mobile/ios/HardwareButton/HardwareButtonModule.swift` | iOS volume key KVO |
| `backend/src/socket/handlers/pttHandler.ts` | Server floor arbitration |
| `backend/src/socket/handlers/signalingHandler.ts` | WebRTC relay |
| `backend/prisma/schema.prisma` | Database schema |

## Android: MainActivity Integration

Add to `android/app/src/main/java/com/pttapp/MainActivity.kt`:

```kotlin
import android.view.KeyEvent
import com.pttapp.modules.HardwareButtonModule

override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (HardwareButtonModule.handleKeyEvent(event)) return true
    return super.dispatchKeyEvent(event)
}
```

And register the package in `MainApplication.kt`:

```kotlin
override fun getPackages() = PackageList(this).packages.apply {
    add(HardwareButtonPackage())
}
```

## iOS: AppDelegate Integration

In `AppDelegate.swift`, after the bridge is ready:

```swift
// HardwareButtonModule auto-starts when JS subscribes to "volumeButtonEvent"
```

No manual wiring needed — `startObserving()` is called automatically when the JS hook adds a listener.
