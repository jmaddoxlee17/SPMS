import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { supabase } from "../../lib/supabase";

import "./LogoutButton.css";

export default function LogoutButton() {
  const navigate = useNavigate();

  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    if (signingOut) return;

    setSigningOut(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signOut();

      if (authError) {
        throw authError;
      }

      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="logout-container">
      <button
        type="button"
        className="logout-button"
        onClick={handleLogout}
        disabled={signingOut}
        aria-label="Sign out of SPMS"
      >
        <LogOut size={16} />

        <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
      </button>

      {error && (
        <div className="logout-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
