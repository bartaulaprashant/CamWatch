
import { useState } from "react";
import { Shield, LockKeyhole, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon">
            <Shield size={25} />
          </div>
          <div>
            <h2>CamWatch</h2>
            <span>SECURITY SYSTEM</span>
          </div>
        </div>

        <div className="login-heading">
          <span className="eyebrow">SECURE ACCESS</span>
          <h1>Welcome back.</h1>
          <p>Sign in to access your security dashboard.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="identifier">Username or email</label>
          <input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter your username or email"
            autoComplete="username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="login-security">
          <LockKeyhole size={14} />
          Protected by CamWatch session authentication
        </div>
      </div>
    </div>
  );
}
