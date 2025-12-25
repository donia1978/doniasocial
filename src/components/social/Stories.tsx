import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Camera, Video, ChevronLeft, ChevronRight, Eye, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  views_count: number;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface GroupedStories {
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

export function Stories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedGroup, setSelectedGroup] = useState<GroupedStories | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);

  // Fetch stories
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles for each unique user
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(story => ({
        ...story,
        profile: profileMap.get(story.user_id) || { full_name: null, avatar_url: null }
      })) as Story[];
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  // Fetch viewed stories for current user
  const { data: viewedStoryIds = [] } = useQuery({
    queryKey: ["viewed-stories", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", user.id);
      return data?.map(v => v.story_id) || [];
    },
    enabled: !!user?.id
  });

  // Group stories by user
  const groupedStories: GroupedStories[] = stories.reduce((groups: GroupedStories[], story) => {
    const existingGroup = groups.find(g => g.user_id === story.user_id);
    if (existingGroup) {
      existingGroup.stories.push(story);
      if (!viewedStoryIds.includes(story.id)) {
        existingGroup.hasUnviewed = true;
      }
    } else {
      groups.push({
        user_id: story.user_id,
        profile: story.profile || { full_name: null, avatar_url: null },
        stories: [story],
        hasUnviewed: !viewedStoryIds.includes(story.id)
      });
    }
    return groups;
  }, []);

  // Get current user's stories
  const myStories = groupedStories.find(g => g.user_id === user?.id);

  // Upload story mutation
  const uploadStory = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption: string }) => {
      if (!user?.id) throw new Error("Non authentifié");
      
      setUploading(true);
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("stories")
        .getPublicUrl(fileName);
      
      // Create story record
      const { error: insertError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          caption: caption || null
        });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      setShowCreateDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      toast.success("Story publiée !");
    },
    onError: (error) => {
      toast.error("Erreur lors de la publication: " + error.message);
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  // Mark story as viewed
  const markAsViewed = useMutation({
    mutationFn: async (storyId: string) => {
      if (!user?.id) return;
      await supabase
        .from("story_views")
        .upsert({ story_id: storyId, viewer_id: user.id }, { onConflict: "story_id,viewer_id" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewed-stories"] });
    }
  });

  // Delete story mutation
  const deleteStory = useMutation({
    mutationFn: async (story: Story) => {
      if (!user?.id || story.user_id !== user.id) throw new Error("Non autorisé");
      
      // Delete from storage
      const fileName = story.media_url.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("stories")
          .remove([`${user.id}/${fileName}`]);
      }
      
      // Delete record
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", story.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      setSelectedGroup(null);
      toast.success("Story supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      toast.error("Type de fichier non supporté. Utilisez JPG, PNG, GIF, WebP, MP4 ou WebM.");
      return;
    }
    
    // Validate file size (50MB max)
    if (file.size > 52428800) {
      toast.error("Fichier trop volumineux. Maximum 50MB.");
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCreateDialog(true);
  };

  const handleCreateStory = () => {
    if (!selectedFile) return;
    uploadStory.mutate({ file: selectedFile, caption });
  };

  const openStoryViewer = (group: GroupedStories) => {
    setSelectedGroup(group);
    setCurrentStoryIndex(0);
    setStoryProgress(0);
    
    // Mark first story as viewed
    if (group.stories[0] && !viewedStoryIds.includes(group.stories[0].id)) {
      markAsViewed.mutate(group.stories[0].id);
    }
  };

  const goToNextStory = () => {
    if (!selectedGroup) return;
    
    if (currentStoryIndex < selectedGroup.stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      setStoryProgress(0);
      
      if (!viewedStoryIds.includes(selectedGroup.stories[nextIndex].id)) {
        markAsViewed.mutate(selectedGroup.stories[nextIndex].id);
      }
    } else {
      // Find next user's stories
      const currentGroupIndex = groupedStories.findIndex(g => g.user_id === selectedGroup.user_id);
      if (currentGroupIndex < groupedStories.length - 1) {
        const nextGroup = groupedStories[currentGroupIndex + 1];
        setSelectedGroup(nextGroup);
        setCurrentStoryIndex(0);
        setStoryProgress(0);
        
        if (!viewedStoryIds.includes(nextGroup.stories[0].id)) {
          markAsViewed.mutate(nextGroup.stories[0].id);
        }
      } else {
        setSelectedGroup(null);
      }
    }
  };

  const goToPrevStory = () => {
    if (!selectedGroup) return;
    
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setStoryProgress(0);
    } else {
      // Find previous user's stories
      const currentGroupIndex = groupedStories.findIndex(g => g.user_id === selectedGroup.user_id);
      if (currentGroupIndex > 0) {
        const prevGroup = groupedStories[currentGroupIndex - 1];
        setSelectedGroup(prevGroup);
        setCurrentStoryIndex(prevGroup.stories.length - 1);
        setStoryProgress(0);
      }
    }
  };

  const currentStory = selectedGroup?.stories[currentStoryIndex];

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30">
              {myStories?.stories[0]?.media_url ? (
                <AvatarImage src={myStories.stories[0].media_url} />
              ) : (
                <AvatarFallback className="bg-muted">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <Plus className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Ma story</span>
        </button>

        {/* My Stories (if any) */}
        {myStories && (
          <button
            onClick={() => openStoryViewer(myStories)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className={cn(
              "p-0.5 rounded-full",
              myStories.hasUnviewed 
                ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500"
                : "bg-muted-foreground/30"
            )}>
              <Avatar className="h-16 w-16 border-2 border-background">
                <AvatarImage src={myStories.profile.avatar_url || ""} />
                <AvatarFallback>
                  {myStories.profile.full_name?.charAt(0) || "M"}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[70px]">
              Mes stories ({myStories.stories.length})
            </span>
          </button>
        )}

        {/* Other Users' Stories */}
        {groupedStories
          .filter(g => g.user_id !== user?.id)
          .map((group) => (
            <button
              key={group.user_id}
              onClick={() => openStoryViewer(group)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className={cn(
                "p-0.5 rounded-full",
                group.hasUnviewed 
                  ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500"
                  : "bg-muted-foreground/30"
              )}>
                <Avatar className="h-16 w-16 border-2 border-background">
                  <AvatarImage src={group.profile.avatar_url || ""} />
                  <AvatarFallback>
                    {group.profile.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[70px]">
                {group.profile.full_name?.split(" ")[0] || "User"}
              </span>
            </button>
          ))}

        {isLoading && (
          <div className="flex items-center justify-center h-16 w-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Create Story Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une story</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewUrl && selectedFile && (
              <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden max-h-[400px]">
                {selectedFile.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
            
            <Textarea
              placeholder="Ajouter une légende (optionnel)..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setCaption("");
                }}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateStory}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publication...
                  </>
                ) : (
                  "Publier"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Viewer Modal */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-none">
          {currentStory && (
            <div className="relative aspect-[9/16] flex items-center justify-center">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                {selectedGroup?.stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-white transition-all duration-100",
                        idx < currentStoryIndex ? "w-full" : idx === currentStoryIndex ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-8 right-2 text-white hover:bg-white/20 z-20"
                onClick={() => setSelectedGroup(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Delete button (for own stories) */}
              {currentStory.user_id === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-8 right-12 text-white hover:bg-white/20 z-20"
                  onClick={() => deleteStory.mutate(currentStory)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
              
              {/* User info */}
              <div className="absolute top-8 left-2 flex items-center gap-2 z-20">
                <Avatar className="h-8 w-8 border border-white">
                  <AvatarImage src={selectedGroup?.profile.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-primary">
                    {selectedGroup?.profile.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-white text-sm font-medium">
                    {selectedGroup?.profile.full_name}
                  </span>
                  <p className="text-white/70 text-xs">
                    {new Date(currentStory.created_at).toLocaleTimeString("fr-FR", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </p>
                </div>
              </div>

              {/* Navigation areas */}
              <button
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                onClick={goToPrevStory}
              />
              <button
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                onClick={goToNextStory}
              />

              {/* Navigation arrows */}
              {currentStoryIndex > 0 || groupedStories.findIndex(g => g.user_id === selectedGroup?.user_id) > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-20"
                  onClick={goToPrevStory}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              ) : null}

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-20"
                onClick={goToNextStory}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              {/* Story content */}
              {currentStory.media_type === "video" ? (
                <video
                  src={currentStory.media_url}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  onEnded={goToNextStory}
                />
              ) : (
                <img
                  src={currentStory.media_url}
                  alt="Story"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Caption */}
              {currentStory.caption && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-3 z-20">
                  <p className="text-white text-sm">{currentStory.caption}</p>
                </div>
              )}

              {/* Views count (for own stories) */}
              {currentStory.user_id === user?.id && (
                <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white/70 z-20">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">{currentStory.views_count}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
