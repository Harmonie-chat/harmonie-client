# Shared Voice Feature

This folder contains the shared voice experience for Harmonie. It is used by guild voice channels and private/group conversation calls.

It handles joining a LiveKit room, rendering connected participants, showing active speakers, screen sharing, camera tracks, pinning, fullscreen screen shares, participant volume, and the persistent voice connection bar.

## Folder Structure

```text
voice/
├── VoiceChannelView.tsx
├── VoiceConnectionBar.tsx
├── screenSharePublishing.ts
├── voiceConnectSound.ts
├── voiceDisconnectSound.ts
├── voiceUtils.ts
├── components/
├── context/
├── hooks/
└── layout/
```

## Responsibilities

### `VoiceChannelView.tsx`

Route-level view for a voice channel.

It gathers route params, channel metadata, guild metadata, current user data, theme state, and voice presence state. It decides whether to show the join prompt or the active voice stage.

Keep this file focused on orchestration. Avoid putting low-level LiveKit logic or large layout sections here.

### `VoiceConnectionBar.tsx`

Small persistent connection bar shown outside the active voice view while the user is connected to a voice room.

It displays connection state, ping, the current channel or conversation label, and the leave button.

### `components/`

Small UI pieces used by the voice feature.

- `ScreenShareTile.tsx`: renders a local or remote screen share track, with pin and fullscreen controls.
- `VoiceParticipantTile.tsx`: renders a participant card, including avatar, camera video, mute state, speaking state, pin control, and participant volume control.
- `VoiceCallControls.tsx`: renders microphone, camera, screen share, and leave controls.
- `VoiceJoinPrompt.tsx`: renders the pre-join state for a voice channel.

These components should stay presentational. They can handle local DOM behavior, such as attaching a video track or toggling fullscreen, but should not own room-level state.

### `layout/`

Layout composition for the active call.

- `VoiceActiveStage.tsx`: arranges participants and screen shares in the active call. It handles the pinned stage, thumbnail strip, screen share grid, and participant rows.
- `voiceLayout.ts`: pure layout helpers and shared view data types, including participant card mapping, row calculation, card sizing, and pin target ids.

### `hooks/`

React hooks that own the voice plumbing.

- `useVoiceRoom.ts`: owns the LiveKit room lifecycle, active target metadata, mute/camera/screen-share state, remote audio elements, active speakers, ping measurement, and room event wiring.
- `useVoiceParticipants.ts`: owns participant presence, combining SignalR events, join-response snapshots, profile updates, and LiveKit room state.
- `useMicrophoneCaptureOptions.ts`: builds LiveKit microphone capture options from the selected input device and noise reduction setting.
- `useParticipantVolumes.ts`: stores participant volume preferences, persists them in local storage, and applies them to remote audio elements.

`useVoiceRoom.ts` is still the main room lifecycle hook. Keep newly added device, media publishing, or persistence helpers outside of it when they can be isolated without changing the room event flow.

### `context/`

Shared voice state for the app.

- `VoicePresenceContext.tsx`: combines participant presence and room state, then exposes a single API for joining, leaving, muting, camera toggling, screen sharing, participant lookup, and active target metadata.

### Root Helpers

- `screenSharePublishing.ts`: captures and publishes screen share video plus optional system/window audio using `getDisplayMedia`.
- `voiceConnectSound.ts` and `voiceDisconnectSound.ts`: generate and play local feedback sounds for voice room join/leave and remote participant changes.
- `voiceUtils.ts`: shared utility helpers for ICE server resolution and join error mapping.

## Data Flow

1. `VoiceChannelView` is mounted for `/voice/:channelId`.
2. It calls `joinChannel` from `useVoicePresence` when the user is not already active in that channel.
3. `useVoiceRoom` calls the backend join endpoint, connects to LiveKit, enables the microphone, and listens for room events.
4. `useVoiceParticipants` keeps participant metadata in sync from the join response, SignalR events, LiveKit room state, and profile update events.
5. Camera and screen share tracks are collected in `useVoiceRoom` and exposed through `VoicePresenceContext`.
6. `VoiceActiveStage` renders screen shares and participants, defaulting the first screen share to the large pinned stage.

For conversation calls, the feature entry point lives under `features/conversation`, but it consumes the same `VoicePresenceContext`, `VoiceActiveStage`, controls, participant cards, and room lifecycle.

## Screen Sharing

Screen sharing is published through `screenSharePublishing.ts` so the app can request screen audio hints alongside the video track.

Remote and local screen share video tracks are exposed as `VoiceScreenShare` items. The UI attaches each track inside `ScreenShareTile`.

By default, the first available screen share is shown in the large stage. Users can pin another participant or screen share, or unpin the current item to return to the grid layout.

If the browser does not provide an audio track for the share, the video share still starts and `voice.screenShareAudioUnavailable` is exposed through `screenShareError`.

## Participant Volume

Remote participant audio elements are created in `useVoiceRoom` when audio tracks are subscribed. Per-participant volume values are owned by `useParticipantVolumes`, persisted in local storage, and applied to matching audio elements through their `data-participant-id`.

The current user cannot adjust their own participant volume in the UI.
