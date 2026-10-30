# GIF de demonstração

O GIF do fluxo completo ainda não foi produzido. Nesta auditoria, a aplicação local foi aberta com configuração de exemplo, sem uma sessão Supabase de teste autorizada. O fluxo de orçamento é protegido por autenticação; portanto, não seria possível mostrar criação e salvamento reais sem uma conta válida. Não foi usado estado de sessão injetado, tela composta ou outro recurso para simular essas etapas.

Quando houver uma conta de teste autorizada, grave a aplicação real e salve a versão final em `docs/assets/orcacerto-fluxo.gif`. A captura deve mostrar, em aproximadamente 10 segundos:

1. Preencher e salvar um orçamento com dados totalmente fictícios.
2. Conferir a tela do orçamento salvo.
3. Baixar e abrir o PDF real.
4. Abrir a mensagem preparada pelo WhatsApp e parar antes de enviá-la.

Evite dados pessoais ou empresariais reais. Não envie mensagens para um cliente durante a gravação. Otimize o GIF para o GitHub e confira se os dados continuam legíveis. Depois que o arquivo for criado, adicione sua imagem no início do [`README.md`](../../README.md) e atualize esta nota com a data e o procedimento de captura.
