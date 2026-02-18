# Lumen Transcribe - Android App

React Native mobile app with native Whisper transcription.

## Setup (Windows)

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. Copy environment variables from web app:
   ```bash
   copy .env.example .env
   ```
   Edit `.env` with Supabase credentials.

3. Generate native Android project:
   ```bash
   npx expo prebuild --platform android
   ```

4. Run on Android Emulator or device:
   ```bash
   npx expo run:android
   ```

## Requirements

- Node.js 18+
- Android Studio with Android SDK
- Java 17 (comes with Android Studio)
- Android Emulator or physical device with USB debugging

## Features

- 🎙️ **Audio Recording** - Record with waveform visualization
- 🧠 **Native Whisper** - Fast offline transcription (model downloads on first use ~140MB)
- ☁️ **Cloud Sync** - Shares data with web app via Supabase
- 🌙 **Dark Mode** - Beautiful dark UI

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx        # Navigation
│   ├── index.tsx          # Dashboard
│   ├── record.tsx         # Recording
│   └── meeting/[id].tsx   # Meeting detail
├── lib/
│   ├── whisper.ts         # Whisper transcription
│   └── supabase.ts        # Database client
└── app.json               # Android configuration
```
