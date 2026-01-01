import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface IncomingCallNotificationProps {
  callerName: string;
  isVideoCall: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallNotification({
  callerName,
  isVideoCall,
  onAccept,
  onReject
}: IncomingCallNotificationProps) {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    // Simulate ringtone pulse
    const interval = setInterval(() => {
      setIsRinging(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className={cn(
            "transition-transform duration-300",
            isRinging && "scale-110"
          )}>
            <Avatar className="h-14 w-14 ring-4 ring-primary/30">
              <AvatarFallback className="text-lg bg-primary">
                {callerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1">
            <p className="font-semibold">{callerName}</p>
            <p className="text-sm text-muted-foreground">
              {isVideoCall ? "Appel vidéo entrant..." : "Appel audio entrant..."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="icon"
              variant="destructive"
              className="rounded-full h-11 w-11"
              onClick={onReject}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="rounded-full h-11 w-11 bg-green-500 hover:bg-green-600"
              onClick={onAccept}
            >
              {isVideoCall ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
