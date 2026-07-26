import React, { useEffect, useState } from 'react';
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
    ChevronLeft,
    ChevronDown,
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { getApprovedSession } from '../lib/auth';

function getUserPresentation(session: any) {
    const label = session?.user?.user_metadata?.nome || session?.user?.email || 'Usuario';
    const initials = label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part: any) => part[0]?.toUpperCase())
        .join('') || 'US';

    return { label, initials };
}

const emptyForm = { nome: '', email: '', telefone: '', cpfCnpj: '' };

export default function Clientes() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [userLabel, setUserLabel] = useState('Usuario');
    const [userInitials, setUserInitials] = useState('US');
    const [isAdmin, setIsAdmin] = useState(false);

    const [clients, setClients] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [form, setForm] = useState(emptyForm);
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();

    // Auth check
    useEffect(() => {
        let isMounted = true;

        const validateSession = async () => {
            const { session, profile } = await getApprovedSession();

            if (!isMounted) {
                return;
            }

            if (!session) {
                router.replace('/Login');
                return;
            }

            const { label, initials } = getUserPresentation(session);
            setUserLabel(label);
            setUserInitials(initials);
            setIsAdmin(Boolean(profile?.is_admin));
            setIsCheckingAuth(false);
        };

        validateSession();

        return () => {
            isMounted = false;
        };
    }, [router]);

    // Load clients from Supabase
    useEffect(() => {
        if (isCheckingAuth) return;

        const fetchClients = async () => {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                showFeedback('error', 'Erro ao carregar clientes.');
            } else {
                setClients(data || []);
            }
        };

        fetchClients();
    }, [isCheckingAuth]);

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    };

    const openNewModal = () => {
        setEditingClient(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEditModal = (client: any) => {
        setEditingClient(client);
        setForm({
            nome: client.nome || '',
            email: client.email || '',
            telefone: client.telefone || '',
            cpfCnpj: client.cpf_cnpj || '',
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingClient(null);
        setForm(emptyForm);
    };

    const handleFormChange = (e: any) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!form.nome.trim()) {
            showFeedback('error', 'O nome é obrigatório.');
            return;
        }

        setIsSaving(true);

        const payload = {
            nome: form.nome.trim(),
            email: form.email.trim(),
            telefone: form.telefone.trim(),
            cpf_cnpj: form.cpfCnpj.trim(),
        };

        if (editingClient) {
            const { error } = await supabase
                .from('clientes')
                .update(payload)
                .eq('id', editingClient.id);

            if (error) {
                showFeedback('error', 'Erro ao editar cliente.');
            } else {
                setClients((prev) =>
                    prev.map((c) => (c.id === editingClient.id ? { ...c, ...payload } : c))
                );
                showFeedback('success', 'Cliente editado com sucesso.');
                closeModal();
            }
        } else {
            const { data, error } = await supabase
                .from('clientes')
                .insert([payload])
                .select()
                .single();

            if (error) {
                showFeedback('error', 'Erro ao cadastrar cliente.');
            } else {
                setClients((prev) => [data, ...prev]);
                showFeedback('success', 'Cliente cadastrado com sucesso.');
                closeModal();
            }
        }

        setIsSaving(false);
    };

    const handleRemove = async (id: any) => {
        if (!confirm('Deseja remover este cliente?')) return;

        const { error } = await supabase.from('clientes').delete().eq('id', id);

        if (error) {
            showFeedback('error', 'Erro ao remover cliente.');
        } else {
            setClients((prev) => prev.filter((c) => c.id !== id));
            showFeedback('success', 'Cliente removido com sucesso.');
        }
    };

    const filtered = clients.filter(
        (c) =>
            c.nome?.toLowerCase().includes(search.toLowerCase()) ||
            c.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (isCheckingAuth) {
        return <div className="dash-loading">Carregando...</div>;
    }

    return (
        <>
            <Head>
                <title>Homepage - Simapel</title>
            </Head>

            <div className="dash-layout">
                {/* Sidebar */}
                <aside className={`dash-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <img src="/logo.png" alt="Logo Simapel" className="logo-image" />
                        {isSidebarOpen && <h2>Simapel</h2>}
                    </div>

                    <div className="sidebar-menu">
                        <div className="menu-item" onClick={() => router.push('/dashboard')}>
                            <LayoutDashboard size={20} />
                            <span className="menu-text">Dashboard</span>
                        </div>
                        <div className="menu-item">
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

                        <div style={{ marginTop: 'auto' }}>
                            <div className="menu-item active">
                                <Users size={20} />
                                <span className="menu-text">Clientes</span>
                            </div>
                            {isAdmin && (
                                <div className="menu-item" onClick={() => router.push('/configuracoes')}>
                                    <Settings size={20} />
                                    <span className="menu-text">Configuracoes</span>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main */}
                <div className="dash-main">
                    <nav className="dash-navbar">
                        <div className="nav-left">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="toggle-btn"
                            >
                                {isSidebarOpen ? (
                                    <ChevronLeft size={24} />
                                ) : (
                                    <Menu size={24} />
                                )}
                            </button>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 'normal' }}>Clientes</h2>
                        </div>

                        <div className="nav-right">
                            <div className="notification-button">
                                <Bell size={20} />
                            </div>
                            <div className="user-profile">
                                <div className="avatar">{userInitials}</div>

                                <div className="user-info">
                                    <span className="user-name">{userLabel}</span>
                                    <span className="user-role">Administrador</span>
                                </div>
                                 <ChevronDown size={16} className="profile-arrow" />
                            </div>
                        </div>
                    </nav>

                    <div className="dash-content">
                        <div className="dash-card">
                            {/* Header */}
                            <div className="client-header-row">
                                <div>
                                    <h2>Clientes cadastrados</h2>
                                    <p className="client-subtitle">
                                        Cadastre, edite e remova clientes com sincronização automática.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div className="client-search-box">
                                        <Search size={16} color="#8892b0" />
                                        <input
                                            type="text"
                                            placeholder="Buscar cliente"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <button className="primary-action-button" onClick={openNewModal}>
                                        <Plus size={16} />
                                        Novo Cliente
                                    </button>
                                </div>
                            </div>

                            {/* Feedback */}
                            {feedback && (
                                <div className={`page-feedback ${feedback.type}`}>
                                    {feedback.message}
                                </div>
                            )}

                            {/* Table */}
                            <div className="client-table-wrapper">
                                <table className="client-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Telefone</th>
                                            <th>CPF/CNPJ</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="client-empty-state">
                                                    Nenhum cliente encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((client) => (
                                                <tr key={client.id}>
                                                    <td>{client.nome}</td>
                                                    <td>{client.email}</td>
                                                    <td>{client.telefone}</td>
                                                    <td>{client.cpf_cnpj}</td>
                                                    <td>
                                                        <div className="table-actions">
                                                            <button
                                                                className="table-action-button"
                                                                onClick={() => openEditModal(client)}
                                                            >
                                                                <Pencil size={14} />
                                                                Editar
                                                            </button>
                                                            <button
                                                                className="table-action-button danger"
                                                                onClick={() => handleRemove(client.id)}
                                                            >
                                                                <Trash2 size={14} />
                                                                Remover
                                                            </button>
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

            {/* Modal */}
            {modalOpen && (
                <div className="client-modal-overlay" onClick={closeModal}>
                    <div className="client-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="client-modal-header">
                            <div>
                                <h2>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                                <p>{editingClient ? 'Atualize os dados do cliente.' : 'Preencha os dados para cadastrar.'}</p>
                            </div>
                            <button className="modal-icon-button" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="client-form">
                            <label>
                                Nome *
                                <input
                                    type="text"
                                    name="nome"
                                    placeholder="Nome completo"
                                    value={form.nome}
                                    onChange={handleFormChange}
                                />
                            </label>
                            <label>
                                Email
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="email@exemplo.com"
                                    value={form.email}
                                    onChange={handleFormChange}
                                />
                            </label>
                            <label>
                                Telefone
                                <input
                                    type="text"
                                    name="telefone"
                                    placeholder="(00) 00000-0000"
                                    value={form.telefone}
                                    onChange={handleFormChange}
                                />
                            </label>
                            <label>
                                CPF / CNPJ
                                <input
                                    type="text"
                                    name="cpfCnpj"
                                    placeholder="000.000.000-00"
                                    value={form.cpfCnpj}
                                    onChange={handleFormChange}
                                />
                            </label>

                            <div className="client-form-actions">
                                <button className="secondary-action-button" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button
                                    className="primary-action-button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Salvando...' : editingClient ? 'Salvar alterações' : 'Cadastrar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
