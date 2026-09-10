import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title="Confirmar Contraseña"
            subtitle="Área de alta seguridad. Confirma tu contraseña antes de continuar"
        >
            <Head title="Confirmar Contraseña" />

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Contraseña de Seguridad
                    </label>

                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoFocus
                        placeholder="••••••••"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-1.5 text-xs text-rose-400" />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="shadcn-btn-primary w-full py-2 text-xs tracking-wide uppercase font-semibold disabled:opacity-50"
                    >
                        {processing ? 'Confirmando...' : 'Confirmar Contraseña'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
