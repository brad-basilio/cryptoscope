import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout
            title="Verifica tu Correo"
            subtitle="Por favor confirma tu dirección de correo electrónico para continuar"
        >
            <Head title="Verificación de Correo" />

            <div className="mb-4 text-xs text-zinc-400 leading-relaxed">
                ¡Gracias por registrarte! Antes de comenzar, por favor verifica tu correo electrónico haciendo clic en el enlace que te acabamos de enviar. Si no lo recibiste, con gusto te enviaremos otro.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-md">
                    Se ha enviado un nuevo enlace de verificación a la dirección de correo proporcionada.
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="shadcn-btn-primary py-2 px-4 text-xs tracking-wide uppercase font-semibold disabled:opacity-50"
                    >
                        {processing ? 'Reenviando...' : 'Reenviar Enlace'}
                    </button>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Cerrar Sesión
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
