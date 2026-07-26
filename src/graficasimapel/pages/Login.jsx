import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    ArrowRight,
    BriefcaseBusiness,
    Lock,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../SupabaseClient';
import { createPendingProfile, createSignupAccessRequest, PROFILE_STATUS } from '../lib/auth';

const initialFeedback = { type: '', message: '' };

function getFriendlyAuthErrorMessage(error) {
    let message = '';

    if (typeof error === 'string') {
        message = error;
    } else if (error?.message) {
        message = error.message;
    } else if (error?.code) {
        message = String(error.code);
    } else {
        message = String(error || '');
    }

    const normalized = message.toLowerCase();

    // Erros de schema/tabelas
    if (
        message.includes('access_profiles') ||
        message.includes('access_requests') ||
        message.includes('schema cache') ||
        normalized.includes('could not find the table') ||
        normalized.includes('relation does not exist') ||
        normalized.includes('pgrst205') ||
        normalized.includes('42p01') ||
        normalized.includes('relation')
    ) {
        return 'A tabela de controle de acesso ainda nao foi configurada no Supabase. Execute o SQL de src/db/access-control.sql e atualize o schema do Supabase.';
    }

    // Erros de serialização/JSON
    if (
        normalized.includes('cannot coerce') ||
        normalized.includes('could not deserialize') ||
        normalized.includes('json') ||
        normalized.includes('unexpected token')
    ) {
        return 'Ocorreu um erro ao processar a resposta do servidor. Tente novamente.';
    }

    // Erros de autenticação
    if (
        normalized.includes('already registered') ||
        normalized.includes('already exists') ||
        normalized.includes('duplicate') ||
        normalized.includes('23505')
    ) {
        return 'Este email ja possui uma conta. Faca login com a mesma senha para criar ou verificar sua solicitacao de acesso.';
    }

    if (normalized.includes('email not confirmed')) {
        return 'Confirme seu email antes de fazer login. Depois disso, sua solicitacao ficara aguardando aprovacao.';
    }

    if (
        normalized.includes('invalid login credentials') ||
        normalized.includes('invalid password') ||
        normalized.includes('user not found')
    ) {
        return 'Email ou senha incorretos. Tente novamente.';
    }

    if (normalized.includes('password too short')) {
        return 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (normalized.includes('invalid email')) {
        return 'Por favor, insira um email valido.';
    }

    if (normalized.includes('network')) {
        return 'Erro de conexao. Verifique sua internet e tente novamente.';
    }

    if (normalized.includes('timeout')) {
        return 'A operacao demorou muito tempo. Tente novamente.';
    }

    // Fallback
    return message || 'Nao foi possivel concluir a operacao. Tente novamente.';
}

export default function Login() {
    const router = useRouter();
    const [mode, setMode] = useState('login');
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [feedback, setFeedback] = useState(initialFeedback);

    const isLogin = mode === 'login';
    const isRegister = mode === 'register';
    const isForgotPassword = mode === 'forgot-password';

    //Garante que o usuario não tenha nenhuma sessão ativa ao acessa a tela de login 

    useEffect(() => {
        let isMounted = true;

        const clearSession = async () => {
            await supabase.auth.signOut();

            if (isMounted) {
                setCheckingSession(false);
            }
        };

        clearSession();

        return () => {
            isMounted = false;
        };
    }, []);


    //Limpa os dados digitados nos campos de input 
    const resetForm = () => {
        setNome('');
        setEmail('');
        setSenha('');
    };

    //Alterna a interface entre 'login', 'cadastro' e 'recuperar senha'
    const changeMode = (nextMode) => {
        setFeedback(initialFeedback);
        resetForm();
        setMode(nextMode);
    };

    // Processa o formulario e chama a funcao correta do Supabase (Login, Cadastro ou Reset)

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setFeedback(initialFeedback);

        try {
            if (isForgotPassword) {
                const redirectTo = `${window.location.origin}/reset-password`;
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo,
                });

                if (error) {
                    throw error;
                }

                setFeedback({
                    type: 'success',
                    message: 'Enviamos um link de recuperacao para seu email. Abra o link para criar uma nova senha.',
                });
                return;
            }

            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password: senha,
                });

                if (error) {
                    throw error;
                }

                const profile = await createPendingProfile(data.user);

                if (profile.status !== PROFILE_STATUS.APPROVED) {
                    await createSignupAccessRequest(data.user);
                    await supabase.auth.signOut();
                    const isRejected = profile.status === PROFILE_STATUS.REJECTED;
                    setMode(isRejected ? 'register' : 'login');
                    setFeedback({
                        type: 'error',
                        message: isRejected
                            ? 'Acesso negado. Solicite acesso novamente na tela abaixo.'
                            : 'Ainda sem permissao. Solicitacao de acesso encaminhada. Aguarde a aprovacao do administrador.',
                    });
                    return;
                }

                router.replace('/dashboard');
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password: senha,
                options: {
                    data: {
                        nome,
                    },
                },
            });

            if (error) {
                const normalized = String(error.message || error).toLowerCase();
                if (normalized.includes('already registered') || normalized.includes('already exists')) {
                    const { data: existingData, error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password: senha,
                    });

                    if (signInError) {
                        setMode('login');
                        setFeedback({
                            type: 'error',
                            message: 'Este email ja possui uma conta. Faca login para continuar.',
                        });
                        return;
                    }

                    const existingProfile = await createPendingProfile(existingData.user);
                    await createSignupAccessRequest(existingData.user);
                    await supabase.auth.signOut();

                    if (existingProfile.status === PROFILE_STATUS.APPROVED) {
                        setMode('login');
                        setFeedback({
                            type: 'success',
                            message: 'Este email ja possui acesso. Faca login para continuar.',
                        });
                        return;
                    }

                    setMode('login');
                    setFeedback({
                        type: 'success',
                        message: 'Solicitacao de acesso encaminhada. Aguarde a aprovacao do administrador.',
                    });
                    return;
                }

                throw error;
            }

            if (data.user) {
                if (data.session) {
                    const profile = await createPendingProfile(data.user);
                    if (profile.status === PROFILE_STATUS.APPROVED) {
                        router.replace('/dashboard');
                        return;
                    }
                } else {
                    await createSignupAccessRequest(data.user);
                }
            }

            if (data.session) {
                await supabase.auth.signOut();
            }

            const cadastroConfirmadoNaHora = Boolean(data.session);

            setFeedback({
                type: 'success',
                message: cadastroConfirmadoNaHora
                    ? 'Solicitacao enviada. Aguarde a aprovacao do administrador para acessar.'
                    : 'Solicitacao enviada. Confirme seu email e aguarde a aprovacao do administrador.',
            });

            setSenha('');
            setMode('login');
        } catch (err) {
            console.error(err);
            setFeedback({
                type: 'error',
                message: getFriendlyAuthErrorMessage(err),
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="login-status-screen">
                <p>Carregando...</p>
            </div>
        );
    }

    if (!isSupabaseConfigured) {
        return (
            <div className="login-status-screen">
                <h1>Erro de configuracao do Supabase</h1>
                <p>
                    O deploy nao esta com as variaveis de ambiente do Supabase
                    corretamente configuradas.
                </p>
                <p>
                    Configure <strong>NEXT_PUBLIC_SUPABASE_URL</strong> e{' '}
                    <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> no painel do Vercel.
                </p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Login - Simapel</title>
            </Head>

            <div className="login-shell">
                <section className="login-hero">
                <div className="hero-glow" />
                <div className="hero-content">
                    <h1>Precisão Digital para Resultados Impressos.</h1>
                    <p>
                        Gerencie sua producao grafica com a eficiencia que a Simapel oferece.
                        Controle total desde o pedido ate a entrega final.
                    </p>

                    <div className="hero-metrics">
                        <div>
                            <strong>100%</strong>
                            <span>Gestao digital</span>
                        </div>
                        <div>
                            <strong>24/7</strong>
                            <span>Monitoramento</span>
                        </div>
                    </div>
                </div>
                </section>

                <section className="login-panel">
                <div className="login-card">
                    <div className="login-brand">
                        <img src="/logo.png" alt="Logo Simapel" />
                        <span>Simapel</span>
                    </div>

                    <div className="login-heading">
                        <h2>
                            {isForgotPassword
                                ? 'Recuperar senha'
                                : isRegister
                                  ? 'Solicitar acesso'
                                  : 'Acesso ao Sistema'}
                        </h2>
                        <p>
                            {isForgotPassword
                                ? 'Informe seu email corporativo para receber o link de redefinicao.'
                                : isRegister
                                  ? 'Crie sua conta para acessar a gestao grafica.'
                                  : 'Gestao Grafica de alta performance'}
                        </p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {isRegister && (
                            <div className="field-group">
                                <span>Nome completo</span>
                                <div className="field-control">
                                    <BriefcaseBusiness size={16} />
                                    <input
                                        type="text"
                                        placeholder="Seu nome"
                                        value={nome}
                                        onChange={(event) => setNome(event.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="field-group">
                            <span>E-mail corporativo</span>
                            <div className="field-control">
                                <Mail size={16} />
                                <input
                                    type="email"
                                    placeholder="exemplo@simapel.com.br"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <div className="field-group">
                                <span>
                                    Senha
                                    {isLogin && (
                                        <button
                                            type="button"
                                            className="forgot-link"
                                            onClick={() => changeMode('forgot-password')}
                                        >
                                            Esqueci minha senha
                                        </button>
                                    )}
                                </span>
                                <div className="field-control">
                                    <Lock size={16} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={senha}
                                        onChange={(event) => setSenha(event.target.value)}
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {feedback.message && (
                            <div className={`form-feedback ${feedback.type}`}>
                                {feedback.message}
                            </div>
                        )}

                        <button type="submit" className="login-submit" disabled={submitting}>
                            {submitting
                                ? 'Processando...'
                                : isForgotPassword
                                  ? 'Enviar link'
                                  : isRegister
                                    ? 'Criar acesso'
                                    : 'Acessar Sistema'}
                            <ArrowRight size={16} />
                        </button>
                    </form>

                    <div className="login-switch">
                        {isForgotPassword ? (
                            <>
                                <span>Lembrou sua senha?</span>
                                <button type="button" onClick={() => changeMode('login')}>
                                    Voltar ao login
                                </button>
                            </>
                        ) : (
                            <>
                                <span>{isLogin ? 'Ainda nao possui acesso?' : 'Ja possui acesso?'}</span>
                                <button
                                    type="button"
                                    onClick={() => changeMode(isLogin ? 'register' : 'login')}
                                >
                                    {isLogin ? 'Solicitar Acesso' : 'Fazer login'}
                                </button>
                            </>
                        )}
                    </div>

                    <div className="login-footer">
                        <span>Grafica Simapel</span>
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
