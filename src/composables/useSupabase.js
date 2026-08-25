import { ref, watchEffect } from 'vue';
import { supabase, isSupabaseConfigured } from '@/libs/supabase';

// Armazenamento em memória local compartilhado para modo de desenvolvimento/demo
const localStore = {
  processes: ref([]),
  rules: ref([]),
  servidores: ref([
    {
      id: '1',
      nome: 'João Carlos de Almeida Barbosa',
      matricula: '892341-9',
      cargo: 'Auditor Fiscal de Receitas Estaduais',
      lotacao: 'SEFA/PA',
      data_admissao: '2010-03-15',
      tempo_de_servico_em_anos: 14.5,
      regime: 'Estatutário'
    },
    {
      id: '2',
      nome: 'Maria Oliveira da Silva',
      matricula: '771234-2',
      cargo: 'Técnica em Gestão Pública',
      lotacao: 'SEAD/PA',
      data_admissao: '2018-02-01',
      tempo_de_servico_em_anos: 6.5,
      regime: 'Estatutário'
    },
    {
      id: '3',
      nome: 'Carlos Eduardo Santos',
      matricula: '554321-0',
      cargo: 'Especialista em Educação Básica',
      lotacao: 'SEDUC/PA',
      data_admissao: '2022-08-10',
      tempo_de_servico_em_anos: 2.0,
      regime: 'Estatutário'
    }
  ]),
  audit_logs: ref([])
};

/**
 * Composable reativo para tabelas do Supabase com suporte a Realtime e fallback transparente.
 * @param {string|Ref<string>} tableNameRef - Nome da tabela (ex: 'processes', 'rules', 'servidores')
 */
export function useSupabaseTable(tableNameRef) {
  const data = ref([]);
  const loading = ref(true);
  const error = ref(null);

  const getTableName = () => {
    return typeof tableNameRef === 'string' ? tableNameRef : tableNameRef?.value;
  };

  const fetchSupabaseData = async (table) => {
    if (!table) return;

    if (!isSupabaseConfigured()) {
      if (!localStore[table]) localStore[table] = ref([]);
      data.value = localStore[table].value;
      loading.value = false;
      return;
    }

    try {
      loading.value = true;
      const { data: rows, error: fetchErr } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      data.value = rows || [];
      error.value = null;
    } catch (err) {
      console.warn(`Supabase offline ou não configurado para [${table}], usando store local:`, err.message);
      if (!localStore[table]) localStore[table] = ref([]);
      data.value = localStore[table].value;
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  watchEffect((onInvalidate) => {
    const table = getTableName();
    if (!table) {
      loading.value = false;
      return;
    }

    fetchSupabaseData(table);

    // Se estiver conectado ao Supabase, escuta via Realtime Postgres Changes
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table },
          () => {
            fetchSupabaseData(table);
          }
        )
        .subscribe();

      onInvalidate(() => {
        supabase.removeChannel(channel);
      });
    }
  });

  return { data, loading, error, refresh: () => fetchSupabaseData(getTableName()) };
}

/**
 * Métodos de mutação para tabelas Supabase com suporte a fallback local
 */
export const supabaseDb = {
  async insert(table, record) {
    const id = record.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`);
    const newRecord = {
      ...record,
      id,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from(table).insert([newRecord]).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn(`Erro no insert Supabase (${table}):`, err.message);
      }
    }

    // Local fallback
    if (!localStore[table]) localStore[table] = ref([]);
    localStore[table].value = [newRecord, ...localStore[table].value];
    return newRecord;
  },

  async update(table, id, updates) {
    const updatedFields = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from(table).update(updatedFields).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn(`Erro no update Supabase (${table}):`, err.message);
      }
    }

    // Local fallback
    if (localStore[table]) {
      const index = localStore[table].value.findIndex(item => item.id === id);
      if (index !== -1) {
        localStore[table].value[index] = { ...localStore[table].value[index], ...updatedFields };
        localStore[table].value = [...localStore[table].value];
      }
    }
    return updatedFields;
  },

  async delete(table, id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn(`Erro no delete Supabase (${table}):`, err.message);
      }
    }

    // Local fallback
    if (localStore[table]) {
      localStore[table].value = localStore[table].value.filter(item => item.id !== id);
    }
  }
};
