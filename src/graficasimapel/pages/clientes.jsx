import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Menu, LayoutDashboard, Package, AlignEndHorizontal,
    Wallet, Users, Bell, Search, Settings, Pencil,
    Trash2, UserPlus, X, Sun, Moon
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { getApprovedSession } from '../lib/auth';
import { useStoredTheme } from '../lib/theme';

const emptyForm = {
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
};

// Extrai o nome e as iniciais do usuário logado para mostrar no perfil
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

// Aplica a máscara visual de telefone (Ex: (11) 99999-9999)
function formatTelefone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 2) {
        return digits ? `(${digits}` : '';
    }

    if (digits.length <= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Aplica a máscara visual de CPF ou CNPJ conforme o tamanho da string
function formatCpfCnpj(value) {
    const digits = value.replace(/\D/g, '').slice(0, 14);

    if (digits.length <= 11) {
        if (digits.length <= 3) {
            return digits;
        }

        if (digits.length <= 6) {
            return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        }

        if (digits.length <= 9) {
            return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        }

        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }

    if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export default function Clientes() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState('');
    const [isLoadingClientes, setIsLoadingClientes] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [editingClientId, setEditingClientId] = useState(null);
    const [savingClient, setSavingClient] = useState(false);
    const [removingClientId, setRemovingClientId] = useState(null);
    const [pageMessage, setPageMessage] = useState({ type: '', message: '' });
    const [userLabel, setUserLabel] = useState('Usuario');
    const [userInitials, setUserInitials] = useState('US');
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();
    const { theme, toggleTheme } = useStoredTheme();

    // READ: Busca todos os clientes cadastrados no banco de dados
    const loadClientes = async () => {
        setIsLoadingClientes(true);

        const { data, error } = await supabase
            .from('clientes')
            .select('id, nome, email, telefone, cpf_cnpj, criado_em')
            .order('criado_em', { ascending: false });

        if (error) {
            console.error(error);
            setPageMessage({
                type: 'error',
                message: 'Nao foi possivel carregar os clientes. Confira a tabela public.clientes no Supabase.',
            });
            setClientes([]);
        } else {
            setClientes(data || []);
        }

        setIsLoadingClientes(false);
    };

    // Valida o login e ativa o canal "realtime" para atualizar a tabela automaticamente se houver mudanças no banco
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
            await loadClientes();
        };

        validateSession();

        const {
            data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!session) {
                router.replace('/Login');
                return;
            }

            const { session: approvedSession, profile } = await getApprovedSession();

            if (!approvedSession) {
                router.replace('/Login');
                return;
            }

            const { label, initials } = getUserPresentation(approvedSession);
            setUserLabel(label);
            setUserInitials(initials);
            setIsAdmin(Boolean(profile?.is_admin));
            setIsCheckingAuth(false);
        });

        const clientesChannel = supabase
            .channel('clientes-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'clientes' },
                () => {
                    loadClientes();
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            authSubscription.unsubscribe();
            supabase.removeChannel(clientesChannel);
        };
    }, [router]);

    // Filtra os clientes na tela de acordo com o que foi digitado na barra de pesquisa
    const clientesFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) {
            return clientes;
        }

        return clientes.filter((cliente) =>
            [cliente.nome, cliente.email, cliente.telefone, cliente.cpf_cnpj]
                .filter(Boolean)
                .some((valor) => valor.toLowerCase().includes(termo))
        );
    }, [busca, clientes]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    // Funções de controle do Modal (abrir limpo para criar ou preenchido para editar)
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClientId(null);
        setFormData(emptyForm);
    };

    const openCreateModal = () => {
        setPageMessage({ type: '', message: '' });
        setEditingClientId(null);
        setFormData(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (cliente) => {
        setPageMessage({ type: '', message: '' });
        setEditingClientId(cliente.id);
        setFormData({
            nome: cliente.nome || '',
            email: cliente.email || '',
            telefone: formatTelefone(cliente.telefone || ''),
            cpf_cnpj: formatCpfCnpj(cliente.cpf_cnpj || ''),
        });
        setIsModalOpen(true);
    };

    // Atualiza os estados do formulário em tempo real enquanto o usuário digita
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        let nextValue = value;

        if (name === 'telefone') {
            nextValue = formatTelefone(value);
        }

        if (name === 'cpf_cnpj') {
            nextValue = formatCpfCnpj(value);
        }

        setFormData((current) => ({
            ...current,
            [name]: nextValue,
        }));
    };

    // CREATE e UPDATE: Verifica se há um ID em edição. Se sim, atualiza; se não, insere novo cliente
    const handleSubmit = async (event) => {
        event.preventDefault();
        setSavingClient(true);
        setPageMessage({ type: '', message: '' });

        const payload = {
            nome: formData.nome.trim(),
            email: formData.email.trim() || null,
            telefone: formData.telefone.trim() || null,
            cpf_cnpj: formData.cpf_cnpj.trim() || null,
        };

        let response;

        if (editingClientId) {
            response = await supabase.from('clientes').update(payload).eq('id', editingClientId);
        } else {
            response = await supabase.from('clientes').insert(payload);
        }

        if (response.error) {
            console.error(response.error);
            setPageMessage({
                type: 'error',
                message: response.error.message || 'Nao foi possivel salvar o cliente.',
            });
            setSavingClient(false);
            return;
        }

        await loadClientes();
        closeModal();
        setPageMessage({
            type: 'success',
            message: editingClientId ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.',
        });
        setSavingClient(false);
    };

const handleRemove = async (cliente) => {
        const confirmed = window.confirm(`Deseja remover o cliente ${cliente.nome}?`);

        if (!confirmed) {
            return;
        }

        setRemovingClientId(cliente.id);
        setPageMessage({ type: '', message: '' });

        const { error } = await supabase.from('clientes').delete().eq('id', cliente.id);

        if (error) {
            console.error(error);
            
            //Verifica se o erro é de Chave Estrangeira
            let mensagemErro = error.message;
            if (mensagemErro.includes("foreign key constraint") || mensagemErro.includes("pedidos_cliente_id_fkey")) {
                mensagemErro = 'Não é possível remover este cliente, pois ele possui pedidos vinculados. Exclua os pedidos dele primeiro.';
            } else {
                mensagemErro = 'Não foi possível remover o cliente. Tente novamente.';
            }

            setPageMessage({
                type: 'error',
                message: mensagemErro,
            });
            setRemovingClientId(null);
            return;
        }

        await loadClientes();
        setPageMessage({
            type: 'success',
            message: 'Cliente removido com sucesso.',
        });
        setRemovingClientId(null);
    };

    if (isCheckingAuth) {
        return <div className="dash-layout"><div className="dash-main" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>Carregando...</div></div>;
    }

    return (
        <>
            <Head>
                <title>Clientes - Grafica Simapel</title>
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
                        <div 
                            className={`menu-item ${router.pathname === '/pedidos' ? 'active' : ''}`} 
                            onClick={() => router.push('/pedidos')} 
                            style={{ cursor: 'pointer' }}
                        >
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
                            <div className="menu-item active" onClick={() => router.push('/clientes')}>
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

                <div className="dash-main">
                    <nav className="dash-navbar">
                        <div className="nav-left">
                            <button onClick={toggleSidebar} className="toggle-btn">
                                <Menu size={24} />
                            </button>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>Clientes</h2>
                        </div>

                        <div className="nav-right">
                            <div className="client-search-box">
                                <Search size={18} color="var(--text-secondary)" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente"
                                    value={busca}
                                    onChange={(event) => setBusca(event.target.value)}
                                />
                            </div>
                            <button onClick={toggleTheme} className="theme-toggle-btn">
                                {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
                            </button>

                            <Bell size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />

                            <div className="user-profile">
                                <div className="avatar">{userInitials}</div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{userLabel}</span>
                            </div>
                        </div>
                    </nav>

                    <div className="dash-content">
                        <div className="dash-card client-card">
                            <div className="client-header-row">
                                <div>
                                    <h3 style={{color: 'var(--text-primary)'}}>Clientes cadastrados</h3>
                                    <p className="client-subtitle" style={{color: 'var(--text-secondary)'}}>Cadastre, edite e remova clientes com sincronizacao automatica.</p>
                                </div>

                                <button className="primary-action-button" type="button" onClick={openCreateModal}>
                                    <UserPlus size={18} color='white'/>
                                    Novo Cliente
                                </button>
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
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Telefone</th>
                                            <th>CPF/CNPJ</th>
                                            <th>Acoes</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{color: 'var(--text-primary)'}}>
                                        {isLoadingClientes ? (
                                            <tr>
                                                <td colSpan={5} className="client-empty-state">Carregando clientes...</td>
                                            </tr>
                                        ) : clientesFiltrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="client-empty-state">
                                                    Nenhum cliente encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            clientesFiltrados.map((cliente) => (
                                                <tr key={cliente.id}>
                                                    <td>{cliente.nome}</td>
                                                    <td>{cliente.email || '-'}</td>
                                                    <td>{formatTelefone(cliente.telefone || '') || '-'}</td>
                                                    <td>{formatCpfCnpj(cliente.cpf_cnpj || '') || '-'}</td>
                                                    <td>
                                                        <div className="table-actions">
                                                            <button type="button" className="table-action-button" onClick={() => openEditModal(cliente)}>
                                                                <Pencil size={16} />
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="table-action-button danger"
                                                                onClick={() => handleRemove(cliente)}
                                                                disabled={removingClientId === cliente.id}
                                                            >
                                                                <Trash2 size={16} />
                                                                {removingClientId === cliente.id ? 'Removendo...' : 'Remover'}
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

            {isModalOpen && (
                <div className="client-modal-overlay" onClick={closeModal}>
                    <div className="client-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="client-modal-header">
                            <div>
                                <h2 style={{color: 'var(--text-primary)'}}>{editingClientId ? 'Editar cliente' : 'Novo cliente'}</h2>
                                <p style={{color: 'var(--text-secondary)'}}>Preencha os dados para salvar na tabela de clientes.</p>
                            </div>
                            <button type="button" className="modal-icon-button" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className="client-form" onSubmit={handleSubmit}>
                            <label style={{color: 'var(--text-primary)'}}>
                                Nome
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                />
                            </label>

                            <label style={{color: 'var(--text-primary)'}}>
                                Email
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </label>

                            <label style={{color: 'var(--text-primary)'}}>
                                Telefone
                                <input
                                    type="text"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleInputChange}
                                    placeholder="(11) 11111-1111"
                                    inputMode="numeric"
                                    maxLength={15}
                                />
                            </label>

                            <label style={{color: 'var(--text-primary)'}}>
                                CPF/CNPJ
                                <input
                                    type="text"
                                    name="cpf_cnpj"
                                    value={formData.cpf_cnpj}
                                    onChange={handleInputChange}
                                    placeholder="111.111.111-11"
                                    inputMode="numeric"
                                    maxLength={18}
                                />
                            </label>

                            <div className="client-form-actions">
                                <button type="button" className="secondary-action-button" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="primary-action-button" disabled={savingClient}>
                                    {savingClient ? 'Salvando...' : editingClientId ? 'Salvar alteracoes' : 'Cadastrar cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
