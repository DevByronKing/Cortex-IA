import { onMounted } from 'vue';
import { supabase, isSupabaseConfigured } from '@/libs/supabase';
import { supabaseDb, useSupabaseTable } from '@/composables/useSupabase';

export function useSeeder() {
  const DEFAULT_RULES = [
    { 
      id: "REGRA_ESTAB_01", 
      nome: "Verificar Estágio Probatório", 
      processo: "progressao_funcional", 
      status: "Ativa", 
      condicoes: [{ fato: "tempo_de_servico_em_anos", operador: "<", valor: 3 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Servidor ainda em estágio probatório (menos de 3 anos)." },
      descricao: "A estabilidade e progressão dependem do fim do estágio probatório (Art. 31 da Lei 5.810/94)."
    },
    { 
      id: "REGRA_FERIAS_01", 
      nome: "Limite Constitucional (Férias)", 
      processo: "solicitacao_ferias", 
      status: "Ativa", 
      condicoes: [{ fato: "dias_solicitados", operador: ">", valor: 30 }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Solicitação excede o limite de 30 dias anuais." },
      descricao: "O gozo de férias não pode exceder 30 dias por período aquisitivo."
    },
    { 
      id: "REGRA_MAT_01", 
      nome: "Prazo Licença Maternidade", 
      processo: "licenca_maternidade", 
      status: "Ativa", 
      condicoes: [{ fato: "dias_solicitados", operador: ">", valor: 180 }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Solicitação excede o limite legal de 180 dias." },
      descricao: "Verifica se o atestado ou pedido excede o teto de 180 dias."
    },
    { 
      id: "REGRA_PREMIO_01", 
      nome: "Interstício Licença Prêmio (Quinquênio)", 
      processo: "licenca_premio", 
      status: "Ativa", 
      condicoes: [{ fato: "tempo_de_servico_em_anos", operador: "<", valor: 5 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Servidor não completou o quinquênio (5 anos ininterruptos)." },
      descricao: "Exige 5 anos de efetivo exercício para concessão de licença-prêmio (Art. 81 da Lei 5.810/94)."
    },
    { 
      id: "REGRA_CAPACIT_01", 
      nome: "Interstício Capacitação", 
      processo: "licenca_capacitacao", 
      status: "Ativa", 
      condicoes: [{ fato: "tempo_de_servico_em_anos", operador: "<", valor: 5 }], 
      acao_se_verdadeiro: { status: "REJEITADO", mensagem: "Necessário 5 anos de serviço para licença de aprimoramento." },
      descricao: "Licença para aprimoramento profissional exige interstício de 5 anos."
    },
    { 
      id: "REGRA_TITUL_01", 
      nome: "Comprovação de Titulação", 
      processo: "adicional_titulacao", 
      status: "Ativa", 
      condicoes: [{ fato: "titulacao", operador: "==", valor: "Nenhuma" }], 
      acao_se_verdadeiro: { status: "FALHA", mensagem: "Nenhuma titulação válida identificada na documentação." },
      descricao: "Verifica a existência de título acadêmico válido."
    }
  ];

  onMounted(async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.from('rules').select('id');
        if (!error && (!data || data.length === 0)) {
          console.log("[SEEDER] Semeando regras no Supabase...");
          for (const rule of DEFAULT_RULES) {
            await supabase.from('rules').upsert(rule);
          }
        }
      } else {
        // Local fallback
        const { data: currentRules } = useSupabaseTable('rules');
        if (currentRules.value.length === 0) {
          for (const rule of DEFAULT_RULES) {
            await supabaseDb.insert('rules', rule);
          }
        }
      }
    } catch (e) {
      console.warn("[SEEDER] Aviso:", e.message);
    }
  });
}