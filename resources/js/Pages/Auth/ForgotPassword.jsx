import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Recuperar Contraseña"
            subtitle="Ingresa tu correo y te enviaremos un enlace de restablecimiento"
        >
            <Head title="Recuperar Contraseña" />

            {status && (
                <div className="mb-4 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-md">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Correo Electrónico Registrado
                    </label>

                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoFocus
                        placeholder="tu@email.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-1.5 text-xs text-rose-400" />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="shadcn-btn-primary w-full py-2 text-xs tracking-wide uppercase font-semibold disabled:opacity-50"
                    >
                        {processing ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
                    </button>
                </div>

                <div className="pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400">
                    <Link
                        href={route('login')}
                        className="text-zinc-200 hover:text-white font-medium underline underline-offset-2 transition-colors"
                    >
                        ← Volver al Inicio de Sesión
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
