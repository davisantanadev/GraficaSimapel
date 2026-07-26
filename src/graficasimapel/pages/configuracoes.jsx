import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    AlignEndHorizontal,
    Bell,
    Check,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Package,
    Search,
    Settings,
    Shield,
    Sun,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { getApprovedSession, getUserPresentationFromSession, PROFILE_STATUS, getFriendlyErrorMessage } from '../lib/auth';
import { useStoredTheme } from '../lib/theme';

export default function Configuracoes() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const { theme, toggleTheme } = useStoredTheme();
    const [userLabel, setUserLabel] = useState('Usuario');
    const [userInitials, setUserInitials] = useState('US');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [supportsPrimary, setSupportsPrimary] = useState(true);
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [updatingId, setUpdatingId] = useState('');
    const [pageMessage, setPageMessage] = useState({ type: '', message: '' });
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef(null);

    const pendingRequests = useMemo(
        () => requests.filter((request) => request.status === PROFILE_STATUS.PENDING),
        [requests]
    );

    const loadRequests = async () => {
        setLoadingRequests(true);

        const syncResult = await supabase.rpc('sync_missing_access_profiles');
        if (syncResult.error && syncResult.error.code !== '42883') {
            console.warn(syncResult.error);
        }

        let query = supabase
            .from('access_profiles')
            .select('id, nome, email, status, is_admin, is_primary, created_at, updated_at')
            .neq('status', PROFILE_STATUS.REJECTED)
            .order('created_at', { ascending: false });

        let { data, error } = await query;
        let profileRows = [];

        if (error && error.code === '42703') {
            const fallback = await supabase
                .from('access_profiles')
                .select('id, nome, email, status, is_admin, created_at, updated_at')
                .neq('status', PROFILE_STATUS.REJECTED)
                .order('created_at', { ascending: false });

            if (fallback.error) {
                console.error(fallback.error);
                setPageMessage({
                    type: 'error',
                    message: 'Nao foi possivel carregar as solicitacoes de acesso.',
                });
                setRequests([]);
                setSupportsPrimary(false);
                setLoadingRequests(false);
                return;
            }

            data = fallback.data;
            setSupportsPrimary(false);
        }

        if (error && error.code !== '42703') {
            console.error(error);
            setPageMessage({
                type: 'error',
                message: 'Nao foi possivel carregar as solicitacoes de acesso.',
            });
            setRequests([]);
            setLoadingRequests(false);
            return;
        }

        profileRows = data || [];

        const { data: accessRequestRows, error: accessRequestsError } = await supabase
            .from('access_requests')
            .select('id, user_id, nome, email, status, requested_admin, created_at, updated_at')
            .neq('status', PROFILE_STATUS.REJECTED)
            .order('created_at', { ascending: false });

        if (accessRequestsError && accessRequestsError.code !== '42P01') {
            console.error(accessRequestsError);
            setPageMessage({
                type: 'error',
                message: 'Nao foi possivel carregar as novas solicitacoes de acesso.',
            });
        }

        const profileEmails = new Set(profileRows.map((profile) => profile.email));
        const pendingAccessRequests = (accessRequestRows || [])
            .filter((request) => request.status === PROFILE_STATUS.PENDING && !profileEmails.has(request.email))
            .map((request) => ({
                id: request.id,
                profile_id: request.user_id,
                source: 'access_request',
                nome: request.nome,
                email: request.email,
                status: request.status,
                is_admin: Boolean(request.requested_admin),
                is_primary: false,
                created_at: request.created_at,
                updated_at: request.updated_at,
            }));

        const normalizedProfiles = profileRows.map((profile) => ({
            ...profile,
            source: 'access_profile',
            profile_id: profile.id,
        }));

        setRequests([...pendingAccessRequests, ...normalizedProfiles]);
        setLoadingRequests(false);
    };

    useEffect(() => {
        const validateSession = async () => {
            const { session, profile } = await getApprovedSession();

            if (!session) {
                router.replace('/Login');
                return;
            }

            if (!profile?.is_admin) {
                router.replace('/dashboard');
                return;
            }

            const { label, initials } = getUserPresentationFromSession(session);
            setUserLabel(label);
            setUserInitials(initials);
            setCurrentUserId(session.user.id);
            await loadRequests();
            setIsCheckingAuth(false);
        };

        validateSession();
    }, [router]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const requestsChannel = supabase
            .channel('access-control-configuracoes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'access_profiles' },
                () => {
                    loadRequests();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'access_requests' },
                () => {
                    loadRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(requestsChannel);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/Login');
    };

    const markAccessRequest = async (request, status, successMessage) => {
        const { error } = await supabase
            .from('access_requests')
            .update({
                status,
                reviewed_by: currentUserId,
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', request.id);

        if (error) {
            console.error(error);
            setPageMessage({
                type: 'error',
                message: getFriendlyErrorMessage(error),
            });
            return false;
        }

        setPageMessage({ type: 'success', message: successMessage });
        return true;
    };

    const updateRequest = async (requestId, payload, successMessage) => {
        setUpdatingId(requestId);
        setPageMessage({ type: '', message: '' });

        const { error } = await supabase
            .from('access_profiles')
            .update(payload)
            .eq('id', requestId);

        if (error) {
            console.error(error);
            setPageMessage({
                type: 'error',
                message: getFriendlyErrorMessage(error),
            });
        } else {
            setPageMessage({ type: 'success', message: successMessage });
            await loadRequests();
        }

        setUpdatingId('');
    };

    const approveRequest = async (request, isAdmin) => {
        if (request.source === 'access_request') {
            setUpdatingId(request.id);
            setPageMessage({ type: '', message: '' });

            if (!request.profile_id) {
                await markAccessRequest(
                    request,
                    PROFILE_STATUS.REJECTED,
                    'Solicitacao registrada, mas esta conta ainda nao existe no Auth do Supabase. Peça para o usuario tentar solicitar acesso novamente.'
                );
                await loadRequests();
                setUpdatingId('');
                return;
            }

            const payload = {
                id: request.profile_id,
                nome: request.nome || request.email,
                email: request.email,
                status: PROFILE_STATUS.APPROVED,
                is_admin: isAdmin,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('access_profiles')
                .upsert(payload, { onConflict: 'id' });

            if (error) {
                console.error(error);
                setPageMessage({
                    type: 'error',
                    message: getFriendlyErrorMessage(error),
                });
                setUpdatingId('');
                return;
            }

            await markAccessRequest(
                request,
                PROFILE_STATUS.APPROVED,
                isAdmin ? 'Usuario aprovado como administrador.' : 'Usuario aprovado com acesso comum.'
            );
            await loadRequests();
            setUpdatingId('');
            return;
        }

        updateRequest(
            request.id,
            {
                status: PROFILE_STATUS.APPROVED,
                is_admin: isAdmin,
                updated_at: new Date().toISOString(),
            },
            isAdmin ? 'Usuario aprovado como administrador.' : 'Usuario aprovado com acesso comum.'
        );
    };

    const rejectRequest = async (request) => {
        if (request.source === 'access_request') {
            setUpdatingId(request.id);
            setPageMessage({ type: '', message: '' });
            await markAccessRequest(request, PROFILE_STATUS.REJECTED, 'Solicitacao recusada.');
            await loadRequests();
            setUpdatingId('');
            return;
        }

        updateRequest(
            request.id,
            {
                status: PROFILE_STATUS.REJECTED,
                is_admin: false,
                updated_at: new Date().toISOString(),
            },
            'Solicitacao recusada.'
        );
    };

    const revokeAccess = (request) => {
        if (request.is_primary || request.id === currentUserId) {
            setPageMessage({
                type: 'error',
                message: 'Nao e possivel revogar o seu proprio acesso ou o acesso do admin principal.',
            });
            return;
        }

        updateRequest(
            request.id,
            {
                status: PROFILE_STATUS.REJECTED,
                is_admin: false,
                updated_at: new Date().toISOString(),
            },
            'Acesso revogado para este usuario.'
        );
    };

    const toggleAdmin = (request) => {
        if (request.is_primary || request.id === currentUserId) {
            setPageMessage({
                type: 'error',
                message: 'Nao e possivel remover o acesso de administrador principal ou o seu proprio admin aqui.',
            });
            return;
        }

        updateRequest(
            request.id,
            {
                is_admin: !request.is_admin,
                updated_at: new Date().toISOString(),
            },
            !request.is_admin ? 'Permissao de administrador ativada.' : 'Permissao de administrador removida.'
        );
    };

    const notificationItems = [
        {
            id: 1,
            icon: <Package size={18} color="var(--accent-blue)" />,
            title: 'Novo Pedido',
            message: "Pedido #0048 criado por Café & Arte.",
            time: 'há 2 min',
            unread: true,
        },
        {
            id: 2,
            icon: <Bell size={18} color="var(--accent-yellow)" />,
            title: 'Alerta de Estoque',
            message: "Estoque baixo: 'Papel Couché 90g'.",
            time: 'há 15 min',
            unread: true,
        },
        {
            id: 3,
            icon: <Shield size={18} color="var(--accent-green)" />,
            title: 'Solicitação de acesso',
            message: 'Uma nova solicitação aguarda aprovação.',
            time: 'há 1 hora',
            unread: false,
        },
    ];

    if (isCheckingAuth) {
        return null;
    }

    return (
        <>
            <Head>
                <title>Configuracoes - Simapel</title>
            </Head>

            <div className="dash-layout" data-theme={theme}>
                <aside className={`dash-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <img src="/logo.png" alt="Logo Simapel" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '8px' }} />
                        {isSidebarOpen && <h2>Simapel</h2>}
                    </div>

                    <div className="sidebar-menu">
                        <div className="menu-item" onClick={() => router.push('/dashboard')}>
                            <LayoutDashboard size={20} />
                            <span className="menu-text">Dashboard</span>
                        </div>
                        <div className="menu-item" onClick={() => router.push('/pedidos')}>
                            <Package size={20} />
                            <span className="menu-text">Pedidos</span>
                        </div>
                        <div className={`menu-item ${router.pathname === '/estoque' ? 'active' : ''}`} onClick={() => router.push('/estoque')} style={{ cursor: 'pointer' }}>
                            <AlignEndHorizontal size={20} />
                            <span className="menu-text">Estoque</span>
                        </div>
                        <div className="menu-item">
                            <Wallet size={20} />
                            <span className="menu-text">Financeiro</span>
                        </div>
                        <div className="menu-item" onClick={() => router.push('/notificacoes')} style={{ cursor: 'pointer' }}>
                            <Bell size={20} />
                            <span className="menu-text">Notificações</span>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <div className="menu-item" onClick={() => router.push('/clientes')}>
                                <Users size={20} />
                                <span className="menu-text">Clientes</span>
                            </div>
                            <div className="menu-item active">
                                <Settings size={20} />
                                <span className="menu-text">Configuracoes</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="dash-main">
                    <nav className="dash-navbar">
                        <div className="nav-left">
                            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="toggle-btn">
                                <Menu size={24} />
                            </button>
                            <h2 style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>
                                Configuracoes
                            </h2>
                        </div>

                        <div className="nav-center">
                            <div className="search-bar">
                                <Search className="search-icon" size={18} />
                                <input type="search" placeholder="Pesquisar pedidos, clientes, notas..." className="search-input" />
                            </div>
                        </div>

                        <div className="nav-right">
                            <button onClick={toggleTheme} className="theme-toggle-btn">
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            </button>

                            <div className="notifications-container" ref={notificationsRef}>
                                <button className="toggle-btn" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                                    <Bell size={20} color={isNotificationsOpen ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                                    {notificationItems.filter((item) => item.unread).length > 0 && (
                                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'var(--accent-red)', color: 'white', fontSize: '0.65rem', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {notificationItems.filter((item) => item.unread).length}
                                        </span>
                                    )}
                                </button>

                                {isNotificationsOpen && (
                                    <div className="notifications-popup">
                                        <div className="notifications-header">
                                            <h3>Notificações</h3>
                                            <button className="mark-read-btn">
                                                <Check size={14} style={{ marginRight: '5px' }} />
                                                Marcar como lidas
                                            </button>
                                        </div>
                                        <div className="notifications-list">
                                            {notificationItems.map((item) => (
                                                <div key={item.id} className={`notification-item ${item.unread ? 'unread' : ''}`}>
                                                    <div className="stat-icon">{item.icon}</div>
                                                    <div className="notification-item-body">
                                                        <h4>{item.title}</h4>
                                                        <p>{item.message}</p>
                                                        <span className="notification-time">{item.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', cursor: 'pointer' }}>
                                                Ver todas as notificações →
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="user-profile">
                                <div className="avatar">{userInitials}</div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{userLabel}</span>
                            </div>
                            <button className="logout-button" type="button" onClick={handleLogout} title="Sair">
                                <LogOut size={18} />
                                <span>Sair</span>
                            </button>
                        </div>
                    </nav>

                    <div className="dash-content">
                        <div className="dash-card">
                            <div className="client-header-row">
                                <div>
                                    <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Solicitacoes de acesso</h2>
                                    <p className="client-subtitle">
                                        {pendingRequests.length} solicitacao{pendingRequests.length === 1 ? '' : 'es'} aguardando analise.
                                    </p>
                                </div>
                            </div>

                            {pageMessage.message && (
                                <div className={`page-feedback ${pageMessage.type}`}>
                                    {pageMessage.message}
                                </div>
                            )}

                            <div className="client-table-wrapper">
                                <table className="client-table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Status</th>
                                            <th>Perfil</th>
                                            <th>Acoes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingRequests ? (
                                            <tr>
                                                <td colSpan={4} className="client-empty-state">Carregando solicitacoes...</td>
                                            </tr>
                                        ) : requests.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="client-empty-state">Nenhuma solicitacao encontrada.</td>
                                            </tr>
                                        ) : (
                                            requests.map((request) => (
                                                <tr key={request.id}>
                                                    <td>
                                                        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{request.nome || '-'}</div>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{request.email}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${request.status}`}>
                                                            {request.status === PROFILE_STATUS.PENDING
                                                                ? 'Pendente'
                                                                : request.status === PROFILE_STATUS.APPROVED
                                                                  ? 'Aprovado'
                                                                  : 'Recusado'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ color: 'var(--text-primary)' }}>
                                                            {request.is_admin ? 'Administrador' : 'Usuario comum'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="table-actions">
                                                            {request.status === PROFILE_STATUS.PENDING && (
                                                                <>
                                                                    <button
                                                                        className="table-action-button"
                                                                        onClick={() => approveRequest(request, false)}
                                                                        disabled={updatingId === request.id}
                                                                    >
                                                                        <Check size={14} />
                                                                        Aprovar
                                                                    </button>
                                                                    <button
                                                                        className="table-action-button"
                                                                        onClick={() => approveRequest(request, true)}
                                                                        disabled={updatingId === request.id}
                                                                    >
                                                                        <Shield size={14} />
                                                                        Aprovar admin
                                                                    </button>
                                                                    <button
                                                                        className="table-action-button danger"
                                                                        onClick={() => rejectRequest(request)}
                                                                        disabled={updatingId === request.id}
                                                                    >
                                                                        <X size={14} />
                                                                        Recusar
                                                                    </button>
                                                                </>
                                                            )}

                                                            {request.status === PROFILE_STATUS.APPROVED && (
                                                                <>
                                                                    <button
                                                                        className="table-action-button"
                                                                        onClick={() => toggleAdmin(request)}
                                                                        disabled={
                                                                            updatingId === request.id ||
                                                                            request.is_primary ||
                                                                            request.id === currentUserId
                                                                        }
                                                                    >
                                                                        <Shield size={14} />
                                                                        {request.is_admin
                                                                            ? request.is_primary
                                                                              ? 'Admin principal'
                                                                              : 'Remover admin'
                                                                            : 'Tornar admin'}
                                                                    </button>
                                                                    {!request.is_primary && request.id !== currentUserId && (
                                                                        <button
                                                                            className="table-action-button danger"
                                                                            onClick={() => revokeAccess(request)}
                                                                            disabled={updatingId === request.id}
                                                                        >
                                                                            <X size={14} />
                                                                            Revogar acesso
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
