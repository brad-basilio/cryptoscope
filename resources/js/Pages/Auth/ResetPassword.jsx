import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            title="Restablecer Contraseña"
            subtitle="Ingresa tus nuevas credenciales de acceso para tu cuenta"
        >
            <Head title="Restablecer Contraseña" />

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
                        className="shadcn-input w-full px-3 py-2 text-sm bg-zinc-950/60 opacity-80"
                        autoComplete="username"
                        readOnly
                    />

                    <InputError message={errors.email} className="mt-1.5 text-xs text-rose-400" />
                </div>

                <div>
                    <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Nueva Contraseña
                    </label>

                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="new-password"
                        autoFocus
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
                        Confirmar Nueva Contraseña
                    </label>

                    <input
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="new-password"
                        placeholder="Repite la nueva contraseña"
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
                        {processing ? 'Actualizando...' : 'Restablecer Contraseña'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
