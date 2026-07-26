import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    AlignEndHorizontal, Bell, Check, CheckCircle2, LayoutDashboard, LogOut,
    Menu, Moon, Package, Search, Settings, Shield, Sun, Users, Wallet,
    Trash2, PackageCheck, Zap, FileText
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { getApprovedSession, getUserPresentationFromSession } from '../lib/auth';
import { useStoredTheme } from '../lib/theme';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Notificacoes() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const { theme, toggleTheme } = useStoredTheme();
    const [userLabel, setUserLabel] = useState('Usuario');
    const [userInitials, setUserInitials] = useState('US');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef(null);
    const [notificacoes, setNotificacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadNotificacoes = async () => {
        const { data, error } = await supabase
            .from('notificacoes')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) {
            console.error("Erro ao buscar notificações:", error);
        } else {
            setNotificacoes(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        const validateSession = async () => {
            const { session } = await getApprovedSession();
            if (!session) {
                router.replace('/Login');
                return;
            }
            const { label, initials } = getUserPresentationFromSession(session);
            setUserLabel(label);
            setUserInitials(initials);
            setIsCheckingAuth(false);
            
            await loadNotificacoes();
        };

        validateSession();
        const notificacoesChannel = supabase
            .channel('notificacoes-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes' }, () => {
                loadNotificacoes();
            })
            .subscribe();

        return () => supabase.removeChannel(notificacoesChannel);
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/Login');
    };

    const marcarComoLida = async (id) => {
        setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
        const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
        if (error) console.error("Erro ao marcar como lida:", error);
    };

    const marcarTodasComoLidas = async () => {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
        const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('lida', false);
        if (error) console.error("Erro ao marcar todas:", error);
    };

    const removerNotificacao = async (id) => {
        setNotificacoes(prev => prev.filter(n => n.id !== id));
        const { error } = await supabase.from('notificacoes').delete().eq('id', id);
        if (error) console.error("Erro ao deletar:", error);
    };

    const limparTodas = async () => {
        setNotificacoes([]);
        const { error } = await supabase.from('notificacoes').delete().neq('id', 0);
        if (error) console.error("Erro ao limpar todas:", error);
    };

    const getIcon = (tipo) => {
        switch(tipo) {
            case 'pedido': return <PackageCheck size={18} color="var(--accent-blue)" />;
            case 'estoque': return <Zap size={18} color="var(--accent-yellow)" />;
            case 'acesso': return <Shield size={18} color="var(--accent-green)" />;
            default: return <FileText size={18} color="var(--text-secondary)" />;
        }
    };

    const formatarTempo = (dataString) => {
        if (!dataString) return '';
        return formatDistanceToNow(new Date(dataString), { addSuffix: true, locale: ptBR });
    };

    if (isCheckingAuth) return null;

    const unreadCount = notificacoes.filter((n) => !n.lida).length;

    return (
        <>
            <Head>
                <title>Notificações - Simapel</title>
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
                        <div className="menu-item" onClick={() => router.push('/estoque')}>
                            <AlignEndHorizontal size={20} />
                            <span className="menu-text">Estoque</span>
                        </div>
                        <div className="menu-item" onClick={() => router.push('/financeiro')}>
                            <Wallet size={20} />
                            <span className="menu-text">Financeiro</span>
                        </div>
                        <div className="menu-item active">
                            <Bell size={20} />
                            <span className="menu-text">Notificações</span>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <div className="menu-item" onClick={() => router.push('/clientes')}>
                                <Users size={20} />
                                <span className="menu-text">Clientes</span>
                            </div>
                            <div className="menu-item" onClick={() => router.push('/configuracoes')}>
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
                                Central de Notificações
                            </h2>
                        </div>

                        <div className="nav-right">
                            <button onClick={toggleTheme} className="theme-toggle-btn">
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            </button>

                            <div className="notifications-container" ref={notificationsRef}>
                                <button className="toggle-btn" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                                    <Bell size={20} color={isNotificationsOpen ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                                    {unreadCount > 0 && (
                                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'var(--accent-red)', color: 'white', fontSize: '0.65rem', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {isNotificationsOpen && (
                                    <div className="notifications-popup">
                                        <div className="notifications-header">
                                            <h3>Notificações</h3>
                                            <button className="mark-read-btn" onClick={marcarTodasComoLidas}>
                                                <Check size={14} style={{ marginRight: '5px' }} />
                                                Marcar como lidas
                                            </button>
                                        </div>
                                        <div className="notifications-list">
                                            {notificacoes.map((item) => (
                                                <div key={item.id} className={`notification-item ${!item.lida ? 'unread' : ''}`}>
                                                    <div className="stat-icon">{getIcon(item.tipo)}</div>
                                                    <div className="notification-item-body">
                                                        <h4>{item.titulo}</h4>
                                                        <p>{item.mensagem}</p>
                                                        <span className="notification-time">{formatarTempo(item.criado_em)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {!loading && notificacoes.length === 0 && (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Sem notificações.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="user-profile">
                                <div className="avatar">{userInitials}</div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{userLabel}</span>
                            </div>
                            <button className="logout-button" type="button" onClick={handleLogout}>
                                <LogOut size={18} />
                                <span>Sair</span>
                            </button>
                        </div>
                    </nav>

                    <div className="dash-content">
                        <div className="dash-card">
                            <div className="client-header-row">
                                <div>
                                    <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Notificações do Sistema</h2>
                                    <p className="client-subtitle">
                                        Você tem {unreadCount} notificaç{unreadCount === 1 ? 'ão não lida' : 'ões não lidas'}.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="secondary-action-button" onClick={limparTodas} disabled={notificacoes.length === 0}>
                                        <Trash2 size={16} /> Limpar Tudo
                                    </button>
                                    <button className="primary-action-button" onClick={marcarTodasComoLidas} disabled={unreadCount === 0}>
                                        <CheckCircle2 size={16} color="white" /> Marcar Lidas
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                {loading ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>Carregando dados do servidor...</p>
                                ) : notificacoes.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                        <Bell size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
                                        <p>Nenhuma notificação por aqui.</p>
                                    </div>
                                ) : (
                                    notificacoes.map((n) => (
                                        <div key={n.id} style={{
                                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '15px', padding: '20px',
                                            backgroundColor: !n.lida ? 'var(--bg-input)' : 'transparent',
                                            border: '1px solid var(--border-color)', borderRadius: '12px',
                                            borderLeft: !n.lida ? '4px solid var(--primary-color)' : '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <div style={{ padding: '10px', backgroundColor: 'var(--bg-body)', borderRadius: '10px', height: 'fit-content' }}>
                                                    {getIcon(n.tipo)}
                                                </div>
                                                <div>
                                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '5px' }}>{n.titulo}</h4>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{n.mensagem}</p>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>
                                                        {formatarTempo(n.criado_em)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {!n.lida && (
                                                    <button className="table-action-button" onClick={() => marcarComoLida(n.id)}>
                                                        <Check size={16} /> Lida
                                                    </button>
                                                )}
                                                <button className="table-action-button danger" onClick={() => removerNotificacao(n.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}