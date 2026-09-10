import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AppLayout>
            <Head title="Mi Perfil" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
                        Ajustes de Perfil &amp; Seguridad
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Gestiona tus credenciales de acceso y preferencias de tu cuenta en CryptoScope.
                    </p>
                </div>

                <div className="shadcn-card p-6 border-zinc-800 bg-[#0c0c0e]">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="shadcn-card p-6 border-zinc-800 bg-[#0c0c0e]">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="shadcn-card p-6 border-zinc-800 bg-[#0c0c0e]">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AppLayout>
    );
}
