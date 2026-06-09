"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Tab = "login" | "register";

export default function LoginPage() {
  const [tab, setTab]           = useState<Tab>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState("");
  const router = useRouter();
  const supabase = createClient();

  function resetForm() {
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
  }

  function switchTab(t: Tab) {
    setTab(t);
    resetForm();
  }

  async function syncUser() {
    await fetch("/api/users/sync", { method: "POST" });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos. Verifica tus datos e intenta de nuevo.");
      setLoading(false);
      return;
    }

    await syncUser();
    router.push("/dashboard");
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setSuccess("¡Cuenta creada! Ahora puedes iniciar sesión.");
      setLoading(false);
      switchTab("login");
      return;
    }

    await syncUser();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200 px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
              <img
                src="/logo-anbu-futbol.png"
                alt="Anbus Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-cyan-700 bowlby-one tracking-wide">
            Polla Anbus 2026
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pronostica. Compite. Gana.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => switchTab("login")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                tab === "login"
                  ? "text-cyan-700 border-b-2 border-cyan-700 bg-cyan-50/40"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => switchTab("register")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                tab === "register"
                  ? "text-cyan-700 border-b-2 border-cyan-700 bg-cyan-50/40"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Registrarse
            </button>
          </div>

          <div className="p-6">

            {/* Register instructions */}
            {tab === "register" && (
              <div className="mb-5 bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide mb-2">
                  ¿Cómo unirme?
                </p>
                <ol className="space-y-1.5">
                  {[
                    "Ingresa tu email y elige una contraseña.",
                    "Haz clic en \"Crear cuenta\" para registrarte.",
                    "¡Listo! Entra al dashboard y empieza a pronosticar.",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-cyan-800">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[9px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Login instructions */}
            {tab === "login" && (
              <div className="mb-5 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Acceso
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Usa el email y contraseña con los que te registraste. Si aún no tienes cuenta, ve a la pestaña{" "}
                  <button
                    onClick={() => switchTab("register")}
                    className="text-cyan-600 font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    Registrarse
                  </button>
                  .
                </p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-green-700 font-medium">{success}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-700 placeholder-gray-300 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Contraseña
                  {tab === "register" && (
                    <span className="text-gray-400 font-normal ml-1">(mínimo 6 caracteres)</span>
                  )}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-700 placeholder-gray-300 transition-shadow"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <svg className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-cyan-800 disabled:opacity-50 transition-colors mt-1 cursor-pointer"
              >
                {loading
                  ? "Cargando..."
                  : tab === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
              </button>
            </form>

            {/* Footer switch */}
            <p className="text-center text-xs text-gray-400 mt-4">
              {tab === "login" ? (
                <>
                  ¿Primera vez aquí?{" "}
                  <button
                    onClick={() => switchTab("register")}
                    className="text-cyan-600 font-semibold hover:underline cursor-pointer"
                  >
                    Crea tu cuenta
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <button
                    onClick={() => switchTab("login")}
                    className="text-cyan-600 font-semibold hover:underline cursor-pointer"
                  >
                    Inicia sesión
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Mundial FIFA 2026 · Solo para uso interno del grupo Anbus
        </p>
      </div>
    </div>
  );
}