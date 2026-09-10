import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            title="Crear Cuenta"
            subtitle="Regístrate para asegurar tu portafolio personal y configurar alertas"
        >
            <Head title="Crear Cuenta" />

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Nombre Completo o Alias
                    </label>

                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={data.name}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="name"
                        autoFocus
                        placeholder="Ej. Satoshi Nakamoto"
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-1.5 text-xs text-rose-400" />
                </div>

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
                        placeholder="tu@email.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-1.5 text-xs text-rose-400" />
                </div>

                <div>
                    <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Contraseña
                    </label>

                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-1.5 text-xs text-rose-400" />
                </div>

                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                        Confirmar Contraseña
                    </label>

                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="new-password"
                        placeholder="Repite tu contraseña"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1.5 text-xs text-rose-400"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="shadcn-btn-primary w-full py-2 text-xs tracking-wide uppercase font-semibold disabled:opacity-50"
                    >
                        {processing ? 'Creando cuenta...' : 'Registrarse en CryptoScope'}
                    </button>
                </div>

                <div className="pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400">
                    <span>¿Ya tienes una cuenta registrada? </span>
                    <Link
                        href={route('login')}
                        className="text-zinc-200 hover:text-white font-medium underline underline-offset-2 transition-colors"
                    >
                        Iniciar Sesión
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
