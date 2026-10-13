# Relatório PageSpeed — OrçaCerto

Data: 13/10/2026
Página medida: https://orcacerto.vercel.app/
Publicação em produção: commit `b55aa79` — deploy concluído na Vercel.

## Resultado final

Medição PageSpeed Insights gerada às 10:50 BRT, após a publicação das correções:

| Categoria | Celular | Computador |
| --- | ---: | ---: |
| Desempenho | 100 | 100 |
| Acessibilidade | 100 | 100 |
| Práticas recomendadas | 100 | 100 |
| SEO | 100 | 100 |
| Navegação agêntica | 4/4 | 4/4 |

Métricas da mesma medição:

| Métrica | Celular | Computador |
| --- | ---: | ---: |
| FCP | 1,4 s | 0,4 s |
| LCP | 1,5 s | 0,4 s |
| TBT | 0 ms | 40 ms |
| CLS | 0 | 0 |
| Speed Index | 1,4 s | 0,8 s |

[Abrir relatório no celular](https://pagespeed.web.dev/analysis/https-orcacerto-vercel-app/m911h0or2l?form_factor=mobile) · [Abrir relatório no computador](https://pagespeed.web.dev/analysis/https-orcacerto-vercel-app/m911h0or2l?form_factor=desktop)

## Comparação com os PDFs enviados

Os PDFs de 13/10/2026 às 10:15 mostravam desempenho/acessibilidade de **88/72 no celular** e **100/86 no computador**. Práticas recomendadas e SEO estavam em 100; navegação agêntica estava em 2/4.

Depois das correções, o PageSpeed apontou **100 nas quatro categorias** e **4/4 em navegação agêntica** nos dois formatos. Acessibilidade chegou a 100 após a correção de contraste.

## O que foi corrigido

- Campos do simulador receberam rótulos associados; botões de tema e menu receberam nomes acessíveis e estado do menu.
- Link para pular ao conteúdo principal e hierarquia de títulos da landing page e dos modelos foram ajustados.
- Contraste reforçado no logotipo, números dos passos, etiquetas e botão do simulador e textos do rodapé.
- Página inicial separada das rotas autenticadas: Supabase e telas internas carregam somente quando necessárias.
- Fontes externas do Google removidas; a página usa fontes do sistema. O checkout Cakto é carregado sob demanda.
- Arquivos do catálogo legado e manifestos `.well-known` foram corrigidos. O catálogo não anuncia ferramentas de agente que o produto não oferece.
- Regras de cache da Vercel foram reescritas em padrões individuais válidos. As regras de cache dos assets e os cabeçalhos de segurança foram preservados.

## Publicação e validação

- A produção ainda apontava para o commit antigo `8adb675`, que não continha as correções. O primeiro deploy revelou um padrão inválido nas regras de cabeçalho do `vercel.json`.
- O padrão foi corrigido; o deploy de produção `b55aa79` concluiu com status Ready na Vercel a partir de `main`, e o site atualizado foi confirmado em `https://orcacerto.vercel.app/`.
- `npm run build` passou após os ajustes de contraste.
- O alerta de contraste desapareceu do relatório; a nota de acessibilidade passou de 96 para 100.

## Observações

- As notas de desempenho variaram entre execuções do Lighthouse: houve uma rodada intermediária com 76 no celular e outra com 99 no computador; medições repetidas depois registraram 100 em ambos. O próprio PageSpeed informa que as estimativas podem variar entre execuções.
- O PageSpeed não encontrou dados de usuários reais para essa página; as notas acima são medições de laboratório.
- A nota automática de acessibilidade ficou em 100. O relatório ainda lista verificações manuais; a nota não substitui uma avaliação manual completa.
