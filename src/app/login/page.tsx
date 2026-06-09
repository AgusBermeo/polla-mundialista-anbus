"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function syncUser() {
    await fetch("/api/users/sync", { method: "POST" });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    await syncUser(); // ← agrega esto
    router.push("/dashboard");
    router.refresh();
  }

  async function handleRegister() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError("Cuenta creada. Intenta iniciar sesión.");
      setLoading(false);
      return;
    }

    await syncUser(); // ← agrega esto
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <img
            src="/logo-anbu-futbol.png"
            alt="Anbus Logo"
            className="w-10"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-cyan-700">
          Polla Anbus Mundial 2026
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-700 text-gray-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-700 text-gray-500"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-cyan-700 text-white py-2 rounded-lg hover:bg-cyan-900 disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Iniciar sesión"}
          </button>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full border border-cyan-700 text-cyan-700 py-2 rounded-lg hover:bg-cyan-900 hover:text-white disabled:opacity-50"
          >
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
}