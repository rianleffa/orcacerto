# Relatório PageSpeed - OrçaCerto

Data da análise: 13/10/2026  
Página analisada: https://orcacerto.vercel.app/

## Resultados dos relatórios

Os primeiros PDFs, gerados às 09:50 de 13/10/2026, registraram desempenho 85 no celular e 100 no computador. Os novos PDFs, gerados às 10:15 do mesmo dia, registraram:

| Categoria | Celular | Computador |
| --- | ---: | ---: |
| Desempenho | 88 | 100 |
| Acessibilidade | 72 | 86 |
| Práticas recomendadas | 100 | 100 |
| SEO | 100 | 100 |
| Navegação agêntica | 2/4 | 2/4 |

Nos novos relatórios, os problemas de acessibilidade e navegação agêntica continuam iguais. No celular: FCP 3,0 s, LCP 3,0 s, Speed Index 3,2 s, TBT 0 ms e CLS 0,072. O diagnóstico ainda estima 83 KiB de JavaScript não usado. No computador: FCP e LCP 0,7 s, Speed Index 0,7 s, TBT 0 ms e CLS 0,005.

## Alterações aplicadas

- Associados rótulos HTML aos três campos do simulador da página inicial.
- Adicionados nomes acessíveis aos botões de tema e menu móvel, incluindo o estado expandido do menu.
- Corrigida a sequência semântica dos títulos do simulador, da seção “Como funciona” e do rodapé.
- Reorganizada também a hierarquia de títulos nos três templates de orçamento exibidos na página inicial.
- Aumentado o contraste de textos pequenos, controles primários, ícones e cores de destaque na página inicial e nas prévias dos templates.
- Corrigida a estrutura do catálogo legado `ai-catalog.json` e publicados manifestos nos caminhos `.well-known` da especificação ARD atual e do formato anterior. O catálogo fica vazio porque o site não oferece atualmente ferramentas ou APIs próprias para agentes; isso evita anunciar capacidades inexistentes.
- Confirmado que a página inicial no código local contém um landmark `<main>` e um link para pular ao conteúdo. Esses elementos já estavam em alterações locais anteriores e foram preservados.

## Verificação

`npm run build` concluiu com sucesso após as alterações: TypeScript compilado e aplicação Vite gerada em `dist/`.

## Pendências para confirmar a meta de 100

Os novos PDFs confirmam que o site público ainda não recebeu o código corrigido: às 10:15, ele continuava apontando campos sem rótulos, botão sem nome acessível, contraste, ordem dos títulos, ausência de landmark principal e catálogo inválido. As correções descritas acima estão no workspace e precisam de publicação antes de uma nova medição. Nenhuma nota 100 está sendo declarada sem essa medição.

O relatório ainda aponta ausência do landmark principal, embora ele exista no código local atual. Isso também precisa ser confirmado na próxima medição após a publicação.
