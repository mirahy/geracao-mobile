# Geração Solar — app mobile (Android / iOS)

App multiplataforma (**Expo SDK 58 + React Native + TypeScript + expo-router**) para acompanhar a geração solar,
créditos, faturas e custos do sistema [`mirahy/geracao`](https://github.com/mirahy/geracao) (Laravel + Filament).

## Telas
- **Login** — e-mail e senha; o servidor é fixo no build. O token (com expiração definida pela API) fica no armazenamento seguro; vencido, pede novo login.
- **Painel** — KPIs (geração, injetado, autoconsumo, saldo de créditos, economia, resultado líquido, custos) e gráficos mensais; filtro por UC e por **período**: últimos 6/12 meses, tudo, um **mês específico** ou um **intervalo** (de/até). O mesmo filtro existe na tela de cada unidade, em Geração e em Faturas.
- **Unidades** — lista de UCs com saldo/custo/economia; toque para ver o dashboard individual.
- **Geração** — histórico, lançamento manual, **importação da planilha diária (.xlsx)** do inversor com tela de **revisão** dos meses incompletos/divergentes, e exclusão (segurar o item). Requer `geracao.editar`.
- **Faturas** — faturas por UC (vencimento, pagamento, consumo, compensado, economia) **abrir a fatura (PDF original)** direto no leitor de PDF do aparelho, e **importação de PDFs** (faturas e demonstrativos; requer `documentos.importar`).
- **Rateio** — situação devido × pago por UC/mês, lista de pagamentos, lançamento manual ou por comprovante (PDF/imagem lido pela API), visualização do comprovante (baixado com o token e aberto direto no leitor do aparelho) e exclusão (segurar o item). Requer `pagamentos.ver` / `pagamentos.editar`.
- **Conta** (ícone 👤 no topo) — usuário, **Editar meu perfil** (nome, e-mail e troca de senha), **Administração** e sair. As abas e seções só aparecem para quem tem a permissão correspondente (Geração também exige alcançar uma unidade geradora). Tema claro/escuro automático.
- **Administração** (conforme as permissões do perfil): **Usuários** (cadastro, perfis, acesso por unidade, liberar unidade solicitada), **Perfis e permissões**, **Solicitações de acesso** (aprovar/recusar, uma a uma ou **em lote**), **Unidades consumidoras**, **Parcelas das placas** **Importações** (histórico e exclusão) e **Registro de atividades** (acessos, visualizações e alterações, com filtros por tipo, usuário, período e busca; requer `logs.ver`).

## Rodando
```bash
npm install
npx expo start           # a (Android) · i (iOS) · ou escaneie o QR com o Expo Go
```
O servidor é definido no build, não pelo usuário: `EXPO_PUBLIC_API_URL` (ex.: `http://192.168.0.10:8000`; emulador Android `http://10.0.2.2:8000`) ou `extra.apiUrl` no `app.json`. Para os builds EAS, ajuste a URL em `eas.json`.

```bash
npm run typecheck && npm test
npx eas build -p android   # / -p ios — builds de loja (requer conta Expo)
```

## Backend
A API `v1` (Sanctum) já faz parte do repositório [`geracao`](https://github.com/mirahy/geracao): login com expiração de token, painel, unidades, faturas, geração e rateio.
