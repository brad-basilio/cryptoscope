import CryptoScopeLogo from '@/Components/CryptoScopeLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, title, subtitle }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#09090b] px-4 py-12 selection:bg-zinc-800 selection:text-white">
            {/* Header Brand */}
            <div className="mb-6 flex flex-col items-center text-center">
                <Link href="/screener" className="flex items-center gap-2.5 mb-3 group">
                    <CryptoScopeLogo className="w-9 h-9 border-zinc-700 bg-zinc-900 group-hover:border-zinc-500 transition-colors" />
                    <span className="font-semibold text-lg tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                        CryptoScope
                    </span>
                </Link>
                {title && (
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                        {title}
                    </h1>
                )}
                {subtitle && (
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Shadcn Card Container */}
            <div className="w-full max-w-md shadcn-card p-6 sm:p-8 bg-[#0c0c0e] border border-zinc-800 shadow-2xl">
                {children}
            </div>

            {/* Subtle Footer Link */}
            <div className="mt-8 text-xs text-zinc-500 flex items-center gap-2 font-mono">
                <Link href="/screener" className="hover:text-zinc-300 transition-colors">
                    ← Volver al Screener
                </Link>
            </div>
        </div>
    );
}
