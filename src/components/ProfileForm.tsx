"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [currentName, setCurrentName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: currentName }),
    });

    if (res.ok) {
      setMessage("✓ Perfil actualizado");
      router.refresh();
    } else {
      setMessage("Error al guardar");
    }

    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre
        </label>
        <input
          type="text"
          value={currentName}
          onChange={(e) => { setCurrentName(e.target.value); setMessage(""); }}
          placeholder="Tu nombre"
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full border rounded-lg px-4 py-2 bg-gray-50 text-gray-400"
        />
        <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
      </div>

      {message && (
        <p className={`text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || currentName.trim() === ""}
        className="w-full bg-cyan-700 text-white py-2 rounded-lg hover:bg-cyan-900 disabled:opacity-50 font-medium"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}