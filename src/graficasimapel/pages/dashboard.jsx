import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    Menu, LayoutDashboard, Package, AlignEndHorizontal,
    Wallet, Users, Bell, Search, Settings, FileText, BarChart3, Sun, Moon,
    CheckCircle2, PackageCheck, Zap, LogOut, Shield
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { getApprovedSession } from '../lib/auth';
import { useStoredTheme } from '../lib/theme';

function getUserPresentation(session) {
    const label = session?.user?.user_metadata?.nome || session?.user?.email || 'Usuario';
    const initials = label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'US'; 

    return { label, initials };
}

export default function Dashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef(null);
    const { theme, toggleTheme } = useStoredTheme();
    
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [userLabel, setUserLabel] = useState('Usuario');
    const [userInitials, setUserInitials] = useState('US');
    const [isAdmin, setIsAdmin] = useState(false);
    const [ordersCount, setOrdersCount] = useState(0);
    const [revenueThisMonth, setRevenueThisMonth] = useState(0);
    const [inProductionCount, setInProductionCount] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [notificacoes, setNotificacoes] = useState([]);

    // 1. Função dos cards (Movida para cima para não quebrar a tela)
    const fetchDashboardMetrics = async () => {
        const { data: pedidosData, error: pedidosError } = await supabase.from('pedidos').select('*');
        const { data: estoqueData, error: estoqueError } = await supabase.from('estoque').select('*');

        if (pedidosError) console.error('Erro ao carregar pedidos:', pedidosError);
        if (estoqueError) console.error('Erro ao carregar estoque:', estoqueError);

        const pedidos = pedidosData || [];
        const estoque = estoqueData || [];

        setOrdersCount(pedidos.filter((p) => p.status_producao?.toString()?.toLowerCase() !== 'finalizado').length);
        setRevenueThisMonth(pedidos.reduce((sum, p) => sum + Number(p.valor_total || 0), 0));
        setInProductionCount(pedidos.filter((p) => {
            const status = p.status_producao?.toString()?.toLowerCase();
            return status === 'producao' || status === 'em producao' || status === 'em produção';
        }).length);
        setLowStockCount(estoque.filter((item) => Number(item.quantidade_atual) <= Number(item.nivel_critico)).length);
    };

    // 2. Funções de Notificação
    const loadNotificacoes = async () => {
        const { data } = await supabase.from('notificacoes').select('*').order('criado_em', { ascending: false });
        setNotificacoes(data || []);
    };

    const marcarTodasComoLidas = async () => {
        await supabase.from('notificacoes').update({ lida: true }).eq('lida', false);
        loadNotificacoes();
    };

    const getIcon = (tipo) => {
        switch(tipo) {
            case 'pedido': return <PackageCheck size={18} color="var(--accent-blue)"/>;
            case 'estoque': return <Zap size={18} color="var(--accent-yellow)"/>;
            case 'acesso': return <Shield size={18} color="var(--accent-green)"/>;
            default: return <Bell size={18} color="var(--text-secondary)"/>;
        }
    };

    // 3. Efeitos (useEffect) Limpos e sem duplicidade
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notificationsRef]);

    useEffect(() => {
        loadNotificacoes();
        const channel = supabase.channel('realtime-notificacoes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes' }, loadNotificacoes)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    useEffect(() => {
        let isMounted = true; 
        const validateSession = async () => {
            const { session, profile } = await getApprovedSession();
            if (!isMounted) return;
            if (!session) { router.replace('/Login'); return; }
            const { label, initials } = getUserPresentation(session);
            setUserLabel(label);
            setUserInitials(initials);
            setIsAdmin(Boolean(profile?.is_admin));
            await fetchDashboardMetrics();
            setIsCheckingAuth(false);
        };
        validateSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!session) { router.replace('/Login'); return; }
            const { session: approvedSession, profile } = await getApprovedSession();
            if (!approvedSession) { router.replace('/Login'); return; }
            const { label, initials } = getUserPresentation(approvedSession);
            setUserLabel(label);
            setUserInitials(initials);
            setIsAdmin(Boolean(profile?.is_admin));
            await fetchDashboardMetrics();
            setIsCheckingAuth(false);
        });
        
        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [router]);

    useEffect(() => {
        const channel = supabase.channel('dashboard-metrics')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchDashboardMetrics)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, fetchDashboardMetrics)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/Login');
    };

    if (isCheckingAuth) return <div className="dash-loading">Carregando dashboard...</div>;

    return (
        <>
            <Head><title>Dashboard - Simapel</title></Head>
            <div className="dash-layout" data-theme={theme}>
                <aside className={`dash-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <img src="/logo.png" alt="Logo Simapel" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '8px' }} />
                        {isSidebarOpen && <h2>Simapel</h2>}
                    </div>

                    <div className="sidebar-menu">
                        <div className="menu-item active"><LayoutDashboard size={20} /><span className="menu-text">Painel Geral</span></div>
                        <div className={`menu-item ${router.pathname === '/pedidos' ? 'active' : ''}`} onClick={() => router.push('/pedidos')} style={{ cursor: 'pointer' }}>
                            <Package size={20} /><span className="menu-text">Pedidos</span>
                        </div>
                        <div className={`menu-item ${router.pathname === '/estoque' ? 'active' : ''}`} onClick={() => router.push('/estoque')} style={{ cursor: 'pointer' }}>
                            <AlignEndHorizontal size={20} /><span className="menu-text">Estoque</span>
                        </div>
                        <div className={`menu-item ${router.pathname === '/financeiro' ? 'active' : ''}`} onClick={() => router.push('/financeiro')} style={{ cursor: 'pointer' }}>
                            <Wallet size={20} /><span className="menu-text">Financeiro</span>
                        </div>
                        <div className={`menu-item ${router.pathname === '/notificacoes' ? 'active' : ''}`} onClick={() => router.push('/notificacoes')} style={{ cursor: 'pointer' }}>
                            <Bell size={20} /><span className="menu-text">Notificações</span>
                        </div>      

                        <div style={{ marginTop: 'auto' }}>
                            <Link href="/clientes" style={{ textDecoration: 'none' }}>
                                <div className="menu-item"><Users size={20} /><span className="menu-text">Clientes</span></div>
                            </Link>
                            {isAdmin && (
                                <div className="menu-item" onClick={() => router.push('/configuracoes')} style={{ cursor: 'pointer' }}>
                                    <Settings size={20} /><span className="menu-text">Configurações</span>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <div className="dash-main">
                    <nav className="dash-navbar">
                        <div className="nav-left">
                            <button onClick={toggleSidebar} className="toggle-btn"><Menu size={24}/></button>
                            <h2 style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-primary)'}}>Visão Geral</h2>
                        </div>

                        <div className="nav-center">
                            <div className="search-bar">
                                <Search className="search-icon" size={18} />
                                <input type="search" placeholder="Pesquisar pedidos, clientes, notas..." className="search-input" />
                            </div>
                        </div>

                        <div className="nav-right">
                            <button onClick={toggleTheme} className="theme-toggle-btn">
                                {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
                            </button>
                            
                            <div className="notifications-container" ref={notificationsRef}>
                                <button className="toggle-btn" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                                    <Bell size={20} color={isNotificationsOpen ? "var(--primary-color)" : "var(--text-secondary)"} style={{ cursor: 'pointer' }}/>
                                    {notificacoes.filter(n => !n.lida).length > 0 && (
                                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'var(--accent-red)', color: 'white', fontSize: '0.65rem', borderRadius: '50%', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                            {notificacoes.filter(n => !n.lida).length}
                                        </span>
                                    )}
                                </button>
                                
                                {isNotificationsOpen && (
                                    <div className="notifications-popup">
                                        <div className="notifications-header">
                                            <h3>Notificações</h3>
                                            <button className="mark-read-btn" onClick={marcarTodasComoLidas}>
                                                <CheckCircle2 size={14} style={{ marginRight: '5px'}}/>
                                                Marcar como lidas
                                            </button>
                                        </div>
                                        <div className="notifications-list">
                                            {notificacoes.map(n => (
                                                <div key={n.id} className={`notification-item ${!n.lida ? 'unread' : ''}`}>
                                                    <div className="stat-icon">{getIcon(n.tipo)}</div>
                                                    <div className="notification-item-body">
                                                        <h4>{n.titulo}</h4>
                                                        <p>{n.mensagem}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {notificacoes.length === 0 && (
                                                <p style={{ textAlign: 'center', padding: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhuma notificação.</p>
                                            )}
                                        </div>
                                        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'center'}}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => router.push('/notificacoes')}>
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
                            <button className="logout-button" type="button" onClick={handleLogout} title="Sair"><LogOut size={18} /><span>Sair</span></button>
                        </div>
                    </nav>

                    <div className="dash-content">
                        <div className="cards-grid">
                            <div className="dash-card">
                                <div className="stat-card-header">
                                    <h3>Pedidos em Aberto</h3>
                                    <div className="stat-icon" style={{ color: 'var(--accent-blue)' }}><FileText size={20}/></div>
                                </div>
                                <div className="stat-card-body">
                                    <h2>{ordersCount}</h2>
                                    <span className="stat-comparison" style={{ color: 'var(--accent-green)' }}>Pedidos não finalizados</span>
                                </div>
                            </div>
                            <div className="dash-card">
                                <div className="stat-card-header">
                                    <h3>Receita do Mês</h3>
                                    <div className="stat-icon" style={{ color: 'var(--accent-green)' }}><Wallet size={20}/></div>
                                </div>
                                <div className="stat-card-body">
                                    <h2>R$ {revenueThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                    <span className="stat-comparison" style={{ color: 'var(--accent-red)' }}>Faturamento pago no mês</span>
                                </div>
                            </div>
                            <div className="dash-card">
                                <div className="stat-card-header">
                                    <h3>Em Produção</h3>
                                    <div className="stat-icon" style={{ color: 'var(--accent-yellow)' }}><Package size={20}/></div>
                                </div>
                                <div className="stat-card-body">
                                    <h2>{inProductionCount}</h2>
                                    <span className="stat-comparison" style={{ color: 'var(--accent-green)' }}>Pedidos em produção</span>
                                </div>
                            </div>
                            <div className="dash-card">
                                <div className="stat-card-header">
                                    <h3>Alertas de Estoque</h3>
                                    <div className="stat-icon" style={{ color: 'var(--accent-red)' }}><AlignEndHorizontal size={20}/></div>
                                </div>
                                <div className="stat-card-body">
                                    <h2 style={{ color: 'var(--accent-red)' }}>{lowStockCount}</h2>
                                    <span className="stat-comparison" style={{ color: 'var(--text-secondary)' }}>Materiais abaixo do nível crítico</span>
                                </div>
                            </div>
                        </div>

                        <div className="novidades-grid">
                            <div className="dash-card" style={{ flex: 1, minHeight: '300px'}}>
                                <div className="chart-container">
                                    <div className="chart-title-area">
                                        <h3>Pedidos por Mês</h3>
                                        <BarChart3 size={20} color="var(--primary-color)"/>
                                    </div>
                                    <div className="mock-chart">
                                        <div className="mock-chart-bar" style={{ height: '40%' }}></div>
                                        <div className="mock-chart-bar" style={{ height: '60%' }}></div>
                                        <div className="mock-chart-bar" style={{ height: '80%' }}></div>
                                        <div className="mock-chart-bar" style={{ height: '50%' }}></div>
                                        <div className="mock-chart-bar" style={{ height: '70%' }}></div>
                                        <div className="mock-chart-bar" style={{ height: '90%' }}></div>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '10px' }}>
                                        (Jan - Jun) Gráfico Ilustrativo
                                    </p>
                                </div>
                            </div>

                            <div className="dash-card novidades-section" style={{ minHeight: '300px'}}>
                                <h2>Novidades do Sistema</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Cadastro de estoque, pedidos e clientes totalmente integrado. Agora você pode gerenciar tudo em um só lugar, com notificações em tempo real e gráficos de desempenho para acompanhar o crescimento do seu negócio.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}