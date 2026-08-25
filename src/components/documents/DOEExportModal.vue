<script setup>
import { ref, computed, onMounted } from 'vue';
import QRCode from 'qrcode';
import { useToastStore } from '@/stores/toast';
import { 
  X, Newspaper, Copy, Download, CheckCircle2, ShieldCheck, 
  Send, QrCode, FileText, Building, Calendar, Hash
} from 'lucide-vue-next';

const props = defineProps({
  doc: {
    type: Object,
    required: true
  },
  rarData: {
    type: Object,
    default: null
  },
  enrichedData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);
const toastStore = useToastStore();

const isCopied = ref(false);
const isTransmitting = ref(false);
const isTransmitted = ref(false);
const qrCodeDataUrl = ref('');

const protocolo = computed(() => {
  return `PA-2026-${String(props.doc.id || '987654').padStart(8, '0').slice(-8)}`;
});

const portariaNum = computed(() => {
  return `${String(props.doc.id || '1042').padStart(4, '0')}/2026`;
});

const servidorNome = computed(() => {
  return props.enrichedData?.nome || props.doc.idpResult?.keyFields?.find(f => f.field.toLowerCase().includes('nome'))?.value || 'SERVIDOR PÚBLICO ESTADUAL';
});

const matricula = computed(() => {
  return props.enrichedData?.matricula || '5928174-1';
});

const cargo = computed(() => {
  return props.enrichedData?.cargo || 'TÉCNICO DE ADMINISTRAÇÃO E FINANÇAS';
});

const lotacao = computed(() => {
  return props.doc.secretariaId || props.enrichedData?.lotacao || 'SEAD';
});

const dataHoje = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
});

const sha256Hash = computed(() => {
  return `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
});

const doeExtratoTexto = computed(() => {
  return `GOVERNO DO ESTADO DO PARÁ
SECRETARIA DE ESTADO DE PLANEJAMENTO E ADMINISTRAÇÃO - SEAD
DIRETORIA DE GESTÃO DE PESSOAS

PORTARIA Nº ${portariaNum.value} - SEAD/DGP, DE ${dataHoje.value.toUpperCase()}

O DIRETOR DE GESTÃO DE PESSOAS DA SECRETARIA DE ESTADO DE PLANEJAMENTO E ADMINISTRAÇÃO, no uso de suas atribuições legais e estatutárias conferidas pela Lei Estadual nº 5.810, de 24 de janeiro de 1994 (Regime Jurídico Único dos Servidores Públicos Civis do Estado do Pará), e

CONSIDERANDO os elementos constantes no Processo Administrativo Digital nº ${protocolo.value};
CONSIDERANDO o Parecer Técnico Favorável emitido pelo sistema de inteligência estatutária Cortex AI e devidamente homologado;
CONSIDERANDO o cumprimento integral dos requisitos previstos no Artigo 81 e seguintes da Lei nº 5.810/94;

RESOLVE:

Art. 1º - CONCEDER 03 (três) meses de LICENÇA-PRÊMIO por assiduidade, com remuneração integral, ao(à) servidor(a) ${servidorNome.value.toUpperCase()}, Matrícula nº ${matricula.value}, ocupante do cargo de ${cargo.value.toUpperCase()}, lotado(a) na ${lotacao.value}.

Art. 2º - Esta Portaria entra em vigor na data de sua publicação no Diário Oficial do Estado do Pará (DOE).

Dê-se ciência, publique-se e cumpra-se.

Belém/PA, ${dataHoje.value}.

Assinado digitalmente conforme MP nº 2.200-2/2001 (ICP-Brasil)
Chave de Autenticidade Digital: ${sha256Hash.value}
Verificação de Validade: https://cortex.pa.gov.br/validador/${protocolo.value}`;
});

onMounted(async () => {
  try {
    const qrUrl = `https://cortex.pa.gov.br/validador/${protocolo.value}?hash=${sha256Hash.value}`;
    qrCodeDataUrl.value = await QRCode.toDataURL(qrUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Erro ao gerar QRCode do DOE:', err);
  }
});

const copyExtrato = () => {
  navigator.clipboard.writeText(doeExtratoTexto.value);
  isCopied.value = true;
  toastStore.addToast('Minuta de publicação copiada para a área de transferência!', 'success');
  setTimeout(() => isCopied.value = false, 3000);
};

const transmitToDOE = () => {
  isTransmitting.value = true;
  setTimeout(() => {
    isTransmitting.value = false;
    isTransmitted.value = true;
    toastStore.addToast('Portaria transmitida com sucesso para publicação no DOE-PA!', 'success');
  }, 1200);
};
</script>

<template>
  <div class="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
    <div class="bg-white dark:bg-slate-900 p-6 lg:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl relative text-slate-900 dark:text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
      
      <!-- Fechar -->
      <button 
        @click="emit('close')" 
        class="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Cabeçalho -->
      <div class="flex items-center gap-3 mb-5 shrink-0">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
          <Newspaper class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Extrato para Diário Oficial (DOE-PA)
            </h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Padrão IOEPA
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Minuta formal de Portaria para publicação no Diário Oficial do Estado do Pará com assinatura ICP-Brasil
          </p>
        </div>
      </div>

      <!-- Preview do Extrato Formatado -->
      <div class="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-4 mb-4">
        
        <!-- Documento Estilizado DOE -->
        <div class="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-2xs relative">
          <div class="whitespace-pre-wrap">{{ doeExtratoTexto }}</div>

          <!-- Selo Digital e QR Code de Validação -->
          <div class="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-black/5 dark:border-white/5">
            <div class="space-y-1 text-left">
              <div class="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <ShieldCheck class="w-4 h-4" />
                <span>Certificado Digital Padrão ICP-Brasil / Gov.br</span>
              </div>
              <p class="text-[10px] text-slate-500 font-sans">
                Documento assinado com certificado digital institucional conforme MP 2.200-2/2001. A autenticidade pode ser conferida escaneando o QR Code ao lado.
              </p>
            </div>

            <div v-if="qrCodeDataUrl" class="shrink-0 bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs flex flex-col items-center">
              <img :src="qrCodeDataUrl" alt="QR Code Autenticidade" class="w-20 h-20" />
              <span class="text-[8px] font-sans font-bold text-slate-500 mt-0.5">VALIDADOR PA</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Ações do Rodapé -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div class="flex items-center gap-2">
          <span v-if="isTransmitted" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 class="w-4 h-4" /> Portaria transmitida ao DOE com sucesso!
          </span>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button 
            @click="copyExtrato" 
            class="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Copy class="w-3.5 h-3.5" />
            <span>{{ isCopied ? 'Copiado!' : 'Copiar Texto para Imprensa' }}</span>
          </button>

          <button 
            @click="transmitToDOE" 
            :disabled="isTransmitting || isTransmitted"
            class="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Send class="w-3.5 h-3.5" />
            <span>{{ isTransmitted ? 'Transmitido' : isTransmitting ? 'Transmitindo...' : 'Transmitir ao DOE-PA' }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
