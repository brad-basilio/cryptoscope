import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Iniciar Sesión"
            subtitle="Accede a tu portafolio privado, motor de riesgo y alertas autónomas"
        >
            <Head title="Iniciar Sesión" />

            {status && (
                <div className="mb-4 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-md">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Correo Electrónico
                    </label>

                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="username"
                        autoFocus
                        placeholder="tu@email.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-1.5 text-xs text-rose-400" />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-xs font-medium text-zinc-300">
                            Contraseña
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        )}
                    </div>

                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-1.5 text-xs text-rose-400" />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-700 focus:ring-offset-0 w-4 h-4"
                        />
                        <span className="ms-2 text-xs text-zinc-400">
                            Recordarme en este dispositivo
                        </span>
                    </label>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="shadcn-btn-primary w-full py-2 text-xs tracking-wide uppercase font-semibold disabled:opacity-50"
                    >
                        {processing ? 'Iniciando sesión...' : 'Entrar a CryptoScope'}
                    </button>
                </div>

                <div className="pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400">
                    <span>¿No tienes una cuenta? </span>
                    <Link
                        href={route('register')}
                        className="text-zinc-200 hover:text-white font-medium underline underline-offset-2 transition-colors"
                    >
                        Crear una cuenta gratis
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
