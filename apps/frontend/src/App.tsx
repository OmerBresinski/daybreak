import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useEvents } from "@/hooks/useEvents";
import { useGmailWatch } from "@/hooks/useGmailWatch";
import { Calendar } from "@omerbres/react-simple-calendar";
import { Skeleton } from "@/ui/skeleton";
import { useMemo } from "react";

// Helper to map Google Calendar color IDs to hex codes or Tailwind classes
// These are standard Google Calendar colors
const GOOGLE_CALENDAR_COLORS: Record<string, string> = {
  "1": "#7986cb", // Lavender
  "2": "#33b679", // Sage
  "3": "#8e24aa", // Grape
  "4": "#e67c73", // Flamingo
  "5": "#f6c026", // Banana
  "6": "#f5511d", // Tangerine
  "7": "#039be5", // Peacock
  "8": "#616161", // Graphite
  "9": "#3f51b5", // Blueberry
  "10": "#0b8043", // Basil
  "11": "#d60000", // Tomato
};

// Fallback palette if no colorId is present
const FALLBACK_COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
];

function App() {
  const { data: events, isLoading, error } = useEvents();

  // Automatically set up Gmail watch when user signs in
  useGmailWatch();

  const formattedEvents = useMemo(() => {
    if (!events) return [];
    return events.map((event: any) => {
      // Ensure we have valid dates. If end date is missing, default to start + 1 hour
      const start = new Date(event.start || event.date);
      let end = new Date(event.end || event.start || event.date);

      if (end.getTime() === start.getTime()) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }

      // Determine color: use Google's colorId if available, otherwise hash title for a consistent fallback
      let color = event.color ? GOOGLE_CALENDAR_COLORS[event.color] : undefined;

      if (!color) {
        // Simple hash of the title to pick a consistent color from fallback palette
        const hash = (event.title || "")
          .split("")
          .reduce((acc: number, char: string) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
          }, 0);
        const index = Math.abs(hash) % FALLBACK_COLORS.length;
        color = FALLBACK_COLORS[index];
      }

      return {
        id: event.id,
        title: event.title || event.name || "Untitled Event",
        start,
        end,
        description: event.description,
        color,
      };
    });
  }, [events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">
          Here is your overview for the past month.
        </p>
      </div>

      <SignedIn>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Calendar Events (Past Month)
          </h2>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-[500px] w-full rounded-md border" />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">Error: {error.message}</p>
              <p className="mt-1 text-sm opacity-90">
                Make sure you've connected your Google account in your user
                settings and granted calendar access.
              </p>
            </div>
          )}

          {!isLoading && events && events.length === 0 && (
            <p className="text-muted-foreground">
              No calendar events found in the past month.
            </p>
          )}

          {!isLoading && formattedEvents.length > 0 && (
            <div className="h-[600px] w-full border rounded-md bg-background">
              <Calendar events={formattedEvents} />
            </div>
          )}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Please sign in to view events.
          </p>
        </div>
      </SignedOut>
    </div>
  );
}

export default App;
