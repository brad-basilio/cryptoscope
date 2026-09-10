import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-100">
                    Actualizar Contraseña
                </h2>

                <p className="mt-1 text-xs text-zinc-400">
                    Asegúrate de que tu cuenta use una contraseña larga y aleatoria para mantener la máxima seguridad.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-4">
                <div>
                    <label
                        htmlFor="current_password"
                        className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                        Contraseña Actual
                    </label>

                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="current-password"
                        placeholder="••••••••"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-1.5 text-xs text-rose-400"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                        Nueva Contraseña
                    </label>

                    <input
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
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
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        autoComplete="new-password"
                        placeholder="Repite la nueva contraseña"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1.5 text-xs text-rose-400"
                    />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="shadcn-btn-primary px-4 py-2 text-xs tracking-wider uppercase font-semibold disabled:opacity-50"
                    >
                        {processing ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs font-mono text-emerald-400">
                            ✓ Contraseña actualizada correctamente.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
