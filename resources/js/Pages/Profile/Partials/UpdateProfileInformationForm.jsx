import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-100">
                    Información de Perfil
                </h2>

                <p className="mt-1 text-xs text-zinc-400">
                    Actualiza los datos personales de tu cuenta y dirección de correo electrónico.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="name" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Nombre Completo o Alias
                    </label>

                    <input
                        id="name"
                        type="text"
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoFocus
                        autoComplete="name"
                    />

                    <InputError className="mt-1.5 text-xs text-rose-400" message={errors.name} />
                </div>

                <div>
                    <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Correo Electrónico
                    </label>

                    <input
                        id="email"
                        type="email"
                        className="shadcn-input w-full px-3 py-2 text-sm"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-1.5 text-xs text-rose-400" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="p-3 rounded-md bg-amber-950/30 border border-amber-800/60 text-xs">
                        <p className="text-amber-300">
                            Tu dirección de correo electrónico aún no ha sido verificada.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="underline hover:text-white transition-colors"
                            >
                                Haz clic aquí para reenviar el correo de verificación.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 font-mono text-emerald-400">
                                Se ha enviado un nuevo enlace de verificación a tu correo.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="shadcn-btn-primary px-4 py-2 text-xs tracking-wider uppercase font-semibold disabled:opacity-50"
                    >
                        {processing ? 'Guardando...' : 'Guardar Cambios'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs font-mono text-emerald-400">
                            ✓ Guardado correctamente.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
