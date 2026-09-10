import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-400">
                    Eliminar Cuenta
                </h2>

                <p className="mt-1 text-xs text-zinc-400">
                    Una vez eliminada tu cuenta, todos tus recursos, portafolios y alertas configuradas serán eliminados de manera permanente. Antes de continuar, asegúrate de respaldar cualquier información relevante.
                </p>
            </header>

            <button
                type="button"
                onClick={confirmUserDeletion}
                className="px-4 py-2 rounded-md bg-rose-950/50 text-rose-300 border border-rose-800/80 hover:bg-rose-900/60 hover:text-rose-100 transition-colors text-xs font-semibold uppercase tracking-wider"
            >
                Eliminar Cuenta Permanentemente
            </button>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6 bg-[#0c0c0e] text-zinc-100">
                    <h2 className="text-base font-semibold text-zinc-100">
                        ¿Estás seguro de que deseas eliminar tu cuenta?
                    </h2>

                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                        Esta acción no se puede deshacer. Todos los datos asociados a tu perfil serán borrados inmediatamente. Por favor ingresa tu contraseña para confirmar la eliminación definitiva.
                    </p>

                    <div className="mt-5">
                        <label
                            htmlFor="password"
                            className="block text-xs font-medium text-zinc-300 mb-1.5"
                        >
                            Contraseña de Confirmación
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="shadcn-input w-full px-3 py-2 text-sm"
                            autoFocus
                            placeholder="Introduce tu contraseña"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-1.5 text-xs text-rose-400"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="shadcn-btn-secondary px-4 py-2 text-xs font-medium"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Eliminando...' : 'Sí, Eliminar Cuenta'}
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
