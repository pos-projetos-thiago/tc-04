# ByteBank — Gerenciamento Financeiro Pessoal

![React Native](https://img.shields.io/badge/React_Native-0.86.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_SDK-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-57-000020?style=for-the-badge&logo=expo&logoColor=white)

Aplicação mobile de gerenciamento financeiro desenvolvida com React Native, Expo e Firebase como parte do **Tech Challenge — Fase 4** da pós-graduação PosTech FIAP (Front-End Engineering).

Esta fase evoluiu a aplicação da Fase 3 incorporando: arquitetura modular com princípios de Clean Architecture, cache de dados, pré-carregamento de rotas, programação reativa e segurança com regras do Firestore e Storage.

---

## Funcionalidades

- Autenticação via Firebase Authentication (e-mail/senha)
- Recuperação de senha por e-mail
- Dashboard com saldo, patrimônio, totais mensais e investimentos
- Gráficos de movimentação mensal e distribuição do portfólio
- Animações de entrada com `Animated` do React Native
- Listagem de transações com scroll infinito (paginação cursor-based via Firestore)
- Filtros por tipo, categoria e período
- Cadastro e edição de transações (receita, despesa, investimento)
- Validação de campos com feedback inline
- Upload de recibos para Firebase Storage
- Extração de dados de documentos via IA (Firebase AI Logic / Gemini)
- Tema claro e escuro (reage ao tema do sistema)

---

## Pré-requisitos

- **Node.js 20** ou superior (o Expo SDK 57 requer Node ≥ 20; versões inferiores podem funcionar mas não são suportadas oficialmente)
- npm
- Aplicativo **Expo Go** instalado no dispositivo (iOS ou Android)
- Conta no [Firebase Console](https://console.firebase.google.com)

---

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. Ative os serviços:
   - **Authentication** — provedor **Email/Senha**
   - **Cloud Firestore** — modo produção ou teste
   - **Storage** — bucket padrão
   - **AI Logic** (Vertex AI / Gemini) — para extração de dados de recibos
3. Registre um app **Web** e copie as credenciais.
4. Aplique as regras de segurança do Firestore e do Storage (arquivos na raiz do projeto).

### Regras do Firestore (`firestore.rules`)

Implementam isolamento por `userId`, validação de campos obrigatórios, imutabilidade de `userId` e `createdAt`, e `amount > 0`.

**Via Console:** Firebase Console → Firestore → Regras → substituir → Publicar.

**Via CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase use <SEU_PROJECT_ID>
firebase deploy --only firestore:rules
```

### Regras do Storage (`storage.rules`)

Isolam o acesso a `receipts/{userId}/…`, restringem tipos (imagens e PDF) e tamanho máximo (10 MB).

**Via Console:** Firebase Console → Storage → Regras → substituir → Publicar.

**Via CLI:**
```bash
firebase deploy --only storage
```

### Índices compostos necessários no Firestore

Coleção `transactions` — criar no Console ou via `firestore.indexes.json`:

| Campos | Ordem | Finalidade |
|---|---|---|
| `userId` ASC, `date` DESC | Composto | Listagem padrão |
| `userId` ASC, `type` ASC, `date` DESC | Composto | Filtro por tipo |
| `userId` ASC, `category` ASC, `date` DESC | Composto | Filtro por categoria |
| `userId` ASC, `date` ASC (+ `date` <=) | Composto | Filtro por período |

---

## Variáveis de ambiente

Crie `.env` na raiz do projeto a partir do `.env.example`:

```bash
cp .env.example .env
```

Preencha com as credenciais do seu projeto Firebase:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

> ⚠️ O arquivo `.env` está no `.gitignore` e **nunca deve ser commitado**.

---

## Instalação

```bash
npm install
```

## Executando o projeto

```bash
npm start
```

Inicia o Metro em modo **LAN** (`--lan --clear`). Recomendado para dispositivos físicos na mesma rede Wi-Fi.

> **⚠️ Não use `--tunnel` com Expo SDK 57 + iOS**  
> O ATS do iOS bloqueia conexões HTTP geradas pelo modo tunnel com URLs `*.exp.direct`. Use LAN ou USB.

### Modos disponíveis

| Comando | Modo | Quando usar |
|---|---|---|
| `npm start` | LAN (padrão) | Dispositivo na mesma rede Wi-Fi |
| `npm run start:tunnel` | Tunnel | Redes diferentes |
| `npm run start:localhost` | Localhost | Dispositivo via USB + `iproxy` |

Após o servidor iniciar, escaneie o QR code com o Expo Go.

---

## Arquitetura

O projeto segue princípios de **Clean Architecture** adaptados ao contexto mobile, separando apresentação, domínio e infraestrutura.

```
app/                          # Expo Router — rotas (cada arquivo = chunk separado)
  (auth)/                     # Grupo de autenticação (lazy carregado)
  (tabs)/                     # Grupo de tabs principais (lazy carregado)
  transactions/               # Telas de criação e edição
  _layout.tsx                 # Layout raiz — providers e navegação

src/
  features/
    auth/                     # Autenticação
      context/                # AuthProvider (useReducer + Context)
      hooks/                  # useAuth
      services/               # FirebaseAuthService : IAuthService
      types/                  # User, IAuthService
      utils/                  # Mapeamento de erros, diagnóstico
    dashboard/                # Resumo financeiro
      components/             # DashboardScreen, gráficos, cards
      hooks/                  # useDashboard
      services/               # dashboardService + dashboard-cache
      types/                  # DashboardSummary
      utils/                  # Calculadores financeiros
    receipts/                 # Upload e análise de recibos
      components/             # AttachmentPicker
      hooks/                  # useReceiptUpload, useTransactionExtraction
      services/               # ReceiptService, AIExtractionService
    transactions/             # Transações financeiras
      components/             # TransactionForm, TransactionListScreen
      context/                # TransactionProvider + TransactionContext
      hooks/                  # useTransactions, useCreateTransaction, ...
      services/               # FirestoreTransactionService : ITransactionService
      types/                  # Transaction, TransactionFilter, DTOs, interfaces
  lib/
    firebase/                 # Configuração e instâncias Firebase
  shared/                     # Componentes, hooks e utilitários transversais
  polyfills/                  # AbortSignal.any (Hermes + Firebase AI)

constants/
  theme.ts                    # Tokens de cor e tipografia

firestore.rules               # Regras de segurança do Firestore
storage.rules                 # Regras de segurança do Storage
```

### Camadas e dependências

| Camada | Onde | Depende de |
|---|---|---|
| Apresentação | `app/`, `features/*/components/` | Domínio (hooks, types) |
| Domínio | `features/*/hooks/`, `features/*/types/`, `features/*/utils/` | Interfaces (não implementações) |
| Infraestrutura | `lib/firebase/`, `features/*/services/` | Firebase SDK, interfaces de domínio |
| Estado global | `features/*/context/` | Domínio + hooks |

Componentes de apresentação nunca importam diretamente de `lib/firebase` — acessam dados via hooks e serviços.

---

## Gerenciamento de estado

### Auth — `useReducer` + Context

`AuthProvider` usa `useReducer` com ações explícitas (`SET_USER`, `SET_LOADING`, `SET_ERROR`, `CLEAR_ERROR`). O listener `onAuthStateChanged` é registrado uma única vez no `useEffect` com cleanup via `unsubscribe`.

### Transações — Context + paginação

`TransactionProvider` instancia `useTransactions` uma vez e expõe o estado globalmente via `TransactionContext`. A paginação é cursor-based (Firestore `startAfter`): quando o filtro muda, o cursor é resetado e a lista é reiniciada.

### Dashboard — estado local

`useDashboard` mantém estado local por tela. Não usa Context próprio — os dados são derivados sob demanda do Firestore com cache in-memory.

---

## Performance e lazy loading

### Code splitting por rota (Expo Router)

O Expo Router transforma cada arquivo em `app/` em um chunk JS separado. Grupos como `(auth)` e `(tabs)` são carregados apenas quando o usuário navega para aquela área — isso é lazy loading real, gerenciado automaticamente pelo Metro bundler.

### Pré-carregamento de rota

O `DashboardScreen` inclui um `<Link href="/transactions/new" prefetch />` invisível. O Expo Router renderiza a tela alvo off-screen quando esse Link está montado, garantindo que o bundle e os recursos da tela de nova transação estejam prontos antes do usuário tocar em "+".

### Cache do dashboard

`dashboardService.getSummary()` usa cache in-memory com:
- **Chave:** `userId:ano-mês` — dados isolados por usuário e período
- **TTL:** 5 minutos (sem persistência entre sessões)
- **Invalidação explícita:**
  - Após criar ou editar transação (`TransactionForm`)
  - Após excluir transação (`TransactionListScreen`)
  - Ao fazer logout (`AuthProvider.signOut`)

**Limitação conhecida:** o cache não reage a alterações feitas em outro dispositivo ou sessão concorrente. Dados podem ficar desatualizados por até 5 minutos. O `useFocusEffect` no Dashboard mitiga isso parcialmente ao refetch ao receber foco, mas o cache pode servir dados antigos se o TTL ainda não expirou. Para sincronização em tempo real entre dispositivos, seria necessário `onSnapshot` (não implementado).

### Paginação de transações

Scroll infinito cursor-based via Firestore `startAfter`. Carrega 20 itens por vez; novos itens são buscados ao rolar próximo ao final da lista.

---

## Programação reativa

| Mecanismo | Onde | O que faz |
|---|---|---|
| `onAuthStateChanged` | `AuthProvider` | Listener real do Firebase Auth. Reage imediatamente a login/logout em qualquer ponto da sessão. Cleanup com `unsubscribe` no `useEffect`. |
| `useFocusEffect` | `DashboardScreen`, `TransactionListScreen` | Recarrega dados quando a tela recebe foco. Evita fetch duplo no mount inicial via `hasMountedRef`. Não é um listener em tempo real — é uma recarga imperativa ao focar. |
| `TransactionProvider` reage ao `userId` | `transaction-provider.tsx` | Quando o usuário muda (login/logout), `useTransactions` reinicia com o novo `userId` automaticamente. |

**Diferença importante:** `onAuthStateChanged` é um listener em tempo real — reage sem polling. `useFocusEffect` é recarga imperativa — busca os dados quando a tela aparece, não quando os dados mudam. Não há `onSnapshot` implementado; atualizações feitas em outro dispositivo não se refletem imediatamente.

---

## Segurança

### Autenticação

Firebase Authentication com persistência via AsyncStorage (sessão mantida entre reinicializações). Erros do Firebase são mapeados para mensagens em português sem expor códigos internos.

### Isolamento de dados

Cada transação tem campo `userId`. As regras do Firestore garantem no servidor que apenas o dono pode ler, criar, atualizar ou excluir seus documentos. O serviço TypeScript também valida isso antes de chegar ao Firestore (defesa em profundidade).

### Regras do Firestore

Implementadas em `firestore.rules`:
- **Deny-by-default**
- Leitura/escrita somente para o dono (`userId == request.auth.uid`)
- **Create:** valida campos obrigatórios, `amount > 0`
- **Update:** mantém as mesmas validações do create + `createdAt` imutável
- **Delete:** somente o dono

⚠️ **Estas regras só têm efeito após serem publicadas no Firebase Console ou via CLI.**

### Regras do Storage

Implementadas em `storage.rules`:
- Acesso isolado por `userId` no caminho `receipts/{userId}/…`
- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`
- Tamanho máximo: 10 MB

### Criptografia

O Firebase criptografa todos os dados **em repouso** (AES-256) e **em trânsito** (TLS 1.3) de forma automática e transparente — isso é gerenciado pela infraestrutura do Google Cloud e não requer nenhuma ação do desenvolvedor. Esta é a proteção padrão e suficiente para dados financeiros pessoais em aplicações mobile com Firebase.

Não foi implementada criptografia adicional na camada da aplicação (criptografia client-side antes de persistir no Firestore), pois em aplicações mobile sem backend próprio a chave de criptografia precisaria ser armazenada no dispositivo ou no bundle — o que não oferece proteção real contra um atacante com acesso ao dispositivo. O modelo de segurança adotado (autenticação + regras de acesso + criptografia da infraestrutura Firebase) é a abordagem padrão para aplicações deste tipo.

### Credenciais

`.env` está no `.gitignore`. Nenhuma credencial é logada, exposta no bundle ou incluída em commits.

---

## Polyfill de AbortSignal

O runtime Hermes (React Native 0.81+ / Expo SDK 57) não implementa `AbortSignal.any()`, usado pelo Firebase AI Logic. O arquivo `src/polyfills/abort-signal-any.ts` é o **primeiro import** em `app/_layout.tsx` para garantir disponibilidade antes de qualquer inicialização do Firebase.

---

## Tecnologias utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.86.3 | Base da aplicação mobile |
| Expo SDK | 57 | Ferramental, câmera, storage, router |
| TypeScript | ~5.9 | Tipagem estática |
| Expo Router | ~57.0.0 | Roteamento file-based com code splitting |
| Firebase Authentication | SDK 12 | Login, registro, recuperação de senha |
| Cloud Firestore | SDK 12 | Banco de dados |
| Firebase Storage | SDK 12 | Upload de recibos |
| Firebase AI Logic | SDK 12 | Extração de dados de documentos (Gemini) |
| React Native Reanimated | 4.5.1 | Animações performáticas |
| React Native Gesture Handler | ~2.32.0 | Gestos nativos |
| @shopify/react-native-skia | 2.6.2 | Canvas para gráficos |
| expo-skia-charts | ^0.5.0 | Gráficos donut |
| @react-native-async-storage/async-storage | 2.2.0 | Persistência de sessão Firebase Auth |

---

## Roteiro — Vídeo Demonstrativo (até 5 min)

> ⚠️ O vídeo ainda precisa ser gravado. Este roteiro é uma guia para a gravação.

| Tempo | Conteúdo |
|---|---|
| 0:00–0:30 | Apresentação: ByteBank, stack, o que evoluiu na Fase 4 |
| 0:30–1:00 | Login e registro — validação inline, mensagens de erro sem vazamento técnico |
| 1:00–2:00 | Dashboard — saldo, patrimônio, gráficos de movimentação e portfólio |
| 2:00–3:00 | Nova transação — preencher campos, upload de recibo, análise por IA |
| 3:00–3:30 | Listagem com filtros e scroll infinito |
| 3:30–4:00 | Editar e excluir — mostrar que o dashboard atualiza na volta |
| 4:00–4:30 | Tema claro/escuro |
| 4:30–5:00 | Arquitetura modular, cache, regras Firestore e Storage |

---

## Tabela de rastreabilidade — Fase 4

| Requisito (PDF) | Evidência no código | Arquivos | Status |
|---|---|---|---|
| Arquitetura modular | `src/features/{auth,dashboard,transactions,receipts}` cada um com context/hooks/services/types | `src/features/*/` | ✅ Concluído |
| State Management Patterns avançados | `AuthProvider` com `useReducer`; `TransactionProvider` com Context | `auth-provider.tsx`, `transaction-provider.tsx` | ✅ Concluído |
| Separação apresentação / domínio / infraestrutura | Interfaces `IAuthService`, `ITransactionService`; serviços isolados em `lib/firebase`; componentes não importam Firebase diretamente | `features/*/types/*.interface.ts`, `lib/firebase/` | ✅ Concluído |
| Lazy loading de rotas | Expo Router gera chunks por arquivo; grupos `(auth)` e `(tabs)` carregados sob demanda | `app/(auth)/`, `app/(tabs)/` | ✅ Concluído |
| Pré-carregamento | `<Link href="/transactions/new" prefetch />` no DashboardScreen pré-renderiza a tela off-screen | `dashboard-screen.tsx` | ✅ Concluído |
| Cache para otimizar requisições | Cache in-memory no `dashboardService`, chave `userId:ano-mês`, TTL 5 min, invalidado em create/edit/delete/logout | `dashboard-cache.ts`, `dashboard.service.ts` | ✅ Concluído |
| Programação reativa | `onAuthStateChanged` (listener real); `useFocusEffect` (recarga ao focar); `TransactionProvider` reage ao userId | `auth-provider.tsx`, `dashboard-screen.tsx`, `transaction-list-screen.tsx` | ✅ Concluído |
| Autenticação segura | Firebase Auth com persistência AsyncStorage; erros mapeados; guard `isFirebaseConfigured()` | `firebase-auth.service.ts`, `auth-provider.tsx` | ✅ Concluído |
| Isolamento de dados por usuário | Regras Firestore e Storage garantem acesso somente pelo dono; serviços TypeScript validam `userId` antes das chamadas | `firestore.rules`, `storage.rules`, `firestore-transaction.service.ts` | ✅ Concluído |
| Regras Firestore completas (create/update/delete) | Create valida campos e `amount > 0`; update mantém validações + `createdAt` imutável; delete somente dono | `firestore.rules` | ✅ Concluído |
| Regras Storage | Isolamento por userId, validação de tipo e tamanho | `storage.rules` | ✅ Concluído |
| Criptografia de dados sensíveis | Firebase criptografa em repouso (AES-256) e em trânsito (TLS 1.3) automaticamente. Sem criptografia adicional client-side (explicação na seção Segurança) | Infraestrutura Firebase | ⚠️ Parcial — depende da infra Firebase; sem camada app adicional |
| Credenciais fora do repositório | `.env` no `.gitignore`; nenhuma credencial em commits | `.gitignore`, `.env.example` | ✅ Concluído |
| README com tecnologias e passo a passo | Este arquivo | `README.md` | ✅ Concluído |
| Vídeo demonstrativo (até 5 min) | Roteiro elaborado; vídeo ainda não gravado | Seção "Roteiro" neste README | ⏳ Pendente |

---

## Pendências externas

| Pendência | Instrução |
|---|---|
| Publicar `firestore.rules` | Firebase Console → Firestore → Regras → Publicar, ou `firebase deploy --only firestore:rules` |
| Publicar `storage.rules` | Firebase Console → Storage → Regras → Publicar, ou `firebase deploy --only storage` |
| Criar índices compostos no Firestore | Console → Firestore → Índices, ou via `firestore.indexes.json` + CLI |
| Gravar vídeo demonstrativo | Usar o roteiro acima; exportar em até 5 min |
| Teste em dispositivo físico | Não realizado neste ambiente. Requer Expo Go no dispositivo iOS/Android |
