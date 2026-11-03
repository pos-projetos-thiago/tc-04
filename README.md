# ByteBank — Gerenciamento Financeiro Pessoal

![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_57-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Firestore](https://img.shields.io/badge/Cloud_Firestore-FF6D00?style=for-the-badge&logo=firebase&logoColor=white)
![Context API](https://img.shields.io/badge/Context_API-Gerenciamento_de_Estado-61DAFB?style=for-the-badge&logo=react&logoColor=black)

Aplicação mobile de gerenciamento financeiro desenvolvida com React Native, Expo e Firebase como parte do **Tech Challenge — Fase 4** da pós-graduação PosTech FIAP.

Esta fase evoluiu a aplicação da Fase 3 com foco em arquitetura modular (Clean Architecture), otimização de performance com cache, programação reativa e segurança no acesso a dados.

---

## Funcionalidades

- Autenticação de usuários via Firebase Authentication (e-mail/senha)
- Recuperação de senha com link por e-mail
- Dashboard com visão geral do saldo, patrimônio e investimentos do mês
- Gráficos de movimentação mensal e distribuição da carteira de investimentos
- Animações de entrada com `Animated` do React Native
- Listagem de transações com scroll infinito (cursor-based pagination via Firestore)
- Filtros por tipo, categoria e período
- Cadastro e edição de transações (depósito, saque, investimento)
- Validação de campos com feedback inline
- Upload de recibos para Firebase Storage
- Importação de dados via análise de documento por IA (Firebase AI Logic / Gemini)
- Tema claro e escuro

---

## Pré-requisitos

- Node.js 18 ou superior
- npm
- Aplicativo **Expo Go** instalado no dispositivo (iOS ou Android)
- Conta no [Firebase Console](https://console.firebase.google.com)

---

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. Ative os seguintes serviços:
   - **Authentication** — habilite o provedor **Email/Senha**
   - **Cloud Firestore** — crie o banco em modo de produção ou teste
   - **Storage** — crie o bucket padrão
   - **AI Logic** (Vertex AI / Gemini) — necessário para importação por IA
3. Registre um app **Web** no projeto Firebase e copie as credenciais.
4. Aplique as regras de segurança do Firestore (arquivo `firestore.rules` na raiz).

### Regras do Firestore

As regras estão em [`firestore.rules`](./firestore.rules). Para aplicá-las:

**Pelo Console:**  
Firebase Console → Firestore → Regras → substituir o conteúdo → Publicar.

**Pela CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase use <SEU_PROJECT_ID>
firebase deploy --only firestore:rules
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```bash
cp .env.example .env
```

Preencha com as credenciais do projeto Firebase:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

> O arquivo `.env` está no `.gitignore` e **nunca deve ser commitado**.

---

## Instalação

```bash
npm install
```

## Executando o projeto

```bash
npm start
```

O comando inicia o Metro em modo **LAN** (`--lan --clear`), recomendado para dispositivos físicos com Expo Go na mesma rede Wi-Fi.

> **⚠️ Não use `--tunnel` com Expo SDK 57 + iOS**
>
> O modo tunnel gera URLs `*.exp.direct`. O runtime nativo do iOS converte `exp://` para `http://` — o ATS bloqueia a requisição HTTP resultante. Use LAN ou localhost (USB).

### Modos disponíveis

| Comando | Modo | Quando usar |
|---|---|---|
| `npm start` | LAN (padrão) | Dispositivo na mesma rede Wi-Fi |
| `npm run start:tunnel` | Tunnel | Redes diferentes (requer boa conexão) |
| `npm run start:localhost` | Localhost | Dispositivo via USB + `iproxy` |

Após o servidor iniciar, escaneie o QR code com o Expo Go.

---

## Arquitetura

O projeto segue os princípios de **Clean Architecture** adaptados ao contexto mobile, com separação clara entre apresentação, domínio e infraestrutura.

```
app/                        # Rotas (Expo Router — file-based routing)
  (auth)/                   # Telas de autenticação (login, registro, recuperação)
  (tabs)/                   # Telas principais (Dashboard, Transações)
  transactions/             # Telas de criação e edição de transação
  _layout.tsx               # Layout raiz — composição de providers e navegação

src/
  features/
    auth/                   # [domínio] Autenticação
      context/              # AuthContext + AuthProvider (useReducer)
      hooks/                # useAuth
      services/             # FirebaseAuthService (implementa interface)
      types/                # User, tipos de auth
      utils/                # Mapeamento de erros, diagnóstico de reset de senha
    dashboard/              # [domínio] Resumo financeiro
      components/           # DashboardScreen, gráficos, cards
      hooks/                # useDashboard
      services/             # dashboardService (getSummary + invalidateDashboard)
                            # dashboard-cache (cache in-memory por usuário, TTL 5 min)
      types/                # DashboardSummary, CategoryBreakdown
      utils/                # Calculadores financeiros (balance, netWorth, etc.)
    receipts/               # [domínio] Upload e análise de recibos
      components/           # AttachmentPicker
      hooks/                # useReceiptUpload, useTransactionExtraction
      services/             # ReceiptService, AIExtractionService
    transactions/           # [domínio] Transações financeiras
      components/           # TransactionForm, TransactionList, TransactionItem
      context/              # TransactionContext + TransactionProvider
      hooks/                # useTransactions, useCreateTransaction, useEditTransaction,
                            #   useDeleteTransaction, useTransactionContext
      services/             # FirestoreTransactionService (implementa ITransactionService)
      types/                # Transaction, TransactionFilter, DTOs, interfaces
  lib/
    firebase/               # [infraestrutura] Configuração e serviços Firebase
      config.ts             # Inicialização (lazy, sem múltiplas instâncias)
      auth.ts               # Auth nativa
      firestore.ts          # Firestore
      storage.ts            # Storage
      ai.ts                 # Firebase AI Logic (Gemini)
  shared/                   # Componentes, hooks e utilitários transversais
  polyfills/                # AbortSignal.any (Hermes/Firebase AI Logic)
  types/                    # Tipos compartilhados (ex: PaginatedResult)

constants/
  theme.ts                  # Tokens de cor e tipografia (claro/escuro)

firestore.rules             # Regras de segurança do Firestore
```

### Camadas e responsabilidades

| Camada | Localização | Responsabilidade |
|---|---|---|
| Apresentação | `app/`, `features/*/components/` | Renderização, navegação, interação |
| Domínio | `features/*/hooks/`, `features/*/types/`, `features/*/utils/` | Regras de negócio, transformações |
| Infraestrutura | `lib/firebase/`, `features/*/services/` | Acesso a dados, Firebase, IA |
| Estado global | `features/*/context/` | Gerenciamento de estado compartilhado |

### Gerenciamento de estado

- **Auth:** `useReducer` + Context — ações explícitas (`SET_USER`, `SET_LOADING`, `SET_ERROR`, `CLEAR_ERROR`)
- **Transações:** Context + paginação cursor-based; `useTransactions` é instanciado uma vez no `TransactionProvider` e consumido globalmente
- **Dashboard:** estado local por tela (`useDashboard`); sem context próprio — dados são derivados sob demanda do Firestore

### Cache (Fase 4)

O `dashboardService` implementa cache in-memory com as seguintes propriedades:

- **Chave:** `userId:ano-mês` — dados isolados por usuário e período
- **TTL:** 5 minutos
- **Invalidação:**
  - Após criar ou editar uma transação (`TransactionForm.handleSubmit`)
  - Após excluir uma transação (`TransactionListScreen.confirmDelete`)
  - Ao fazer logout (`AuthProvider.signOut`)
- **Segurança:** puramente in-memory, sem persistência entre sessões; sem dados financeiros em AsyncStorage ou em disco

### Programação reativa

- `onAuthStateChanged` (Firebase Auth): listener que reage automaticamente ao estado de autenticação e propaga para o contexto global
- `useFocusEffect` (Expo Router): o Dashboard e a lista de transações recarregam dados ao receber foco, garantindo que alterações feitas em outras telas sejam refletidas
- `TransactionProvider`: reage ao `userId` via `useAuth()` — quando o usuário muda, `useTransactions` reinicia automaticamente com o novo `userId`

### Segurança

- Credenciais Firebase carregadas exclusivamente via variáveis de ambiente (`EXPO_PUBLIC_FIREBASE_*`)
- Arquivo `.env` excluído do repositório via `.gitignore`
- Erros do Firebase mapeados para mensagens em português sem expor códigos internos ao usuário
- Regras Firestore (arquivo `firestore.rules`) garantem isolamento por `userId` no nível do servidor:
  - Leitura/escrita somente para o dono do documento
  - Validação de campos obrigatórios e de tipo no `create`
  - `userId` imutável após criação
- Guard `isFirebaseConfigured()` evita chamadas ao Firebase sem credenciais

---

## Tecnologias utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.86.3 | Base da aplicação mobile |
| Expo SDK | 57 | Ferramental, câmera, storage, router |
| TypeScript | 5.9 | Tipagem estática |
| Expo Router | 57 | Navegação baseada em arquivos |
| Firebase Authentication | SDK 12 | Login, registro, recuperação de senha |
| Cloud Firestore | SDK 12 | Banco de dados em tempo real |
| Firebase Storage | SDK 12 | Upload de recibos |
| Firebase AI Logic | SDK 12 | Extração de dados de documentos (Gemini) |
| React Native Reanimated | 4.5 | Animações performáticas |
| React Native Gesture Handler | 2.32 | Gestos nativos |
| expo-skia-charts | 0.5 | Gráficos donut (portfólio de investimentos) |
| @shopify/react-native-skia | 2.6 | Canvas para gráficos |

---

## Observação sobre o polyfill de AbortSignal

O runtime Hermes (React Native 0.81+ / Expo SDK 57) não implementa `AbortSignal.any()`, utilizado internamente pelo Firebase AI Logic. O arquivo `src/polyfills/abort-signal-any.ts` fornece essa implementação e é o **primeiro import** em `app/_layout.tsx`. Sem ele, a importação via IA falharia silenciosamente em dispositivos físicos.

---

## Roteiro — Vídeo Demonstrativo (até 5 min)

Sugestão de roteiro para o vídeo de entrega:

| Tempo | Conteúdo |
|---|---|
| 0:00–0:30 | Apresentação: projeto ByteBank, stack (RN + Expo + Firebase), melhorias da Fase 4 |
| 0:30–1:00 | Tela de login e registro — mostrar validação inline e mensagens de erro amigáveis |
| 1:00–2:00 | Dashboard — saldo, patrimônio, gráficos de movimentação e donut de investimentos |
| 2:00–3:00 | Nova transação — preencher campos, upload de recibo, análise por IA (Gemini) |
| 3:00–3:30 | Listagem com filtros por tipo/categoria/período e scroll infinito |
| 3:30–4:00 | Editar e excluir transação — mostrar que o dashboard atualiza (cache invalidado) |
| 4:00–4:30 | Tema claro/escuro — trocar o tema do sistema e mostrar a adaptação visual |
| 4:30–5:00 | Encerramento: arquitetura modular, cache, segurança com Firestore Rules |

---

## Tabela de requisitos — Fase 4

| Requisito (PDF) | Implementação / Evidência | Arquivos relevantes | Status |
|---|---|---|---|
| Arquitetura modular | Features separados por domínio com subpastas context/hooks/services/types | `src/features/*/` | ✅ Concluído |
| State Management Patterns avançados | AuthProvider com `useReducer`; TransactionProvider com Context+paginação | `auth-provider.tsx`, `transaction-provider.tsx` | ✅ Concluído |
| Separação apresentação/domínio/infraestrutura | Componentes em `features/*/components`, regras em `hooks/utils`, acesso Firebase em `services/lib` | Estrutura de pastas | ✅ Concluído |
| Lazy loading / pré-carregamento | Paginação cursor-based (scroll infinito); dados dashboard sob demanda com cache | `use-transactions.ts`, `dashboard.service.ts` | ✅ Concluído |
| Cache para otimizar requisições | Cache in-memory no dashboardService, TTL 5 min, isolado por userId, invalidado após mutações e logout | `dashboard-cache.ts`, `dashboard.service.ts` | ✅ Concluído |
| Programação reativa | `onAuthStateChanged`, `useFocusEffect` em Dashboard e Transações, TransactionProvider reage ao userId | `auth-provider.tsx`, `dashboard-screen.tsx`, `transaction-list-screen.tsx` | ✅ Concluído |
| Autenticação segura | Firebase Auth, erros mapeados sem expor internos, guard `isFirebaseConfigured()` | `firebase-auth.service.ts`, `auth-provider.tsx` | ✅ Concluído |
| Criptografia / segurança de dados sensíveis | Regras Firestore com isolamento por userId; `.env` fora do repositório; sem dados financeiros em AsyncStorage | `firestore.rules`, `.gitignore` | ✅ Concluído |
| README com tecnologias e passo a passo | Este arquivo | `README.md` | ✅ Concluído |
| Vídeo demonstrativo (até 5 min) | Roteiro incluído neste README | Seção "Roteiro" acima | ⏳ Pendente (gravação manual) |
