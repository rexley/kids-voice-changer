# Voice Lab — Kids' Voice Changer

A self-contained, static browser voice changer built with plain HTML, CSS, and JavaScript. No backend, frameworks, packages, or API keys are required.

## Features

- Browser microphone recording via `MediaRecorder`
- 12 voice presets: Normal, Chipmunk, Giant, Robot, Alien, Monster, Ghost, Old Radio, Underwater, Superhero, Tiny Bot, and Echo Cave
- Manual pitch/speed, echo, and robot controls
- Live microphone level meter
- Fun phrase generator
- Original-vs-changed playback
- Download the changed voice as a WAV file
- No server upload; audio stays in the browser
- Responsive layout for desktop, tablet, and phone

## Deploy to GitHub Pages

This repository is ready to deploy directly from the `main` branch with no build step.

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/ (root)**, then save.
4. Once GitHub finishes publishing, the app should be available at:
   `https://rexley.github.io/kids-voice-changer/`

GitHub Pages uses HTTPS, which is important because browsers generally require a secure context for microphone access.

## Privacy

Voice Lab does not contain analytics, ads, external libraries, or network calls. Recorded audio is processed locally using the Web Audio API.

## Technical note

The pitch effects use playback-rate changes. That means very high or low voices also play somewhat faster or slower. More advanced pitch shifting without duration changes would require a larger DSP library or custom algorithm.
