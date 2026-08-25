# Automação de Ofertas de Afiliados no WhatsApp — n8n + Evolution API

Este pacote contém 7 workflows n8n prontos para importar ("Import from JSON") que
implementam o pipeline de publicação de ofertas (Mercado Livre, Shopee, Amazon)
no WhatsApp via Evolution API, com seu sistema externo como fonte de verdade.

> ⚠️ **Importante sobre o item "analisar sua instância n8n e a versão da Evolution
> API instalada":** eu não tenho acesso à sua instância n8n nem ao seu servidor
> Evolution API rodando — não há como eu "entrar" neles a partir daqui. O que fiz foi
> usar as **versões de node mais recentes e estáveis do n8n** (httpRequest v4.2, if v2,
> code v2, executeWorkflow v1.2 etc.) e os **endpoints padrão da Evolution API v2**
> (`/message/sendText/{instance}`, `/message/sendMedia/{instance}`,
> `/instance/connectionState/{instance}`). Antes de ativar em produção, você (ou
> quem administra seu servidor Evolution) precisa **confirmar esses endpoints contra
> a documentação da versão realmente instalada**, pois instâncias antigas (v1.x)
> usam rotas diferentes. Deixei `EVOLUTION_API_VERSION` como variável só para
> documentação/controle — os nodes não trocam de comportamento automaticamente
> com base nela, então ajuste manualmente o node **"Preparar Payload Evolution"**
> (Workflow 02) se sua versão usar rotas diferentes.

---

## 1. Arquivos entregues

| Arquivo | Workflow | Papel |
|---|---|---|
| `01-publish-whatsapp-offers.json` | 01 - Publish WhatsApp Offers | Pipeline principal (cron → valida → publica) |
| `02-send-via-evolution-api.json` | 02 - Send via Evolution API | Subworkflow de envio, com dedupe + retry escalonado |
| `03-urgent-offers.json` | 03 - Urgent Offers | Webhook para cupons/ofertas urgentes |
| `04-error-handler.json` | 04 - Error Handler | Captura erros de qualquer workflow e loga no backend |
| `05-release-stale-reservations.json` | 05 - Release Stale Reservations | Libera reservas travadas |
| `06-health-check.json` | 06 - Health Check | Monitora backend, Evolution API e instância |
| `07-analytics-sync.json` | 07 - Analytics Sync | Recalcula score e melhores horários |

---

## 2. Ordem de importação e ligações entre workflows

1. Importe o **02** primeiro, copie o **Workflow ID** gerado pelo n8n.
2. No **01**, abra o node **"Enviar via Evolution API (Subworkflow)"** e troque
   `WORKFLOW_ID_02_EVOLUTION` pelo ID real do Workflow 02.
3. Importe o **01**, copie o ID.
4. No **03**, abra **"Disparar Execução do WF Principal"** e troque
   `WORKFLOW_ID_01_PUBLISH` pelo ID real do Workflow 01.
5. Importe os demais (03, 04, 05, 06, 07).
6. Em cada workflow que use o **Error Trigger** implicitamente (n8n permite
   configurar isso em *Settings → Error Workflow* de cada workflow), aponte para
   o **Workflow 04 (Error Handler)**. Isso não é feito via JSON — precisa ser
   configurado manualmente em cada workflow, na aba **Settings**.

---

## 3. Credenciais a cadastrar no n8n

| Nome sugerido | Tipo | Onde é usada |
|---|---|---|
| **Backend API Header Auth** | Generic Credential → HTTP Header Auth (`Authorization: Bearer <N8N_API_SECRET>`) | Todos os HTTP Requests para o seu backend |
| **Evolution API Header Auth (apikey)** | Generic Credential → HTTP Header Auth (`apikey: <EVOLUTION_API_KEY>`) | Nodes de envio (Workflow 02) e Health Check (06) |
| **Amazon (opcional)** | Documentar apenas — automação não faz login na Amazon | — |
| **Mercado Livre (opcional)** | Documentar apenas — usa somente `affiliate_url` já gerado pelo seu backend | — |
| **Shopee (opcional)** | Documentar apenas — idem | — |
| **OpenAI (opcional, futuro)** | OpenAI API credential | Reservado para a fase com IA (item 43/44 do escopo) — **não usado na v1** |

Nunca salve chaves diretamente em Code nodes. As credenciais acima usam o mecanismo
nativo de **Credentials** do n8n (criptografadas) — os HTTP Request nodes já estão
configurados com `authentication: genericCredentialType` / `httpHeaderAuth`
apontando para `CREDENTIAL_ID` (placeholder que você troca ao selecionar a
credencial real na UI do n8n).

---

## 4. Variáveis de ambiente (ENV) necessárias

Configure em **n8n → Settings → Environment Variables** (ou no `.env` da sua
instância self-hosted):

```env
# Backend
BACKEND_API_URL=https://seusistema.com
N8N_API_SECRET=coloque_aqui   # usado apenas para referência; o valor real vive na credencial

# Evolution API
EVOLUTION_API_URL=https://sua-evolution.com
EVOLUTION_API_KEY=coloque_aqui   # idem, vive na credencial "Evolution API Header Auth"
EVOLUTION_INSTANCE=minha-instancia
EVOLUTION_API_VERSION=2.x   # apenas documentação/controle manual

# WhatsApp
WHATSAPP_CHANNEL_ID=id-do-canal-para-checagem-de-frequencia
WHATSAPP_CHANNEL_DESTINATION=5541999999999   # número/grupo de produção
WHATSAPP_TEST_DESTINATION=5541988888888      # número/grupo de testes

# Janela de horário (America/Sao_Paulo)
PUBLISH_WINDOW_START_HOUR=8
PUBLISH_WINDOW_START_MIN=0
PUBLISH_WINDOW_END_HOUR=22
PUBLISH_WINDOW_END_MIN=30

# Frequência (também podem ser controladas via /api/automation/publications/check no backend)
MIN_MINUTES_BETWEEN_POSTS=20
MAX_POSTS_PER_HOUR=3
MAX_POSTS_PER_DAY=20

# Reservas
RESERVATION_TIMEOUT_MINUTES=10

# Domínios de tracking próprios permitidos (separados por vírgula)
TRACKING_ALLOWED_DOMAINS=meusite.com,go.meusite.com

# Webhook de ofertas urgentes
URGENT_WEBHOOK_SECRET=coloque_um_segredo_forte_aqui

# Debug / Ambiente
AUTOMATION_DEBUG=true    # true = nunca envia WhatsApp de verdade, apenas simula
AUTOMATION_ENV=test      # test = força envio para WHATSAPP_TEST_DESTINATION
```

> Em produção, mude `AUTOMATION_DEBUG=false` e `AUTOMATION_ENV=production` **só
> depois** de validar tudo em modo teste (seção 8).

---

## 5. Webhooks expostos pelo n8n

| Workflow | Método | Path | Header exigido |
|---|---|---|---|
| 03 - Urgent Offers | `POST` | `/webhook/oferta-urgente` | `X-Automation-Secret: <URGENT_WEBHOOK_SECRET>` |

Payload esperado pelo seu sistema ao chamar esse webhook:
```json
{
  "offer_id": "abc123",
  "reason": "cupom expirando em 1h"
}
```

---

## 6. Endpoints esperados no seu backend

Todos autenticados via header `Authorization: Bearer <N8N_API_SECRET>`.

| Método | Rota | Usado em | Descrição |
|---|---|---|---|
| GET | `/api/automation/status` | 01, 06 | `{ "enabled": true }` |
| GET | `/api/automation/offers/next` | 01 | Próxima oferta por prioridade → score. Retorna `204` ou `{ "offer": null }` se vazio |
| POST | `/api/automation/offers/{offer_id}/reserve` | 01 | Reserva atômica (impedir corrida entre execuções) |
| POST | `/api/automation/offers/{offer_id}/release` | 01, 05 | Libera reserva (cooldown/horário/timeout) |
| GET | `/api/automation/publications/check` | 01 | `?offer_id&product_id&channel_id` → `{ "can_publish": bool, "reason": "..." }` (deve considerar cooldown, duplicidade e limites de frequência) |
| POST | `/api/automation/offers/{offer_id}/published` | 01 | Confirma publicação com `message_id`, `remote_jid`, `published_at` |
| POST | `/api/automation/offers/{offer_id}/failed` | 01 | Registra falha com `stage` e `error` |
| GET | `/api/automation/publications/{publication_id}` | 02 | Usado para checar duplicidade antes de reenviar |
| POST | `/api/automation/offers/{offer_id}/priority` | 03 | Marca oferta como `URGENT` |
| POST | `/api/automation/logs/error` | 04 | Log estruturado de erro |
| GET | `/api/automation/offers?status=RESERVED&reserved_before_minutes=N` | 05 | Lista reservas expiradas |
| GET | `/api/automation/publications/last` | 06 | Última publicação (para health check) |
| POST | `/api/automation/health` | 06 | Salva snapshot de saúde |
| GET | `/api/automation/analytics/metrics` | 07 | Métricas por oferta (cliques, conversões, idade) |
| POST | `/api/automation/analytics/scores` | 07 | Atualiza scores calculados |
| POST | `/api/automation/analytics/best-hours` | 07 | Recalcula melhores horários/categorias |

### Campos obrigatórios no objeto `offer`
```text
offer_id, marketplace, title, price, affiliate_url, tracking_url
```
### Campos opcionais reconhecidos pelo template
```text
original_price, discount_percentage, coupon, free_shipping,
estimated_final_price, image, product_id, publication_id
```

---

## 7. Regra de link (implementada no node "Validate Affiliate URL")

1. Se `affiliate_url` vazio → **aborta** e marca falha (`LINK_VALIDATION`).
2. Valida o domínio de `affiliate_url` contra a whitelist por marketplace
   (`mercadolivre.com.br`, `shopee.com.br`, `amazon.com.br`, e variantes).
3. Se `tracking_url` existir **e** seu domínio estiver na lista
   `TRACKING_ALLOWED_DOMAINS` (seus próprios domínios de redirecionamento),
   ele é o link publicado — nunca `product_url`.
4. Caso contrário, publica `affiliate_url` diretamente.
5. Nunca reescreve ou "fabrica" links — usa exatamente o que veio da API.

---

## 8. Como testar (ambiente de teste)

1. Defina `AUTOMATION_DEBUG=true` — nenhuma mensagem real será enviada; o
   Workflow 02 simula sucesso e retorna um `message_id` fake (`SIMULATED-...`).
2. Alternativamente, com `AUTOMATION_DEBUG=false` e `AUTOMATION_ENV=test`,
   as mensagens são realmente enviadas, mas sempre para
   `WHATSAPP_TEST_DESTINATION`.
3. No n8n, abra o Workflow **01** e clique em **"Test workflow"** manualmente
   (o Schedule Trigger pode ser disparado manualmente na UI).
4. Garanta que seu backend tenha ao menos uma oferta de teste com todos os
   campos obrigatórios preenchidos e `status` elegível.
5. Acompanhe a execução node a node no painel do n8n; cada IF mostra qual
   caminho foi seguido (validação, link, cooldown, janela de horário).
6. Confira no seu backend se os endpoints `/reserve`, `/published` ou
   `/failed` foram chamados corretamente.
7. Teste o **Workflow 03** enviando um `POST` para
   `https://SEU_N8N/webhook/oferta-urgente` com o header
   `X-Automation-Secret` correto.
8. Teste o **Workflow 05** criando uma reserva "presa" (sem publicar) e
   aguardando o timeout configurado.

## 9. Como ativar em produção

1. `AUTOMATION_DEBUG=false`
2. `AUTOMATION_ENV=production`
3. Ative (`active: true`) os workflows 01, 03, 04, 05, 06, 07 na UI do n8n
   (o Workflow 02 não precisa estar ativo — é chamado via Execute Workflow).
4. Configure em **cada** workflow, na aba *Settings → Error Workflow*, o
   Workflow **04 - Error Handler**.
5. Confirme que as credenciais reais (não os placeholders `CREDENTIAL_ID`)
   estão selecionadas em todos os nodes HTTP Request.
6. Monitore o Workflow **06 - Health Check** nas primeiras 24-48h.

---

## 10. Limitações e observações importantes

- **Retry com backoff escalonado (30s → 2min → 5min)** foi implementado com
  um laço real de conexões (`Wait` → volta para o `HTTP Request`) dentro do
  Workflow 02. É uma alternativa manual à opção nativa *"Retry on Fail"* do
  node HTTP Request (que usa um único intervalo fixo entre tentativas) — usei
  a versão manual porque o requisito pedia atrasos diferentes por tentativa.
- **Rotas da Evolution API**: usei as rotas mais comuns da v2
  (`/message/sendText/{instance}`, `/message/sendMedia/{instance}`,
  `/instance/connectionState/{instance}`). **Confirme contra a documentação
  da sua instalação** antes de ativar em produção — instâncias mais antigas
  podem ter nomes de rota diferentes.
- **IA para copy (item 43)**: não implementada nesta v1, conforme pedido.
  O ponto de extensão seria substituir o node "Build Offer Message" por uma
  chamada a um node de IA que receba apenas os campos estruturados
  (`title`, `price`, `discount`, `coupon`) e nunca invente dados ausentes.
- Nenhuma automação de navegador (Selenium/Puppeteer/Playwright) foi usada —
  toda comunicação passa pela Evolution API via HTTP Request.
- Os UUIDs de credenciais (`CREDENTIAL_ID`) e IDs de workflow
  (`WORKFLOW_ID_01_PUBLISH`, `WORKFLOW_ID_02_EVOLUTION`) são placeholders —
  substitua-os na interface do n8n após a importação.
