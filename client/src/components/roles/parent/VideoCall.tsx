import React, { useEffect, useState } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { Button } from '../../ui/Button';

interface VideoCallProps {
  callType: 'audio' | 'video';
  calleeName: string;
  onClose: () => void;
  socket?: {
    emit?: (event: string, payload?: unknown) => void;
  } | null;
  conversationId: string | null;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  callType,
  calleeName,
  onClose,
  socket,
  conversationId,
}) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(callType === 'video');

  useEffect(() => {
    socket?.emit?.('call_started', { conversationId, callType });

    return () => {
      socket?.emit?.('call_ended', { conversationId, callType });
    };
  }, [callType, conversationId, socket]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg bg-gray-950 p-6 text-white shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-teal-600 text-3xl font-semibold">
            {calleeName.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-semibold">{calleeName}</h2>
          <p className="mt-1 text-sm text-gray-300">
            {callType === 'video' ? 'Video call' : 'Audio call'} in progress
          </p>
        </div>

        {callType === 'video' && (
          <div className="mb-6 flex aspect-video items-center justify-center rounded-lg bg-gray-900">
            {cameraEnabled ? (
              <Video className="h-12 w-12 text-gray-400" />
            ) : (
              <VideoOff className="h-12 w-12 text-gray-400" />
            )}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMicEnabled((enabled) => !enabled)}
            className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
          >
            {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          {callType === 'video' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCameraEnabled((enabled) => !enabled)}
              className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
            >
              {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
          )}
          <Button type="button" variant="danger" onClick={onClose}>
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
