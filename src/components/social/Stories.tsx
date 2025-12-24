import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
  viewed: boolean;
}

const mockStories: Story[] = [
  { id: "1", user_id: "1", profile: { full_name: "Dr. Ahmed", avatar_url: null }, viewed: false },
  { id: "2", user_id: "2", profile: { full_name: "Prof. Salma", avatar_url: null }, viewed: false },
  { id: "3", user_id: "3", profile: { full_name: "Dr. Karim", avatar_url: null }, viewed: true },
  { id: "4", user_id: "4", profile: { full_name: "Mme. Fatima", avatar_url: null }, viewed: true },
];

export function Stories() {
  const { user } = useAuth();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30">
              <AvatarFallback className="bg-muted">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Ma story</span>
        </div>

        {/* Other Stories */}
        {mockStories.map((story) => (
          <button
            key={story.id}
            onClick={() => setSelectedStory(story)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className={cn(
              "p-0.5 rounded-full",
              story.viewed 
                ? "bg-muted-foreground/30" 
                : "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500"
            )}>
              <Avatar className="h-16 w-16 border-2 border-background">
                <AvatarImage src={story.profile.avatar_url || ""} />
                <AvatarFallback>
                  {story.profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[70px]">
              {story.profile.full_name?.split(" ")[0] || "User"}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black">
          <div className="relative aspect-[9/16] flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setSelectedStory(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <Avatar className="h-8 w-8 border border-white">
                <AvatarImage src={selectedStory?.profile.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-primary">
                  {selectedStory?.profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-medium">
                {selectedStory?.profile.full_name}
              </span>
            </div>

            <div className="text-white text-center p-8">
              <p className="text-lg">Story de {selectedStory?.profile.full_name}</p>
              <p className="text-sm text-white/70 mt-2">Contenu de la story...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
