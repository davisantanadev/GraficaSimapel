import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Menu, LayoutDashboard, Package, AlignEndHorizontal,
    Wallet, Users, Bell, Search, Settings, Plus, Pencil,
    Trash2, X, Sun, Moon, LogOut, CheckCircle2, PackageCheck,
    TrendingUp, TrendingDown, Shield, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../SupabaseClient';
import { getApprovedSession } from '../lib/auth';
import { useStoredTheme } from '../lib/theme';

function getUserPresentation(session) {
    const label = session?.user?.user_metadata?.nome || session?.user?.email || 'Usuario';
    const initials = label.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'US';
    return { label, initials };
}

const emptyForm = { tipo: 'entrada', descricao: '', valor: '', data_vencimento: '', data_pagamento: '', status: 'pendente' };

export default function Financeiro() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { theme, toggleTheme } = useStoredTheme();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [userLabel, setUserLabel] = useState('Usuario');
    const [userInitials, setUserInitials] = useState('US');
    const [isAdmin, setIsAdmin] = useState(false);
    const [transacoes, setTransacoes] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [pageMessage, setPageMessage] = useState({ type: '', message: '' });
    const notificationsRef = useRef(null);

    const [notificacoes, setNotificacoes] = useState([]);

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

    useEffect(() => {
        loadNotificacoes();
        const channel = supabase.channel('realtime-notificacoes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes' }, loadNotificacoes)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);
    useEffect(() => {
        validateSession();
        function handleClickOutside(event) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validateSession = async () => {
        const { session, profile } = await getApprovedSession();
        if (!session) { router.replace('/Login'); return; }
        const { label, initials } = getUserPresentation(session);
        setUserLabel(label);
        setUserInitials(initials);
        setIsAdmin(Boolean(profile?.is_admin));
        setIsCheckingAuth(false);
        await fetchTransacoes();
    };

    const fetchTransacoes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('financeiro')
            .select('*')
            .order('data_vencimento', { ascending: false });
        if (error) {
            setPageMessage({ type: 'error', message: 'Não foi possível carregar as transações. Verifique a tabela public.financeiro.' });
            setTransacoes([]);
        } else {
            setTransacoes(data || []);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/Login');
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const openModalForNew = () => {
        setEditingItem(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openModalForEdit = (item) => {
        setEditingItem(item);
        setForm({
            tipo: item.tipo || 'entrada',
            descricao: item.descricao || '',
            valor: item.valor?.toString() || '',
            data_vencimento: item.data_vencimento || '',
            data_pagamento: item.data_pagamento || '',
            status: item.status || 'pendente',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.descricao || !form.valor) {
            alert('Descrição e valor são obrigatórios.');
            return;
        }
        setIsSaving(true);
        const payload = {
            tipo: form.tipo,
            descricao: form.descricao,
            valor: parseFloat(form.valor) || 0,
            data_vencimento: form.data_vencimento || null,
            data_pagamento: form.data_pagamento || null,
            status: form.status,
        };
        let error;
        if (editingItem?.id) {
            ({ error } = await supabase.from('financeiro').update(payload).eq('id', editingItem.id));
        } else {
            ({ error } = await supabase.from('financeiro').insert([payload]));
        }
        if (error) {
            alert('Erro ao salvar transação: ' + error.message);
        } else {
            setModalOpen(false);
            setEditingItem(null);
            setForm(emptyForm);
            await fetchTransacoes();
        }
        setIsSaving(false);
    };

    const handleRemove = async (id) => {
        if (!confirm('Deseja realmente excluir esta transação?')) return;
        const { error } = await supabase.from('financeiro').delete().eq('id', id);
        if (error) { alert('Erro ao excluir transação.'); } else { await fetchTransacoes(); }
    };

    const filtered = transacoes.filter((t) =>
        t.descricao?.toLowerCase().includes(search.toLowerCase()) ||
        t.status?.toLowerCase().includes(search.toLowerCase())
    );

    const totalEntradas = transacoes.filter(t => t.tipo === 'entrada').reduce((s, t) => s + (t.valor || 0), 0);
    const totalSaidas = transacoes.filter(t => t.tipo === 'saida').reduce((s, t) => s + (t.valor || 0), 0);
    const saldo = totalEntradas - totalSaidas;

    const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const chartData = (() => {
        const meses = {};
        transacoes.forEach((t) => {
            const data = t.data_vencimento || t.data_pagamento;
            if (!data) return;
            const mes = data.slice(0, 7); // "2026-06"
            if (!meses[mes]) meses[mes] = { mes: mes.slice(5) + '/' + mes.slice(2, 4), Entradas: 0, Saídas: 0 };
            if (t.tipo === 'entrada') meses[mes].Entradas += t.valor || 0;
            else meses[mes]['Saídas'] += t.valor || 0;
        });
        return Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes));
    })();

    if (isCheckingAuth) return <div className="dash-loading">Carregando financeiro...</div>;

    return (
        <>
            <Head><title>Financeiro - Simapel</title></Head>

            <div className="dash-layout" data-theme={theme}>
                <aside className={`dash-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <img src="/logo.png" alt="Logo Simapel" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '8px' }} />
                        {isSidebarOpen && <h2>Simapel</h2>}
                    </div>
                    <div className="sidebar-menu">
                        <div className="menu-item" onClick={() => router.push('/dashboard')}>
                            <LayoutDashboard size={20} /><span className="menu-text">Dashboard</span>
                        </div>
                        <div className="menu-item" onClick={() => router.push('/pedidos')}>
                            <Package size={20} /><span className="menu-text">Pedidos</span>
                        </div>
                        <div className="menu-item" onClick={() => router.push('/estoque')}>
                            <AlignEndHorizontal size={20} /><span className="menu-text">Estoque</span>
                        </div>
                        <div className="menu-item active">
                            <Wallet size={20} /><span className="menu-text">Financeiro</span>
                        </div>

                        <div className="menu-item" onClick={() => router.push('/notificacoes')} style={{ cursor: 'pointer' }}>
                            <Bell size={20} />
                            <span className="menu-text">Notificações</span>
                        </div>
                        <div style={{ marginTop: 'auto' }}>
                            <div className="menu-item" onClick={() => router.push('/clientes')}>
                                <Users size={20} /><span className="menu-text">Clientes</span>
                            </div>
                            {isAdmin && (
                                <div className="menu-item" onClick={() => router.push('/configuracoes')}>
                                    <Settings size={20} /><span className="menu-text">Configurações</span>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <div className="dash-main">
                    <nav className="dash-navbar">
                        <div className="nav-left">
                            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="toggle-btn">
                                <Menu size={24} />
                            </button>
                            <h2 style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>Financeiro</h2>
                        </div>
                        <div className="nav-center">
                            <div className="search-bar">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="search"
                                    placeholder="Pesquisar transações..."
                                    className="search-input"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="nav-right">
                            <button onClick={toggleTheme} className="theme-toggle-btn">
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
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
                            <button className="logout-button" type="button" onClick={handleLogout} title="Sair">
                                <LogOut size={18} /><span>Sair</span>
                            </button>
                        </div>
                    </nav>

                    <div className="dash-content">
                        {/* Cards de resumo */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div className="dash-card" style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <TrendingUp size={28} color="var(--accent-green, #22c55e)" />
                                <div>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Entradas</p>
                                    <strong style={{ color: 'var(--accent-green, #22c55e)' }}>{fmt(totalEntradas)}</strong>
                                </div>
                            </div>
                            <div className="dash-card" style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <TrendingDown size={28} color="var(--accent-red, #ef4444)" />
                                <div>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Saídas</p>
                                    <strong style={{ color: 'var(--accent-red, #ef4444)' }}>{fmt(totalSaidas)}</strong>
                                </div>
                            </div>
                            <div className="dash-card" style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Wallet size={28} color={saldo >= 0 ? 'var(--accent-green, #22c55e)' : 'var(--accent-red, #ef4444)'} />
                                <div>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Saldo</p>
                                    <strong style={{ color: saldo >= 0 ? 'var(--accent-green, #22c55e)' : 'var(--accent-red, #ef4444)' }}>{fmt(saldo)}</strong>
                                </div>
                            </div>
                        </div>

                        {chartData.length > 0 && (
                            <div className="dash-card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 600 }}>Entradas e Saídas por Mês</h3>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                                        <XAxis dataKey="mes" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} />
                                        <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                        <Tooltip formatter={(v) => fmt(v)} />
                                        <Legend />
                                        <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="dash-card client-header-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ color: 'var(--text-primary)' }}>Transações</h2>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Registre entradas e saídas financeiras da gráfica.</p>
                            </div>
                            <button className="primary-action-button" onClick={openModalForNew}>
                                <Plus size={16} /> Nova Transação
                            </button>
                        </div>

                        {pageMessage.message && (
                            <div className={`dash-card`} style={{ color: pageMessage.type === 'error' ? 'var(--accent-red, #ef4444)' : 'var(--accent-green, #22c55e)' }}>
                                {pageMessage.message}
                            </div>
                        )}

                        <div className="client-table-wrapper">
                            <table className="client-table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Descrição</th>
                                        <th>Vencimento</th>
                                        <th>Pagamento</th>
                                        <th>Status</th>
                                        <th>Valor</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} className="client-empty-state">Carregando...</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={7} className="client-empty-state">Nenhuma transação encontrada.</td></tr>
                                    ) : filtered.map((t) => (
                                        <tr key={t.id}>
                                            <td>
                                                <span style={{
                                                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                                                    background: t.tipo === 'entrada' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: t.tipo === 'entrada' ? '#22c55e' : '#ef4444',
                                                }}>
                                                    {t.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </td>
                                            <td>{t.descricao || '-'}</td>
                                            <td>{t.data_vencimento ? new Date(t.data_vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td>{t.data_pagamento ? new Date(t.data_pagamento).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                                                    background: t.status === 'pago' ? 'rgba(34,197,94,0.15)' : t.status === 'parcial' ? 'rgba(234,179,8,0.15)' : 'rgba(156,163,175,0.2)',
                                                    color: t.status === 'pago' ? '#22c55e' : t.status === 'parcial' ? '#ca8a04' : 'var(--text-secondary)',
                                                }}>
                                                    {t.status === 'pago' ? 'Pago' : t.status === 'parcial' ? 'Parcial' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600, color: t.tipo === 'entrada' ? '#22c55e' : '#ef4444' }}>{fmt(t.valor || 0)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="table-action-button" onClick={() => openModalForEdit(t)} title="Editar"><Pencil size={14} /></button>
                                                    <button className="table-action-button danger" onClick={() => handleRemove(t.id)} title="Excluir"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <div className="client-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="client-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="client-modal-header">
                            <h2>{editingItem ? 'Editar Transação' : 'Nova Transação'}</h2>
                            <button onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="client-form">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <label>
                                    Tipo *
                                    <select name="tipo" value={form.tipo} onChange={handleFormChange}>
                                        <option value="entrada">Entrada</option>
                                        <option value="saida">Saída</option>
                                    </select>
                                </label>
                                <label>
                                    Status
                                    <select name="status" value={form.status} onChange={handleFormChange}>
                                        <option value="pendente">Pendente</option>
                                        <option value="pago">Pago</option>
                                        <option value="parcial">Parcial</option>
                                    </select>
                                </label>
                                <label style={{ gridColumn: '1 / -1' }}>
                                    Descrição *
                                    <input name="descricao" value={form.descricao} onChange={handleFormChange} placeholder="Ex: Venda de impressão, Compra de papel..." />
                                </label>
                                <label>
                                    Valor (R$) *
                                    <input name="valor" type="number" min="0" step="0.01" value={form.valor} onChange={handleFormChange} placeholder="0,00" />
                                </label>
                                <label>
                                    Data de Vencimento
                                    <input name="data_vencimento" type="date" value={form.data_vencimento} onChange={handleFormChange} />
                                </label>
                                <label>
                                    Data de Pagamento
                                    <input name="data_pagamento" type="date" value={form.data_pagamento} onChange={handleFormChange} />
                                </label>
                            </div>
                            <div className="client-form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button className="secondary-action-button" onClick={() => setModalOpen(false)} type="button">Cancelar</button>
                                <button className="primary-action-button" onClick={handleSave} type="button" disabled={isSaving}>
                                    {isSaving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}