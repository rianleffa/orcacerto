// AI Service for OrçaCerto
// Prepared for OpenAI/Gemini API integration with smart heuristic mock generator

export interface AIImprovementRequest {
  shortDescription: string;
  category?: string;
  clientName?: string;
}

export interface AISuggestionResponse {
  improvedDescription: string;
  suggestedWarranty?: string;
  suggestedExecutionTime?: string;
  suggestedNotes?: string;
}

// Preset intelligent expansions for common trades & services in Brazil
const commonExpansions: Record<string, string> = {
  'eletrica': 'Execução de serviços elétricos especializados, contemplando revisão minuciosa de quadro de distribuição, instalação de disjuntores adequados à carga, passagem e fixação de fiação antichama conforme norma NBR 5410, e testes de continuidade e isolamento.',
  'instalacao eletrica': 'Execução de instalação elétrica residencial, incluindo instalação de pontos de iluminação, tomadas de uso geral e específico, passagem e organização da fiação com acabamento de alto padrão, conforme necessidades apresentadas pelo cliente.',
  'pintura': 'Preparação completa de superfície (lixamento, aplicação de fundo preparador e massa corrida/acrílica em imperfeições) e aplicação de 2 a 3 demãos de tinta premium de alta durabilidade e lavabilidade.',
  'reforma': 'Reforma e readequação estrutural de ambiente, incluindo demolição controlada, regularização de piso e alvenaria, acabamentos finos e descarte responsável de entulho.',
  'ar condicionado': 'Instalação e pressurização de sistema de ar-condicionado tipo Split/Inverter, com linha frigorígena em cobre isolado, dreno embutido, suporte reforçado, vácuo com vacuômetro digital e teste de rendimento térmico.',
  'marcenaria': 'Fabricação sob medida e montagem de mobiliário em MDF de primeira linha com revestimento melamínico, ferragens com amortecimento slow-motion e ajustes de precisão no local.',
  'limpeza': 'Higienização e limpeza técnica pós-obra detalhada, removendo resíduos de tintas, argamassa e poeira fina em vidros, pisos, esquadrias e metais sanitários com produtos químicos neutros e biodegradáveis.',
  'design': 'Desenvolvimento de identidade visual e projeto gráfico profissional, contemplando estudo de concorrência, manual da marca com guia de cores, tipografia e exportação dos arquivos em alta resolução para mídias físicas e digitais.',
  'site': 'Criação e desenvolvimento de website institucional responsivo de alta performance, otimizado para celulares (Mobile First), com integração a formulários de contato, WhatsApp e boas práticas de SEO.',
};

export async function improveDescriptionWithAI(prompt: string): Promise<string> {
  const clean = prompt.toLowerCase().trim();

  // If there's an API Key configured in the future, call external endpoint
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      // Future API call placeholder:
      // return await fetchAIEndpoint(prompt, apiKey);
    } catch (e) {
      console.warn('AI API failed, falling back to local smart engine', e);
    }
  }

  // Simulate network latency (300-600ms) for realistic UX feeling
  await new Promise((resolve) => setTimeout(resolve, 450));

  // Check matching keywords in common trades
  for (const [key, expanded] of Object.entries(commonExpansions)) {
    if (clean.includes(key)) {
      return expanded;
    }
  }

  // Generic intelligent professional formatting if not directly matched
  if (clean.length < 5) {
    return `Execução de serviço profissional de ${prompt}, incluindo fornecimento de mão de obra especializada, ferramental adequado e garantia de qualidade na entrega.`;
  }

  const capitalizedPrompt = prompt.charAt(0).toUpperCase() + prompt.slice(1);
  return `Prestação de serviços especializados para ${capitalizedPrompt}, contemplando análise prévia técnica, execução com mão de obra qualificada, aplicação de boas práticas do setor e testes finais de conformidade e acabamento.`;
}

export async function generateFollowUpMessage(
  type: 'first' | 'second' | 'discount',
  clientName: string,
  budgetNumber: string,
  totalValue: string
): Promise<string> {
  const firstName = clientName.split(' ')[0];

  if (type === 'first') {
    return `Olá, ${firstName}! Tudo bem? 👋\n\nPassando apenas para saber se você conseguiu analisar o orçamento ${budgetNumber} no valor de ${totalValue} que te enviei recentemente.\n\nFicou alguma dúvida sobre os itens ou prazos? Fico à disposição!`;
  }

  if (type === 'second') {
    return `Olá, ${firstName}! Como estão as coisas por aí? 😊\n\nEstou organizando a agenda de atendimentos das próximas semanas e gostaria de verificar se daremos seguimento ao orçamento ${budgetNumber}.\n\nSe precisar ajustar alguma condição ou item, me avise que adequamos para você!`;
  }

  return `Olá, ${firstName}! 🚀\n\nTenho uma boa notícia: consigo uma condição especial para fecharmos o orçamento ${budgetNumber} esta semana!\n\nPodemos conversar sobre as opções de pagamento?`;
}
