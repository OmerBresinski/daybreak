import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { useEvents } from "@/hooks/useEvents";

function App() {
  const { data: events, isLoading, error } = useEvents();

  return (
    <div>
      <header style={{ marginBottom: "2rem" }}>
        <SignedOut>
          <div style={{ display: "flex", gap: "1rem" }}>
            <SignInButton />
            <SignUpButton />
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>

      <h1>Welcome</h1>

      <SignedIn>
        <h2
          style={{ fontSize: "1.5em", marginTop: "2rem", marginBottom: "1rem" }}
        >
          Events
        </h2>

        {isLoading && <p>Loading events...</p>}

        {error && <p style={{ color: "#ff6b6b" }}>Error: {error.message}</p>}

        {events && (
          <div style={{ display: "grid", gap: "1rem" }}>
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: "1rem",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "8px",
                  border: "1px solid #3a3a3a",
                }}
              >
                <h3 style={{ marginBottom: "0.5rem", color: "#646cff" }}>
                  {event.name}
                </h3>
                <p style={{ color: "#888", margin: "0.25rem 0" }}>
                  Type: {event.type}
                </p>
                <p style={{ color: "#888", margin: "0.25rem 0" }}>
                  Date: {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </SignedIn>

      <SignedOut>
        <p style={{ marginTop: "2rem", color: "#888" }}>
          Please sign in to view events.
        </p>
      </SignedOut>
    </div>
  );
}

export default App;
