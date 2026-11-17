import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, LockKeyhole, Mail, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { apiRequest } from "../lib/api";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      // Confirm that Express accepts this session.
      await apiRequest("/api/auth/validate");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Layers size={26} />
          </div>
          <div>
            <h1>SPMS</h1>
            <p>Software Project Management System</p>
          </div>
        </div>

        <div className="login-divider" />

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to manage your projects and track your team's progress.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="login-email">Email address</label>
            <div className="login-input-wrapper">
              <Mail size={18} />
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrapper">
              <LockKeyhole size={18} />
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="login-footer">SPMS · SWE 4663 Group 7</div>
      </div>
    </main>
  );
}
