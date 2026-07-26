import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    LayoutDashboard,
    Package,
    Users,
    Search,
    Settings,
    Plus,
    Pencil,
    Trash2,
    X,
    Menu,
    AlignEndHorizontal,
    Wallet,
    Bell,
    Moon,
    Sun,
    LogOut,
    CheckCircle2,
    PackageCheck,
    Zap,
    Shield
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { getApprovedSession } from '../lib/auth';
import { useStoredTheme } from '../lib/theme';

// Helper para formatar o nome e as iniciais do perfil do usuário
function getUserPresentation(session: any) {
    const label = session?.user?.user_metadata?.nome || session?.user?.email || 'Usuário';
    const initials = label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase())
        .join('') || 'US'; 

    return { label, initials };
}

const emptyForm = {
    cliente_id: '',
    titulo: '',
    descricao: '',
    status_producao: 'Pendente',
    status_financeiro: 'Pendente',
    data_entrada: new Date().toISOString().split('T')[0],
    data_entrega_prevista: '',
    valor_total: '', 
};

export default function Pedidos() {
    // Estados de UI e Tema
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { theme, toggleTheme } = useStoredTheme();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    // Estados de Dados
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    
    // Estados do Perfil e Modal 
    const [userLabel, setUserLabel] = useState('Usuário');
    const [userInitials, setUserInitials] = useState('US');
    const [isAdmin, setIsAdmin] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPedido, setEditingPedido] = useState<any | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [clienteSearch, setClienteSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const notificationsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [notificacoes, setNotificacoes] = useState<any[]>([]);

    const loadNotificacoes = async () => {
        const { data } = await supabase.from('notificacoes').select('*').order('criado_em', { ascending: false });
        setNotificacoes(data || []);
    };

    const marcarTodasComoLidas = async () => {
        await supabase.from('notificacoes').update({ lida: true }).eq('lida', false);
        loadNotificacoes();
    };

    const getIcon = (tipo: string) => {
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
    // ------------------------------

    // Carrega o tema salvo, busca os dados do banco e lida com cliques fora das notificações
    useEffect(() => {
        validateSession();

        function handleClickOutside(event: MouseEvent) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Verifica se o usuário está autenticado e atualiza o perfil na tela
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
        await fetchData();
    };

    // Busca a lista de pedidos e a lista de clientes no banco de dados (Supabase)
    async function fetchData() {
        setLoading(true);
        const { data: pedidosData } = await supabase
            .from('pedidos')
            .select('*, clientes(nome)')
            .order('data_entrada', { ascending: false });

        const { data: clientesData } = await supabase
            .from('clientes')
            .select('id, nome, cpf_cnpj')
            .order('nome');

        if (pedidosData) setPedidos(pedidosData);
        if (clientesData) setClientes(clientesData);
        setLoading(false);
    }

    // Encerra a sessão do usuário e redireciona para a tela de Login
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/Login');
    };

    // Atualiza dinamicamente os valores do formulário enquanto o usuário digita
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Executa o CREATE (novo pedido) ou o UPDATE (edição) no banco de dados
    const handleSave = async () => {
        if (!form.cliente_id || !form.titulo) {
            alert('Preencha os campos obrigatórios.');
            return;
        }
        setIsSaving(true);
        const payload = {
            cliente_id: form.cliente_id,
            titulo: form.titulo,
            descricao: form.descricao,
            status_producao: form.status_producao,
            status_financeiro: form.status_financeiro,
            data_entrada: form.data_entrada,
            data_entrega_prevista: form.data_entrega_prevista || null,
            valor_total: parseFloat(form.valor_total.toString()) || 0,
        };

        let error;
        if (editingPedido?.id) {
            const result = await supabase.from('pedidos').update(payload).eq('id', editingPedido.id);
            error = result.error;
        } else {
            const result = await supabase.from('pedidos').insert([payload]);
            error = result.error;
        }

        if (error) alert('Erro ao salvar: ' + error.message);
        else {
            setModalOpen(false);
            setEditingPedido(null);
            setForm(emptyForm);
            setClienteSearch('');
            fetchData();
        }
        setIsSaving(false);
    };

    // Executa o DELETE excluindo um pedido do banco após a confirmação
    const handleRemove = async (id: string) => {
        if (!confirm('Deseja realmente excluir este pedido?')) return;
        const { error } = await supabase.from('pedidos').delete().eq('id', id); 
        if (error) alert('Erro ao excluir');
        else fetchData();
    };

    // Aplica os filtros de busca por nome/CPF na lista de clientes e pedidos
    const clientesFiltrados = clientes.filter(c => 
        c.nome?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
        c.cpf_cnpj?.includes(clienteSearch)
    );

    const filtered = pedidos.filter(p => {
        const matchesSearch = 
            p.titulo?.toLowerCase().includes(search.toLowerCase()) ||
            p.clientes?.nome?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = 
            filtroStatus === 'Todos' || 
            (filtroStatus === 'Em Aberto' && p.status_producao !== 'Finalizado') ||
            (filtroStatus === 'Finalizado' && p.status_producao === 'Finalizado');
        return matchesSearch && matchesStatus;
    });

    if (isCheckingAuth) return <div className="dash-loading">Carregando...</div>;

    return (
        <>
            <Head><title>Pedidos - Simapel</title></Head>

            <div className="dash-layout" data-theme={theme}>
                <aside className={`dash-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <img 
                            src="/logo.png" 
                            alt="Logo Simapel" 
                            style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                        {isSidebarOpen && <h2>Simapel</h2>}
                    </div>

                    <div className="sidebar-menu">
                        <div 
                            className="menu-item" 
                            onClick={() => router.push('/dashboard')} 
                            style={{ cursor: 'pointer' }}
                        >
                            <LayoutDashboard size={20} />
                            <span className="menu-text">Dashboard</span>
                        </div>
                        
                        <div className="menu-item active">
                            <Package size={20} />
                            <span className="menu-text">Pedidos</span>
                        </div>

                        <div className={`menu-item ${router.pathname === '/estoque' ? 'active' : ''}`} onClick={() => router.push('/estoque')} style={{ cursor: 'pointer' }}>
                            <AlignEndHorizontal size={20} />
                            <span className="menu-text">Estoque</span>
                        </div>

                        <div className="menu-item" onClick={() => router.push('/financeiro')} style={{ cursor: 'pointer' }}>
                            <Wallet size={20} />
                            <span className="menu-text">Financeiro</span>
                        </div>

                        <div className="menu-item" onClick={() => router.push('/notificacoes')} style={{ cursor: 'pointer' }}>
                            <Bell size={20} />
                            <span className="menu-text">Notificações</span>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <div 
                                className="menu-item" 
                                onClick={() => router.push('/clientes')} 
                                style={{ cursor: 'pointer' }}
                            >
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
                            <h2 style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>Gerenciamento de Pedidos</h2>
                        </div>

                        <div className="nav-center">
                            <div className="search-bar">
                                <Search className="search-icon" size={18} />
                                <input 
                                    type="search" 
                                    placeholder="Pesquisar pedidos ou clientes..." 
                                    className="search-input"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
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
                            <button className="logout-button" onClick={handleLogout}>
                                <LogOut size={18} />
                                <span>Sair</span>
                            </button>
                        </div>
                    </nav>

                    <div className="dash-content">
                        <div className="dash-card">
                            <div className="client-header-row">
                                <div>
                                    <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Pedidos da Gráfica</h2>
                                    <div className="filter-bar" style={{ display: 'flex', gap: '10px' }}>
                                        {['Todos', 'Em Aberto', 'Finalizado'].map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => setFiltroStatus(f)}
                                                style={{
                                                    padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-color)',
                                                    background: filtroStatus === f ? 'var(--primary-color)' : 'transparent',
                                                    color: filtroStatus === f ? '#fff' : 'var(--text-secondary)',
                                                    cursor: 'pointer', fontSize: '0.85rem'
                                                }}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button className="primary-action-button" onClick={() => { setForm(emptyForm); setEditingPedido(null); setModalOpen(true); setClienteSearch(''); }}>
                                    <Plus size={16} /> Novo Pedido
                                </button>
                            </div>

                            <div className="client-table-wrapper">
                                <table className="client-table">
                                    <thead>
                                        <tr>
                                            <th>Pedido / Cliente</th>
                                            <th>Valor / Entrega</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <tr><td colSpan={4} className="client-empty-state">Carregando...</td></tr> : 
                                         filtered.map((p) => (
                                            <tr key={p.id}>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.titulo}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.clientes?.nome}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>R$ {Number(p.valor_total).toFixed(2)}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        Previsto: {p.data_entrega_prevista ? new Date(p.data_entrega_prevista).toLocaleDateString('pt-BR') : '--'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem',
                                                        backgroundColor: p.status_producao === 'Finalizado' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(241, 196, 15, 0.1)',
                                                        color: p.status_producao === 'Finalizado' ? '#2ecc71' : '#f1c40f',
                                                        border: '1px solid currentColor'
                                                    }}>
                                                        {p.status_producao}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button className="table-action-button" onClick={() => { setEditingPedido(p); setForm(p); setModalOpen(true); }}>
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button className="table-action-button danger" onClick={() => handleRemove(p.id!)}>
                                                            <Trash2 size={14} />
                                                        </button>
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
                        <div className="client-modal" onClick={e => e.stopPropagation()}>
                            <div className="client-modal-header">
                                <h2>{editingPedido ? 'Editar Pedido' : 'Novo Pedido'}</h2>
                                <button onClick={() => setModalOpen(false)}><X size={18} /></button>
                            </div>
                            <div className="client-form">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <label>Título do Pedido *
                                        <input type="text" name="titulo" value={form.titulo} onChange={handleFormChange} />
                                    </label>
                                    <label>Buscar Cliente (Nome ou CPF/CNPJ)
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Digite para filtrar..." 
                                                value={clienteSearch}
                                                onChange={(e) => setClienteSearch(e.target.value)}
                                                style={{ padding: '8px', fontSize: '0.85rem' }}
                                            />
                                            <select 
                                                name="cliente_id" 
                                                value={form.cliente_id} 
                                                onChange={handleFormChange} 
                                                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                            >
                                                <option value="" style={{color: 'black'}}>Selecione o cliente</option>
                                                {clientesFiltrados.map(c => (
                                                    <option key={c.id} value={c.id} style={{color: 'black'}}>
                                                        {c.nome} {c.cpf_cnpj ? `(${c.cpf_cnpj})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </label>
                                </div>

                                <label>Descrição
                                    <textarea name="descricao" value={form.descricao} onChange={handleFormChange} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)', minHeight: '80px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                                </label>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <label>Status de Produção
                                        <select name="status_producao" value={form.status_producao} onChange={handleFormChange} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                                            <option value="Pendente" style={{color: 'black'}}>Pendente</option>
                                            <option value="Em Produção" style={{color: 'black'}}>Em Produção</option>
                                            <option value="Aguardando Material" style={{color: 'black'}}>Aguardando Material</option>
                                            <option value="Finalizado" style={{color: 'black'}}>Finalizado</option>
                                        </select>
                                    </label>
                                    <label>Data de Entrega Prevista
                                        <input type="date" name="data_entrega_prevista" value={form.data_entrega_prevista} onChange={handleFormChange} />
                                    </label>
                                </div>

                                <label>Valor Total (R$) 
                                    <input type="number" name="valor_total" value={form.valor_total} onChange={handleFormChange} />
                                </label>

                                <div className="client-form-actions">
                                    <button className="secondary-action-button" onClick={() => setModalOpen(false)}>Cancelar</button>
                                    <button className="primary-action-button" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Pedido'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}