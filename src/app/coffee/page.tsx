import { CopyButton } from "@/components/CoffeeClient";

export default function CoffeePage() {
  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🍺</div>
          <h1 className="text-2xl font-bold text-cyan-700 bowlby-one tracking-wide mb-1">
            Invítame una cerveza
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Si disfrutas la polla, puedes apoyarme con una transferencia. ¡Gracias!
          </p>
        </div>

        {/* Bank transfer card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-700 text-sm">Transferencia bancaria</h2>
          </div>

          <div className="space-y-1">
            <Row label="Nombre"  value="Agustín Bermeo" />
            <Row label="Cédula"  value="1718387366" />
            <Row label="Banco"   value="Banco Pichincha" />
            <Row label="Tipo"    value="Cuenta de Ahorros" />
            <Row label="Número"  value="5983409900" copyable />
          </div>
        </div>

        {/* PayPal button */}
        {/*
        <a
          href="https://www.paypal.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full bg-[#0070ba] hover:bg-[#005ea6] active:bg-[#004f99] text-white font-semibold text-sm py-3.5 rounded-2xl transition-colors duration-200 shadow-sm mb-6"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .92-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.773-4.471z"/>
          </svg>
          Pagar con PayPal
        </a>
        */}

        {/* Back link */}
        <div className="text-center">
          <a
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-cyan-700 font-medium transition-colors"
          >
            ← Volver
          </a>
        </div>

      </div>
    </div>
  );
}

function Row({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm font-semibold text-gray-700 truncate">{value}</span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}