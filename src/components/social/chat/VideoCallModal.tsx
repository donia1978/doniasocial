import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ScreenShare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCallModalProps {
  open: boolean;
  onClose: () => void;
  participantName: string;
  isVideoCall: boolean;
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function VideoCallModal({
  open,
  onClose,
  participantName,
  isVideoCall,
  isIncoming = false,
  onAccept,
  onReject
}: VideoCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (open && !isIncoming) {
      startLocalStream();
      // Simulate connection after 2 seconds
      const timer = setTimeout(() => {
        setCallState('connected');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [open, isIncoming]);

  useEffect(() => {
    if (callState === 'connected') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callState]);

  useEffect(() => {
    return () => {
      stopLocalStream();
    };
  }, []);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true
      });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const stopLocalStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleEndCall = () => {
    stopLocalStream();
    setCallState('ended');
    onClose();
  };

  const handleAccept = () => {
    startLocalStream();
    setCallState('connected');
    onAccept?.();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleEndCall}>
      <DialogContent className={cn(
        "p-0 overflow-hidden bg-zinc-900 border-zinc-800",
        isFullscreen ? "max-w-full h-screen" : "max-w-2xl"
      )}>
        <div className={cn(
          "relative flex flex-col",
          isFullscreen ? "h-screen" : "aspect-video"
        )}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarFallback className="bg-primary">
                    {participantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{participantName}</p>
                  <p className="text-white/70 text-sm">
                    {callState === 'ringing' ? (
                      isIncoming ? "Appel entrant..." : "Appel en cours..."
                    ) : (
                      formatDuration(callDuration)
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 bg-zinc-800 flex items-center justify-center">
            {isVideoCall && callState === 'connected' ? (
              <>
                {/* Remote Video (placeholder) */}
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <Avatar className="h-32 w-32">
                    <AvatarFallback className="text-4xl bg-zinc-700">
                      {participantName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Local Video (small) */}
                <div className="absolute bottom-24 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/20 bg-zinc-900">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                      <VideoOff className="h-6 w-6 text-white/50" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32 border-4 border-white/20">
                  <AvatarFallback className="text-4xl bg-primary">
                    {participantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white/70">
                  {isIncoming ? "Appel entrant..." : "Connexion..."}
                </p>
                {isIncoming && callState === 'ringing' && (
                  <div className="flex gap-4 mt-4">
                    <Button
                      size="lg"
                      variant="destructive"
                      className="rounded-full h-14 w-14"
                      onClick={() => { onReject?.(); onClose(); }}
                    >
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                    <Button
                      size="lg"
                      className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600"
                      onClick={handleAccept}
                    >
                      {isVideoCall ? <Video className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          {(!isIncoming || callState === 'connected') && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full h-12 w-12",
                    isMuted ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {isVideoCall && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-full h-12 w-12",
                      !isVideoEnabled ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full h-12 w-12 bg-white/10 text-white hover:bg-white/20"
                  )}
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-12 w-12 bg-white/10 text-white hover:bg-white/20"
                >
                  <ScreenShare className="h-5 w-5" />
                </Button>

                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-14 w-14"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
