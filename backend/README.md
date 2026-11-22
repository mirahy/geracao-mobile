# API para o app mobile (aplicar no repositório `geracao`)

O sistema `geracao` só tem painel Filament; estes arquivos adicionam a API REST `v1` que o app consome.
Reaproveita `EnergyDashboard`, as permissões (`painel.ver`, `faturas.ver`, `geracao.editar`…) e o
escopo por unidade (`AccessibleUnitsScope`), então cada usuário só vê as UCs a que tem acesso.

> Requer **laravel/sanctum** (autenticação por token) — nova dependência, que o `CLAUDE.md` do `geracao` pede para aprovar antes.

## Passos
```bash
cd /caminho/do/geracao
composer require laravel/sanctum
php artisan install:api --no-interaction        # cria routes/api.php, publica migration dos tokens
cp -r /caminho/do/geracao-mobile/backend/app/Http/Controllers/Api app/Http/Controllers/
cp /caminho/do/geracao-mobile/backend/routes/api.php routes/api.php
# adicionar o trait Laravel\Sanctum\HasApiTokens ao model App\Models\User
php artisan migrate
```
Se `install:api` não registrar `routes/api.php` em `bootstrap/app.php`, adicione `api: __DIR__.'/../routes/api.php'` em `withRouting`.

## Endpoints (`/api/v1`)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/login` | `{email, password, device_name}` → `{token, user}` |
| POST | `/logout` | revoga o token atual |
| GET | `/me` | usuário e permissões |
| GET | `/months` | meses com dados |
| GET | `/dashboard?unit_id&from&to` | totais, séries e resumo por UC (`from`/`to` = `Y-m`) |
| GET | `/units` | unidades consumidoras |
| GET | `/invoices?unit_id` | faturas (últimas 120) |
| GET/POST | `/generations` | lista / informa a geração do mês (`geracao.editar`) |

Em produção use HTTPS (`APP_URL`), pois o token trafega no cabeçalho `Authorization`.
