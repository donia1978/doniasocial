import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Search, 
  User, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Bell,
  LayoutDashboard,
  GraduationCap,
  Stethoscope,
  BarChart3,
  Users,
  Settings
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'user' | 'course' | 'event' | 'page';
  url: string;
  icon: typeof User;
}

const PAGES: SearchResult[] = [
  { id: 'dashboard', title: 'Tableau de bord', type: 'page', url: '/dashboard', icon: LayoutDashboard },
  { id: 'education', title: 'Éducation', type: 'page', url: '/dashboard/education', icon: GraduationCap },
  { id: 'medical', title: 'Médical', type: 'page', url: '/dashboard/medical', icon: Stethoscope },
  { id: 'agenda', title: 'Agenda', type: 'page', url: '/dashboard/agenda', icon: Calendar },
  { id: 'courses', title: 'Cours en ligne', type: 'page', url: '/dashboard/courses', icon: BookOpen },
  { id: 'chat', title: 'Messagerie', type: 'page', url: '/dashboard/chat', icon: MessageSquare },
  { id: 'notifications', title: 'Notifications', type: 'page', url: '/dashboard/notifications', icon: Bell },
  { id: 'users', title: 'Gestion des utilisateurs', type: 'page', url: '/dashboard/users', icon: Users },
  { id: 'analytics', title: 'Analytiques', type: 'page', url: '/dashboard/analytics', icon: BarChart3 },
  { id: 'settings', title: 'Paramètres', type: 'page', url: '/dashboard/settings', icon: Settings },
];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchResult[]>([]);
  const [courses, setCourses] = useState<SearchResult[]>([]);
  const [events, setEvents] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchData = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setUsers([]);
      setCourses([]);
      setEvents([]);
      return;
    }

    setLoading(true);

    const [usersRes, coursesRes, eventsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5),
      supabase
        .from('courses')
        .select('id, title, description')
        .ilike('title', `%${searchQuery}%`)
        .eq('is_published', true)
        .limit(5),
      user ? supabase
        .from('events')
        .select('id, title, start_date')
        .eq('user_id', user.id)
        .ilike('title', `%${searchQuery}%`)
        .limit(5) : Promise.resolve({ data: [] }),
    ]);

    if (usersRes.data) {
      setUsers(usersRes.data.map(u => ({
        id: u.id,
        title: u.full_name || u.email || 'Utilisateur',
        description: u.email || undefined,
        type: 'user' as const,
        url: '/dashboard/users',
        icon: User,
      })));
    }

    if (coursesRes.data) {
      setCourses(coursesRes.data.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description?.slice(0, 50) || undefined,
        type: 'course' as const,
        url: '/dashboard/courses',
        icon: BookOpen,
      })));
    }

    if (eventsRes.data) {
      setEvents(eventsRes.data.map(e => ({
        id: e.id,
        title: e.title,
        description: new Date(e.start_date).toLocaleDateString('fr-FR'),
        type: 'event' as const,
        url: '/dashboard/agenda',
        icon: Calendar,
      })));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchData(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchData]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(url);
  };

  const filteredPages = PAGES.filter(page => 
    page.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Rechercher des pages, utilisateurs, cours..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Recherche en cours..." : "Aucun résultat trouvé."}
        </CommandEmpty>

        {filteredPages.length > 0 && (
          <CommandGroup heading="Pages">
            {filteredPages.map((page) => (
              <CommandItem
                key={page.id}
                value={page.title}
                onSelect={() => handleSelect(page.url)}
                className="cursor-pointer"
              >
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {users.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Utilisateurs">
              {users.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result.url)}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground">{result.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {courses.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Cours">
              {courses.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result.url)}
                  className="cursor-pointer"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground">{result.description}...</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {events.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Événements">
              {events.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result.url)}
                  className="cursor-pointer"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground">{result.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
