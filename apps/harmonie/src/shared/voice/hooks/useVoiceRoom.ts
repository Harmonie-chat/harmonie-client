import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type Participant } from 'livekit-client';
import { joinVoiceChannel } from '@/api/channels';
import { joinConversationVoiceCall } from '@/api/conversations';
import { useAudioInput } from '@/features/user/audio/AudioInputContext';
import { useAudioOutput } from '@/features/user/audio/AudioOutputContext';
import { useVideoInput, VIDEO_DEFAULT_DEVICE_ID } from '@/features/user/video/VideoInputContext';
import type {
  JoinVoiceResponse,
  VoiceCameraTrack,
  VoiceParticipantInit,
  VoiceScreenShare,
} from '@/types/voice';
import { buildIceServers, getJoinErrorKey, hasRelayServer } from '../voiceUtils';
import { playVoiceConnectSound } from '../voiceConnectSound';
import { playVoiceDisconnectSound } from '../voiceDisconnectSound';
import { publishScreenShareWithAudio } from '../screenSharePublishing';
import { useMicrophoneCaptureOptions } from './useMicrophoneCaptureOptions';
import { DEFAULT_PARTICIPANT_VOLUME, useParticipantVolumes } from './useParticipantVolumes';

interface UseVoiceRoomParams {
  seedParticipantsFromJoin: (
    kind: VoiceTargetKind,
    roomId: string,
    initial: VoiceParticipantInit[]
  ) => void;
  syncParticipantsFromRoom: (kind: VoiceTargetKind, roomId: string, room: Room) => void;
}

type VoiceTargetKind = 'channel' | 'conversation';

interface JoinVoiceTargetParams {
  kind: VoiceTargetKind;
  targetId: string;
  targetName?: string;
  guildId?: string;
  guildName?: string;
  join: () => Promise<JoinVoiceResponse>;
}

export const useVoiceRoom = ({
  seedParticipantsFromJoin,
  syncParticipantsFromRoom,
}: UseVoiceRoomParams) => {
  const {
    selectedDeviceId: selectedInputDeviceId,
    noiseReductionLevel,
    muted: inputMuted,
    setMuted: setInputMuted,
  } = useAudioInput();
  const { applySinkId, muted: outputMuted } = useAudioOutput();
  const { selectedDeviceId: selectedVideoInputDeviceId } = useVideoInput();

  const [activeTargetKind, setActiveTargetKind] = useState<VoiceTargetKind | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeChannelName, setActiveChannelName] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationName, setActiveConversationName] = useState<string | null>(null);
  const [activeGuildId, setActiveGuildId] = useState<string | null>(null);
  const [activeGuildName, setActiveGuildName] = useState<string | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [mutedUserIds, setMutedUserIds] = useState<Set<string>>(new Set());
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [speakingUserIds, setSpeakingUserIds] = useState<Set<string>>(new Set());
  const [screenShares, setScreenShares] = useState<VoiceScreenShare[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [cameraTracks, setCameraTracks] = useState<VoiceCameraTrack[]>([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const voiceRuntimeRef = useRef<{
    room: Room | null;
    pingInterval: ReturnType<typeof setInterval> | null;
  }>({ room: null, pingInterval: null });
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(null!);
  if (remoteAudioElementsRef.current === null) {
    remoteAudioElementsRef.current = new Map();
  }
  const outputMutedRef = useRef(outputMuted);
  const {
    participantVolumes,
    participantVolumesRef,
    getParticipantVolume,
    setParticipantVolume,
    toggleParticipantMute,
  } = useParticipantVolumes(remoteAudioElementsRef);
  const microphoneCaptureOptions = useMicrophoneCaptureOptions(
    selectedInputDeviceId,
    noiseReductionLevel
  );
  useEffect(() => {
    outputMutedRef.current = outputMuted;
  }, [outputMuted]);

  const upsertScreenShare = (screenShare: VoiceScreenShare) => {
    setScreenShares((prev) => {
      const existingIndex = prev.findIndex((share) => share.trackSid === screenShare.trackSid);
      if (existingIndex === -1) return [...prev, screenShare];

      const next = [...prev];
      next[existingIndex] = screenShare;
      return next;
    });
  };

  const removeScreenShare = (trackSid: string) => {
    setScreenShares((prev) => prev.filter((share) => share.trackSid !== trackSid));
  };

  const upsertCameraTrack = (cameraTrack: VoiceCameraTrack) => {
    setCameraTracks((prev) => {
      const existingIndex = prev.findIndex((track) => track.trackSid === cameraTrack.trackSid);
      if (existingIndex === -1) {
        return [
          ...prev.filter((track) => track.participantId !== cameraTrack.participantId),
          cameraTrack,
        ];
      }

      const next = [...prev];
      next[existingIndex] = cameraTrack;
      return next;
    });
  };

  const removeCameraTrack = (trackSid: string) => {
    setCameraTracks((prev) => prev.filter((track) => track.trackSid !== trackSid));
  };

  const setParticipantMuted = (participantId: string, muted: boolean) => {
    setMutedUserIds((prev) => {
      const next = new Set(prev);
      if (muted) {
        next.add(participantId);
      } else {
        next.delete(participantId);
      }
      return next;
    });
  };

  const syncMutedParticipantsFromRoom = (room: Room) => {
    const nextMutedUserIds = new Set<string>();
    if (!room.localParticipant.isMicrophoneEnabled) {
      nextMutedUserIds.add(room.localParticipant.identity);
    }
    room.remoteParticipants.forEach((participant) => {
      if (!participant.isMicrophoneEnabled) {
        nextMutedUserIds.add(participant.identity);
      }
    });
    setMutedUserIds(nextMutedUserIds);
  };

  const disconnectRoom = async () => {
    remoteAudioElementsRef.current.forEach((audioEl) => {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    });
    remoteAudioElementsRef.current.clear();

    if (voiceRuntimeRef.current.room) {
      await voiceRuntimeRef.current.room.disconnect();
      voiceRuntimeRef.current.room = null;
    }
    setActiveTargetKind(null);
    setActiveChannelId(null);
    setActiveChannelName(null);
    setActiveConversationId(null);
    setActiveConversationName(null);
    setActiveGuildId(null);
    setActiveGuildName(null);
    setPing(null);
    if (voiceRuntimeRef.current.pingInterval) {
      clearInterval(voiceRuntimeRef.current.pingInterval);
      voiceRuntimeRef.current.pingInterval = null;
    }
    setIsMuted(false);
    setMutedUserIds(new Set());
    setSpeakingUserIds(new Set());
    setScreenShares([]);
    setIsScreenSharing(false);
    setScreenShareError(null);
    setCameraTracks([]);
    setIsCameraEnabled(false);
    setCameraError(null);
  };

  const leaveCall = () => {
    if (voiceRuntimeRef.current.room) {
      playVoiceDisconnectSound(applySinkId, outputMutedRef.current);
    }
    void disconnectRoom();
  };

  const joinTarget = async ({
    kind,
    targetId,
    targetName,
    guildId,
    guildName,
    join,
  }: JoinVoiceTargetParams) => {
    setJoinError(null);
    setIsJoining(true);
    try {
      await disconnectRoom();

      const { token, url, iceServers, currentParticipants } = await join();
      if (currentParticipants && currentParticipants.length > 0) {
        seedParticipantsFromJoin(kind, targetId, currentParticipants);
      }
      const resolvedIceServers = buildIceServers(iceServers);

      if (resolvedIceServers && !hasRelayServer(resolvedIceServers)) {
        console.warn('[Voice] No TURN relay configured. ICE may fail on many production networks.');
      }

      const room = new Room();
      let shouldPlayRemoteConnectSound = false;
      let shouldPlayRemoteDisconnectSound = false;

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
          upsertScreenShare({
            participantId: participant.identity,
            trackSid: publication.trackSid,
            track,
            isLocal: false,
          });
          return;
        }

        if (track.kind === Track.Kind.Video && publication.source === Track.Source.Camera) {
          upsertCameraTrack({
            participantId: participant.identity,
            trackSid: publication.trackSid,
            track,
            isLocal: false,
          });
          return;
        }

        if (track.kind !== Track.Kind.Audio) return;

        const audioElement = track.attach() as HTMLAudioElement;
        audioElement.autoplay = true;
        audioElement.dataset.participantId = participant.identity;
        audioElement.dataset.trackSid = publication.trackSid;
        audioElement.muted = outputMutedRef.current;
        audioElement.volume =
          participantVolumesRef.current[participant.identity] ?? DEFAULT_PARTICIPANT_VOLUME;
        audioElement.style.display = 'none';
        applySinkId(audioElement);
        document.body.append(audioElement);
        remoteAudioElementsRef.current.set(publication.trackSid, audioElement);

        void audioElement.play().catch((error) => {
          console.error('[Voice] Failed to play remote audio track', {
            targetKind: kind,
            targetId,
            participantIdentity: participant.identity,
            trackSid: publication.trackSid,
            error,
          });
        });
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication) => {
        if (track.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
          removeScreenShare(publication.trackSid);
          return;
        }

        if (track.kind === Track.Kind.Video && publication.source === Track.Source.Camera) {
          removeCameraTrack(publication.trackSid);
          return;
        }

        if (track.kind !== Track.Kind.Audio) return;

        const audioElement = remoteAudioElementsRef.current.get(publication.trackSid);
        if (audioElement) {
          track.detach(audioElement);
          audioElement.remove();
          remoteAudioElementsRef.current.delete(publication.trackSid);
        }
      });

      room.on(RoomEvent.TrackSubscriptionFailed, (trackSid, participant, error) => {
        console.error('[Voice] Remote track subscription failed', {
          targetKind: kind,
          targetId,
          participantIdentity: participant.identity,
          trackSid,
          error,
        });
      });

      room.on(RoomEvent.TrackUnpublished, (publication) => {
        if (publication.source === Track.Source.ScreenShare) {
          removeScreenShare(publication.trackSid);
        }
        if (publication.source === Track.Source.Camera) {
          removeCameraTrack(publication.trackSid);
        }
      });

      room.on(RoomEvent.TrackMuted, (publication, participant) => {
        if (publication.source === Track.Source.Microphone) {
          setParticipantMuted(participant.identity, true);
          if (participant.isLocal) {
            setIsMuted(true);
          }
          return;
        }

        if (publication.source !== Track.Source.Camera) return;
        removeCameraTrack(publication.trackSid);
        if (participant.isLocal) {
          setIsCameraEnabled(false);
        }
      });

      room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        if (publication.source === Track.Source.Microphone) {
          setParticipantMuted(participant.identity, false);
          if (participant.isLocal) {
            setIsMuted(false);
          }
          return;
        }

        if (
          publication.source !== Track.Source.Camera ||
          publication.kind !== Track.Kind.Video ||
          !publication.track
        ) {
          return;
        }

        upsertCameraTrack({
          participantId: participant.identity,
          trackSid: publication.trackSid,
          track: publication.track as VoiceCameraTrack['track'],
          isLocal: participant.isLocal,
        });
        if (participant.isLocal) {
          setIsCameraEnabled(true);
          setCameraError(null);
        }
      });

      room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
        if (publication.kind !== Track.Kind.Video || !publication.track) {
          return;
        }

        if (publication.source === Track.Source.ScreenShare) {
          upsertScreenShare({
            participantId: participant.identity,
            trackSid: publication.trackSid,
            track: publication.track,
            isLocal: true,
          });
          setIsScreenSharing(true);
          setScreenShareError(null);
        }

        if (publication.source === Track.Source.Camera) {
          upsertCameraTrack({
            participantId: participant.identity,
            trackSid: publication.trackSid,
            track: publication.track,
            isLocal: true,
          });
          setIsCameraEnabled(true);
          setCameraError(null);
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.source === Track.Source.ScreenShare) {
          removeScreenShare(publication.trackSid);
          setIsScreenSharing(false);
        }
        if (publication.source === Track.Source.Camera) {
          removeCameraTrack(publication.trackSid);
          setIsCameraEnabled(false);
        }
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        syncParticipantsFromRoom(kind, targetId, room);
        syncMutedParticipantsFromRoom(room);
        if (shouldPlayRemoteConnectSound) {
          playVoiceConnectSound(applySinkId, outputMutedRef.current);
        }
      });
      room.on(RoomEvent.ParticipantDisconnected, () => {
        syncParticipantsFromRoom(kind, targetId, room);
        syncMutedParticipantsFromRoom(room);
        if (shouldPlayRemoteDisconnectSound) {
          playVoiceDisconnectSound(applySinkId, outputMutedRef.current);
        }
      });
      room.on(RoomEvent.Connected, () => {
        syncParticipantsFromRoom(kind, targetId, room);
        syncMutedParticipantsFromRoom(room);
      });
      room.on(RoomEvent.Reconnected, () => {
        syncParticipantsFromRoom(kind, targetId, room);
        syncMutedParticipantsFromRoom(room);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        setSpeakingUserIds(new Set(speakers.map((s) => s.identity)));
      });

      room.on(RoomEvent.SignalReconnecting, () => {
        console.warn('[Voice] Signal reconnecting', { targetKind: kind, targetId });
      });

      room.on(RoomEvent.Reconnecting, () => {
        console.warn('[Voice] Media reconnecting', { targetKind: kind, targetId });
      });

      room.on(RoomEvent.MediaDevicesError, (error) => {
        console.error('[Voice] Media device error', error);
      });

      room.on(RoomEvent.Disconnected, () => {
        setActiveTargetKind(null);
        setActiveChannelId(null);
        setActiveChannelName(null);
        setActiveConversationId(null);
        setActiveConversationName(null);
        setActiveGuildId(null);
        setActiveGuildName(null);
        setPing(null);
        if (voiceRuntimeRef.current.pingInterval) {
          clearInterval(voiceRuntimeRef.current.pingInterval);
          voiceRuntimeRef.current.pingInterval = null;
        }
        setIsMuted(false);
        setMutedUserIds(new Set());
        setScreenShares([]);
        setIsScreenSharing(false);
        setCameraTracks([]);
        setIsCameraEnabled(false);
        voiceRuntimeRef.current.room = null;
      });

      await room.connect(url, token, {
        ...(resolvedIceServers ? { rtcConfig: { iceServers: resolvedIceServers } } : {}),
        peerConnectionTimeout: 30000,
      });
      if (selectedVideoInputDeviceId && selectedVideoInputDeviceId !== VIDEO_DEFAULT_DEVICE_ID) {
        await room.switchActiveDevice('videoinput', selectedVideoInputDeviceId);
      }
      await room.localParticipant.setMicrophoneEnabled(!inputMuted, microphoneCaptureOptions);

      voiceRuntimeRef.current.room = room;
      setActiveTargetKind(kind);
      setActiveChannelId(kind === 'channel' ? targetId : null);
      setActiveChannelName(kind === 'channel' ? (targetName ?? null) : null);
      setActiveConversationId(kind === 'conversation' ? targetId : null);
      setActiveConversationName(kind === 'conversation' ? (targetName ?? null) : null);
      setActiveGuildId(kind === 'channel' ? (guildId ?? null) : null);
      setActiveGuildName(kind === 'channel' ? (guildName ?? null) : null);
      setIsMuted(inputMuted);
      setParticipantMuted(room.localParticipant.identity, inputMuted);
      shouldPlayRemoteConnectSound = true;
      shouldPlayRemoteDisconnectSound = true;
      playVoiceConnectSound(applySinkId, outputMutedRef.current);

      const measurePing = async () => {
        const report = await room.engine.pcManager?.publisher.getStats();
        if (!report) return;
        report.forEach((stat) => {
          if (
            stat.type === 'candidate-pair' &&
            stat.state === 'succeeded' &&
            stat.currentRoundTripTime != null
          ) {
            setPing(Math.round(stat.currentRoundTripTime * 1000));
          }
        });
      };
      void measurePing();
      voiceRuntimeRef.current.pingInterval = setInterval(() => void measurePing(), 3000);
    } catch (err) {
      console.error('[Voice] joinTarget failed:', err);
      setJoinError(getJoinErrorKey(err));
      await disconnectRoom();
    }
    setIsJoining(false);
  };

  const joinChannel = async (
    channelId: string,
    channelName?: string,
    guildId?: string,
    guildName?: string
  ) => {
    await joinTarget({
      kind: 'channel',
      targetId: channelId,
      targetName: channelName,
      guildId,
      guildName,
      join: () => joinVoiceChannel(channelId),
    });
  };

  const joinConversation = async (conversationId: string, conversationName?: string) => {
    await joinTarget({
      kind: 'conversation',
      targetId: conversationId,
      targetName: conversationName,
      join: () => joinConversationVoiceCall(conversationId),
    });
  };

  const toggleMute = () => {
    const room = voiceRuntimeRef.current.room;
    if (!room) return;
    const nextMuted = !isMuted;
    void room.localParticipant.setMicrophoneEnabled(!nextMuted, microphoneCaptureOptions);
    setInputMuted(nextMuted);
    setIsMuted(nextMuted);
    setParticipantMuted(room.localParticipant.identity, nextMuted);
  };

  const toggleScreenShare = async () => {
    const room = voiceRuntimeRef.current.room;
    if (!room) return;

    const nextEnabled = !isScreenSharing;
    setScreenShareError(null);

    try {
      let audioPublished = true;
      if (nextEnabled) {
        audioPublished = await publishScreenShareWithAudio(room);
      } else {
        await room.localParticipant.setScreenShareEnabled(false);
      }

      setIsScreenSharing(room.localParticipant.isScreenShareEnabled);
      if (nextEnabled && !audioPublished) {
        setScreenShareError('voice.screenShareAudioUnavailable');
      }
    } catch (error) {
      console.error('[Voice] Failed to toggle screen share', { error });
      setScreenShareError('voice.screenShareError');
      setIsScreenSharing(room.localParticipant.isScreenShareEnabled);
    }
  };

  const toggleCamera = async () => {
    const room = voiceRuntimeRef.current.room;
    if (!room) return;

    const nextEnabled = !isCameraEnabled;
    setCameraError(null);
    const cameraOptions =
      selectedVideoInputDeviceId === VIDEO_DEFAULT_DEVICE_ID
        ? undefined
        : { deviceId: { exact: selectedVideoInputDeviceId } };

    try {
      await room.localParticipant.setCameraEnabled(nextEnabled, cameraOptions);
      setIsCameraEnabled(room.localParticipant.isCameraEnabled);
      if (!room.localParticipant.isCameraEnabled) {
        const cameraPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (cameraPublication) {
          removeCameraTrack(cameraPublication.trackSid);
        }
      }
    } catch (error) {
      console.error('[Voice] Failed to toggle camera', { error });
      setCameraError('voice.cameraError');
      setIsCameraEnabled(room.localParticipant.isCameraEnabled);
    }
  };

  // Sync microphone capture constraints when the device or processing level changes
  useEffect(() => {
    const room = voiceRuntimeRef.current.room;
    if (!room) return;

    const microphonePublication = room.localParticipant.getTrackPublication(
      Track.Source.Microphone
    );

    if (microphonePublication?.audioTrack) {
      void microphonePublication.audioTrack
        .restartTrack(microphoneCaptureOptions)
        .catch((error) => {
          console.error('[Voice] Failed to update microphone capture options', {
            deviceId: selectedInputDeviceId,
            noiseReductionLevel,
            error,
          });
        });
      return;
    }

    void room
      .switchActiveDevice('audioinput', selectedInputDeviceId, selectedInputDeviceId !== 'default')
      .catch((error) => {
        console.error('[Voice] Failed to update inactive audio input device', {
          deviceId: selectedInputDeviceId,
          error,
        });
      });
  }, [microphoneCaptureOptions, noiseReductionLevel, selectedInputDeviceId]);

  // Sync camera input device when it changes
  useEffect(() => {
    const room = voiceRuntimeRef.current.room;
    if (!room) return;

    const exact = selectedVideoInputDeviceId !== VIDEO_DEFAULT_DEVICE_ID;
    void room.switchActiveDevice('videoinput', selectedVideoInputDeviceId, exact).catch((error) => {
      console.error('[Voice] Failed to switch camera input device', {
        deviceId: selectedVideoInputDeviceId,
        error,
      });
      setCameraError('voice.cameraError');
    });
  }, [selectedVideoInputDeviceId]);

  // Sync microphone mute state
  useEffect(() => {
    const room = voiceRuntimeRef.current.room;
    if (!room) return;
    void room.localParticipant
      .setMicrophoneEnabled(!inputMuted, microphoneCaptureOptions)
      .catch((error) => {
        console.error('[Voice] Failed to sync microphone mute state', { inputMuted, error });
      });
    setIsMuted(inputMuted);
    setMutedUserIds((prev) => {
      const next = new Set(prev);
      if (inputMuted) {
        next.add(room.localParticipant.identity);
      } else {
        next.delete(room.localParticipant.identity);
      }
      return next;
    });
  }, [inputMuted, microphoneCaptureOptions]);

  // Sync output mute state across all remote audio elements
  useEffect(() => {
    remoteAudioElementsRef.current.forEach((audioEl) => {
      audioEl.muted = outputMuted;
      applySinkId(audioEl);
    });
  }, [applySinkId, outputMuted]);

  // Cleanup on unmount
  useEffect(() => {
    const voiceRuntime = voiceRuntimeRef.current;
    const remoteAudioElements = remoteAudioElementsRef.current;
    return () => {
      remoteAudioElements.forEach((audioEl) => {
        audioEl.pause();
        audioEl.srcObject = null;
        audioEl.remove();
      });
      remoteAudioElements.clear();

      if (voiceRuntime.room) {
        void voiceRuntime.room.disconnect();
        voiceRuntime.room = null;
      }
      if (voiceRuntime.pingInterval) {
        clearInterval(voiceRuntime.pingInterval);
        voiceRuntime.pingInterval = null;
      }
    };
  }, []);

  const updateActiveChannelMeta = (channelName: string, guildName: string) => {
    setActiveChannelName(channelName);
    setActiveGuildName(guildName);
  };

  const updateActiveConversationMeta = (conversationName: string) => {
    setActiveConversationName(conversationName);
  };

  return {
    activeTargetKind,
    activeChannelId,
    activeChannelName,
    activeConversationId,
    activeConversationName,
    activeGuildId,
    activeGuildName,
    ping,
    updateActiveChannelMeta,
    updateActiveConversationMeta,
    isMuted,
    mutedUserIds,
    isJoining,
    joinError,
    speakingUserIds,
    screenShares,
    isScreenSharing,
    screenShareError,
    cameraTracks,
    isCameraEnabled,
    cameraError,
    participantVolumes,
    getParticipantVolume,
    setParticipantVolume,
    toggleParticipantMute,
    joinChannel,
    joinConversation,
    leaveChannel: leaveCall,
    leaveCall,
    toggleMute,
    toggleScreenShare,
    toggleCamera,
  };
};
