import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Menu,
    LayoutDashboard,
    Package,
    AlignEndHorizontal,
    Wallet,
    Users,
    Bell,
    Search,
    Settings,
    Plus,
    Pencil,
    Trash2,
    X,
    Sun,
    Moon,
    LogOut,
    CheckCircle2,
    PackageCheck,
    Zap,
    Shield
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

const emptyForm = {
    nome_material: '',
    tipo_material: '',
    quantidade_atual: '',
    unidade_medida: '',
    nivel_critico: '',
    preco_custo_unidade: '',
};

export default function Estoque() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { theme, toggleTheme } = useStoredTheme();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [userLabel, setUserLabel] = useState('Usuario');
    const [userInitials, setUserInitials] = useState('US');
    const [isAdmin, setIsAdmin] = useState(false);
    const [estoque, setEstoque] = useState([]);
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

        if (!session) {
            router.replace('/Login');
            return;
        }

        const { label, initials } = getUserPresentation(session);
        setUserLabel(label);
        setUserInitials(initials);
        setIsAdmin(Boolean(profile?.is_admin));
        setIsCheckingAuth(false);
        await fetchEstoque();
    };

    const fetchEstoque = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('estoque')
            .select('*')
            .order('nome_material', { ascending: true });

        if (error) {
            console.error(error);
            setPageMessage({ type: 'error', message: 'Nao foi possivel carregar o estoque. Verifique a tabela public.estoque.' });
            setEstoque([]);
        } else {
            setEstoque(data || []);
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
            nome_material: item.nome_material || '',
            tipo_material: item.tipo_material || '',
            quantidade_atual: item.quantidade_atual?.toString() || '',
            unidade_medida: item.unidade_medida || '',
            nivel_critico: item.nivel_critico?.toString() || '',
            preco_custo_unidade: item.preco_custo_unidade?.toString() || '',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.nome_material) {
            alert('O nome do material e obrigatorio.');
            return;
        }

        setIsSaving(true);
        const payload = {
            nome_material: form.nome_material,
            tipo_material: form.tipo_material,
            quantidade_atual: parseFloat(form.quantidade_atual) || 0,
            unidade_medida: form.unidade_medida,
            nivel_critico: parseFloat(form.nivel_critico) || 0,
            preco_custo_unidade: parseFloat(form.preco_custo_unidade) || 0,
        };

        let error;
        if (editingItem?.id) {
            const result = await supabase.from('estoque').update(payload).eq('id', editingItem.id);
            error = result.error;
        } else {
            const result = await supabase.from('estoque').insert([payload]);
            error = result.error;
        }

        if (error) {
            alert('Erro ao salvar material: ' + error.message);
        } else {
            setModalOpen(false);
            setEditingItem(null);
            setForm(emptyForm);
            await fetchEstoque();
        }
        setIsSaving(false);
    };

    const handleRemove = async (id) => {
        if (!confirm('Deseja realmente excluir este material do estoque?')) return;

        const { error } = await supabase.from('estoque').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir material.');
        } else {
            await fetchEstoque();
        }
    };

    const filteredEstoque = estoque.filter((item) => {
        const searchText = search.toLowerCase();
        return (
            item.nome_material?.toLowerCase().includes(searchText) ||
            item.tipo_material?.toLowerCase().includes(searchText) ||
            item.unidade_medida?.toLowerCase().includes(searchText)
        );
    });

    if (isCheckingAuth) {
        return <div className="dash-loading">Carregando estoque...</div>;
    }

    return (
        <>
            <Head>
                <title>Estoque - Simapel</title>
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
                        <div className="menu-item active">
                            <AlignEndHorizontal size={20} />
                            <span className="menu-text">Estoque</span>
                        </div>
                        <div className="menu-item" onClick={() => router.push('/financeiro')}>
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
                            {isAdmin && (
                                <div className="menu-item" onClick={() => router.push('/configuracoes')}>
                                    <Settings size={20} />
                                    <span className="menu-text">Configurações</span>
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
                            <h2 style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>Cadastro de Estoque</h2>
                        </div>

                        <div className="nav-center">
                            <div className="search-bar">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="search"
                                    placeholder="Pesquisar materiais..."
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
                                <LogOut size={18} />
                                <span>Sair</span>
                            </button>
                        </div>
                    </nav>

                    <div className="dash-content">
                        <div className="dash-card client-header-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ color: 'var(--text-primary)' }}>Materiais do Estoque</h2>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cadastre, edite e mantenha o estoque atualizado.</p>
                            </div>
                            <button className="primary-action-button" onClick={openModalForNew}>
                                <Plus size={16} /> Novo Material
                            </button>
                        </div>

                        <div className="client-table-wrapper">
                            <table className="client-table">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Qtd. atual</th>
                                        <th>Unidade</th>
                                        <th>Tipo</th>
                                        <th>Nível crítico</th>
                                        <th>Preço unit.</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="client-empty-state">Carregando estoque...</td>
                                        </tr>
                                    ) : filteredEstoque.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="client-empty-state">Nenhum material encontrado.</td>
                                        </tr>
                                    ) : (
                                        filteredEstoque.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.nome_material}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.tipo_material}</div>
                                                </td>
                                                <td>{Number(item.quantidade_atual).toLocaleString('pt-BR')}</td>
                                                <td>{item.unidade_medida || '-'}</td>
                                                <td>{item.tipo_material || '-'}</td>
                                                <td>{Number(item.nivel_critico).toLocaleString('pt-BR')}</td>
                                                <td>R$ {Number(item.preco_custo_unidade).toFixed(2)}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button className="table-action-button" onClick={() => openModalForEdit(item)}>
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button className="table-action-button danger" onClick={() => handleRemove(item.id)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {pageMessage.message && (
                            <div style={{ marginTop: '20px', color: pageMessage.type === 'error' ? '#ef4444' : 'var(--text-primary)' }}>
                                {pageMessage.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalOpen && (
                <div className="client-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="client-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="client-modal-header">
                            <h2>{editingItem ? 'Editar Material' : 'Novo Material'}</h2>
                            <button onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="client-form">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <label>
                                    Nome do Material *
                                    <input name="nome_material" value={form.nome_material} onChange={handleFormChange} />
                                </label>
                                <label>
                                    Tipo de Material
                                    <input name="tipo_material" value={form.tipo_material} onChange={handleFormChange} />
                                </label>
                                <label>
                                    Quantidade Atual
                                    <input name="quantidade_atual" type="number" min="0" value={form.quantidade_atual} onChange={handleFormChange} />
                                </label>
                                <label>
                                    Unidade de Medida
                                    <input name="unidade_medida" value={form.unidade_medida} onChange={handleFormChange} />
                                </label>
                                <label>
                                    Nível Crítico
                                    <input name="nivel_critico" type="number" min="0" value={form.nivel_critico} onChange={handleFormChange} />
                                </label>
                                <label>
                                    Preço de Custo (unidade)
                                    <input name="preco_custo_unidade" type="number" min="0" step="0.01" value={form.preco_custo_unidade} onChange={handleFormChange} />
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