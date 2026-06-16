export default function DashboardFooter() {
  return (
    <footer className="hidden lg:block border-t border-gray-200 bg-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Mundial FIFA 2026 · Solo para uso interno de los Anbus
        </span>
        <a
          href="/coffee"
          className="flex items-center gap-1.5 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 px-3 py-1.5 rounded-full transition-colors duration-200"
        >
          <span>☕</span>
          <span>Buy me a coffee</span>
        </a>
      </div>
    </footer>
  );
}