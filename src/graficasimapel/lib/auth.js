import { supabase } from '../SupabaseClient';

export const PROFILE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

export function getFriendlyErrorMessage(error) {
    if (!error) return 'Erro desconhecido. Tente novamente.';

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
        normalized.includes('could not find the table') ||
        normalized.includes('relation does not exist') ||
        normalized.includes('42p01') ||
        normalized.includes('42703')
    ) {
        return 'Schema do banco de dados nao configurado. Execute o SQL de configuracao.';
    }

    // Erros de serialização/JSON
    if (
        normalized.includes('cannot coerce') ||
        normalized.includes('could not deserialize') ||
        normalized.includes('json') ||
        normalized.includes('unexpected token')
    ) {
        return 'Erro ao processar resposta do servidor. Tente novamente.';
    }

    // Erros de permissão RLS
    if (
        normalized.includes('policy violation') ||
        normalized.includes('violates row level security')
    ) {
        return 'Voce nao possui permissao para realizar esta operacao.';
    }

    // Erros de conflito de dados
    if (normalized.includes('duplicate') || normalized.includes('23505')) {
        return 'Registro ja existe no banco de dados.';
    }

    // Erros de validação
    if (normalized.includes('not null') || normalized.includes('violates not-null')) {
        return 'Campos obrigatorios nao foram preenchidos.';
    }

    if (normalized.includes('foreign key')) {
        return 'Referencia invalida no banco de dados.';
    }

    // Fallback
    return message || 'Erro ao processar a operacao. Tente novamente.';
}

export function getUserPresentationFromSession(session) {
    const label = session?.user?.user_metadata?.nome || session?.user?.email || 'Usuario';
    const initials = label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'US';

    return { label, initials };
}

export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('access_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

export async function createSignupAccessRequest(user) {
    if (!user?.id || !user?.email) {
        return null;
    }

    const payload = {
        user_id: user.id,
        nome: user.user_metadata?.nome || user.email,
        email: user.email,
        status: PROFILE_STATUS.PENDING,
        requested_admin: false,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('access_requests')
        .insert(payload);

    if (error) {
        if (error.code === '23505') {
            const { data: updatedData, error: updateError } = await supabase
                .from('access_requests')
                .update({
                    status: PROFILE_STATUS.PENDING,
                    updated_at: new Date().toISOString(),
                })
                .eq('email', user.email)
                .neq('status', PROFILE_STATUS.APPROVED)
                .select()
                .limit(1)
                .single();

            if (updateError) {
                throw updateError;
            }

            return updatedData || null;
        }

        throw error;
    }

    if (Array.isArray(data) && data.length > 0) {
        return data[0];
    }

    return null;
}

export async function createPendingProfile(user) {
    const profile = await getProfile(user.id);
    const payload = {
        id: user.id,
        nome: user.user_metadata?.nome || user.email,
        email: user.email,
        status: PROFILE_STATUS.PENDING,
        is_admin: false,
    };

    if (!profile) {
        const rpcResponse = await supabase.rpc('request_access_profile');

        if (!rpcResponse.error && rpcResponse.data) {
            return rpcResponse.data;
        }

        if (rpcResponse.error && rpcResponse.error.code !== '42883') {
            console.warn(rpcResponse.error);
        }

        const { data, error } = await supabase
            .from('access_profiles')
            .insert(payload)
            .select();

        if (error) {
            throw error;
        }

        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }

        return await getProfile(user.id);
    }

    if (profile.status === PROFILE_STATUS.REJECTED) {
        const rpcResponse = await supabase.rpc('request_access_profile');

        if (!rpcResponse.error && rpcResponse.data) {
            return rpcResponse.data;
        }

        if (rpcResponse.error && rpcResponse.error.code !== '42883') {
            console.warn(rpcResponse.error);
        }

        const { data, error } = await supabase
            .from('access_profiles')
            .update({
                status: PROFILE_STATUS.PENDING,
                is_admin: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select();

        if (error) {
            throw error;
        }

        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }

        return await getProfile(user.id);
    }

    return profile;
}

export async function getApprovedSession() {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return { session: null, profile: null, reason: 'not-authenticated' };
    }

    let profile;

    try {
        profile = await getProfile(session.user.id);

        if (!profile) {
            profile = await createPendingProfile(session.user);
        }
    } catch (error) {
        console.error(error);
        await supabase.auth.signOut();
        return { session: null, profile: null, reason: 'profile-error', error };
    }

    if (profile.status !== PROFILE_STATUS.APPROVED) {
        await supabase.auth.signOut();
        return { session: null, profile, reason: profile.status };
    }

    return { session, profile, reason: 'approved' };
}
