import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../SupabaseClient';

const initialFeedback = { type: '', message: '' };

export default function ResetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [checkingToken, setCheckingToken] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(initialFeedback);

    useEffect(() => {
        if (!router.isReady) {
            return;
        }

        let isMounted = true;

        const prepareRecoverySession = async () => {
            const code = typeof router.query.code === 'string' ? router.query.code : '';

            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);

                if (!isMounted) {
                    return;
                }

                if (error) {
                    setFeedback({
                        type: 'error',
                        message: 'Link invalido ou expirado. Solicite uma nova recuperacao de senha.',
                    });
                    setCheckingToken(false);
                    return;
                }
            }

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!isMounted) {
                return;
            }

            if (!session) {
                setFeedback({
                    type: 'error',
                    message: 'Nao encontramos uma sessao de recuperacao valida. Solicite um novo link.',
                });
            }

            setCheckingToken(false);
        };

        prepareRecoverySession();

        return () => {
            isMounted = false;
        };
    }, [router.isReady, router.query.code]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFeedback(initialFeedback);

        if (password !== confirmPassword) {
            setFeedback({
                type: 'error',
                message: 'As senhas nao conferem.',
            });
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) {
                throw error;
            }

            await supabase.auth.signOut();
            setFeedback({
                type: 'success',
                message: 'Senha atualizada com sucesso. Redirecionando para o login...',
            });

            setTimeout(() => {
                router.replace('/Login');
            }, 1200);
        } catch (err) {
            console.error(err);
            setFeedback({
                type: 'error',
                message: err?.message || 'Nao foi possivel atualizar sua senha.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Reset Password - Simapel</title>
            </Head>

            <div className="login-shell reset-shell">
                <section className="login-hero">
                <div className="hero-glow" />
                <div className="hero-content">
                    <h1>Crie uma nova senha segura.</h1>
                    <p>
                        O link recebido no email valida sua identidade e libera a troca de senha
                        diretamente pela API de autenticacao.
                    </p>
                </div>
                </section>

                <section className="login-panel">
                <div className="login-card">
                    <div className="login-brand">
                        <img src="/logo.png" alt="Logo Simapel" />
                        <span>Simapel</span>
                    </div>

                    <div className="login-heading">
                        <h2>Nova senha</h2>
                        <p>Digite e confirme sua nova senha para voltar ao sistema.</p>
                    </div>

                    {checkingToken ? (
                        <div className="form-feedback success">Validando link de recuperacao...</div>
                    ) : (
                        <form className="login-form" onSubmit={handleSubmit}>
                            <label className="field-group">
                                <span>Nova senha</span>
                                <div className="field-control">
                                    <Lock size={16} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-eye"
                                        onClick={() => setShowPassword((current) => !current)}
                                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </label>

                            <label className="field-group">
                                <span>Confirmar senha</span>
                                <div className="field-control">
                                    <Lock size={16} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </label>

                            {feedback.message && (
                                <div className={`form-feedback ${feedback.type}`}>
                                    {feedback.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="login-submit"
                                disabled={submitting}
                            >
                                {submitting ? 'Atualizando...' : 'Atualizar senha'}
                                <ArrowRight size={16} />
                            </button>
                        </form>
                    )}

                    {!checkingToken && feedback.message && !password && (
                        <div className={`form-feedback ${feedback.type}`}>
                            {feedback.message}
                        </div>
                    )}

                    <div className="login-switch">
                        <span>Ja atualizou sua senha?</span>
                        <button type="button" onClick={() => router.replace('/Login')}>
                            Voltar ao login
                        </button>
                    </div>

                    <div className="login-footer">
                        <span>recuperacao segura</span>
                        <div>
                            <ShieldCheck size={14} />
                            <Lock size={14} />
                        </div>
                    </div>
                </div>
                </section>
            </div>
        </>
    );
}
