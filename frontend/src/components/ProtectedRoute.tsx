import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export default function ProtectedRoute() {
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let active = true;
    let checkId = 0;

    async function verifyUser() {
      const currentCheck = ++checkId;
      if (active) setStatus("checking");

      try {
        // Supabase validates the user with the Auth server.
        // It can refresh an expired access token when possible.
        const { data, error } = await supabase.auth.getUser();

        if (!active || currentCheck !== checkId) return;

        if (error || !data.user) {
          await supabase.auth.signOut({ scope: "local" });

          if (active && currentCheck === checkId) {
            setStatus("unauthenticated");
          }
          return;
        }

        setStatus("authenticated");
      } catch {
        if (active && currentCheck === checkId) {
          setStatus("unauthenticated");
        }
      }
    }

    void verifyUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        ++checkId;
        setStatus("unauthenticated");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setTimeout(() => {
          if (active) void verifyUser();
        }, 0);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="login-page">
        <p>Validating your session...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
