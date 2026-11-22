# Geração Solar — app mobile (Android / iOS)

App multiplataforma (**Expo SDK 58 + React Native + TypeScript + expo-router**) para acompanhar a geração solar,
créditos, faturas e custos do sistema [`mirahy/geracao`](https://github.com/mirahy/geracao) (Laravel + Filament).

## Telas
- **Login** — servidor (URL do `geracao`), e-mail e senha; token guardado no armazenamento seguro do aparelho.
- **Painel** — KPIs (geração, injetado, autoconsumo, saldo de créditos, economia, resultado líquido, custos) e gráficos mensais; filtro por UC e período.
- **Unidades** — lista de UCs com saldo/custo/economia; toque para ver o dashboard individual.
- **Geração** — histórico e lançamento da geração mensal das placas (requer permissão `geracao.editar`).
- **Faturas** — faturas por UC (vencimento, pagamento, consumo, compensado, economia).
- **Conta** — usuário e sair. Tema claro/escuro automático.

## Rodando
```bash
npm install
npx expo start           # a (Android) · i (iOS) · ou escaneie o QR com o Expo Go
```
URL padrão do servidor: `EXPO_PUBLIC_API_URL` (ex.: `http://192.168.0.10:8000`); no emulador Android `http://10.0.2.2:8000`. Também dá para editá-la na tela de login.

```bash
npm run typecheck && npm test
npx eas build -p android   # / -p ios — builds de loja (requer conta Expo)
```

## Backend
O `geracao` ainda não expõe API. Em [`backend/`](backend/README.md) estão os controllers e rotas `v1`
(Sanctum) prontos para copiar para o repositório `geracao`, com as instruções.
