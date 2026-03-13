import { useState, useCallback, useRef, useEffect } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

interface UseAgoraVoiceReturn {
  isJoined: boolean;
  isMuted: boolean;
  isRemoteUserJoined: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
  join: (channel: string, token?: string | null) => Promise<void>;
  leave: () => Promise<void>;
  toggleMute: () => Promise<void>;
  setVolume: (volume: number) => void;
}

export function useAgoraVoice(): UseAgoraVoiceReturn {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  const isRemoteUserJoined = remoteUsers.length > 0;

  // Initialize client
  useEffect(() => {
    if (typeof window === "undefined") return;

    clientRef.current = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });

    const client = clientRef.current;

    // Handle remote user events
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
      setRemoteUsers((prev) => {
        if (prev.find((u) => u.uid === user.uid)) return prev;
        return [...prev, user];
      });
    });

    client.on("user-unpublished", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    client.on("user-left", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    return () => {
      client.removeAllListeners();
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
      }
      client.leave();
    };
  }, []);

  const join = useCallback(
    async (channel: string, token: string | null = null) => {
      if (!clientRef.current || !APP_ID) {
        console.error("Agora client not initialized or APP_ID missing");
        return;
      }

      try {
        // Generate a random UID for anonymous connection
        const uid = Math.floor(Math.random() * 1000000);

        await clientRef.current.join(APP_ID, channel, token, uid);

        // Create and publish local audio track
        localAudioTrackRef.current =
          await AgoraRTC.createMicrophoneAudioTrack();
        await clientRef.current.publish([localAudioTrackRef.current]);

        setIsJoined(true);
      } catch (error) {
        console.error("Failed to join channel:", error);
        throw error;
      }
    },
    [],
  );

  const leave = useCallback(async () => {
    if (!clientRef.current) return;

    try {
      // Stop and close local audio track
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      await clientRef.current.leave();
      setIsJoined(false);
      setRemoteUsers([]);
      setIsMuted(false);
    } catch (error) {
      console.error("Failed to leave channel:", error);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    if (!localAudioTrackRef.current) return;

    const newMuteState = !isMuted;
    await localAudioTrackRef.current.setEnabled(!newMuteState);
    setIsMuted(newMuteState);
  }, [isMuted]);

  const setVolume = useCallback(
    (volume: number) => {
      // Set volume for all remote users (0-100)
      remoteUsers.forEach((user) => {
        user.audioTrack?.setVolume(volume);
      });
    },
    [remoteUsers],
  );

  return {
    isJoined,
    isMuted,
    isRemoteUserJoined,
    remoteUsers,
    join,
    leave,
    toggleMute,
    setVolume,
  };
}
