# ByteBank — Gerenciamento Financeiro Pessoal

![React Native](https://img.shields.io/badge/React_Native-0.86.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_SDK-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-57-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%E2%89%A522.13-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

Aplicação mobile de gerenciamento financeiro desenvolvida com React Native, Expo e Firebase como parte do **Tech Challenge — Fase 4** da pós-graduação PosTech FIAP (Front-End Engineering).

Esta fase evoluiu a aplicação da Fase 3 incorporando: arquitetura modular com princípios de Clean Architecture, cache de dados, programação reativa e segurança com regras do Firestore e Storage.

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

- **Node.js 22.13** ou superior (Expo SDK 57 requer Node ≥ 22.13.x — consulte a [tabela oficial de compatibilidade](https://docs.expo.dev/versions/v57.0.0/))
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
3. Registre um app **Web** e copie as credenciais geradas.
4. Aplique as regras de segurança do Firestore e do Storage (arquivos `firestore.rules` e `storage.rules` na raiz).

> ⚠️ **As regras dos arquivos `firestore.rules` e `storage.rules` só têm efeito depois de publicadas no Firebase Console ou via CLI.** Enquanto não forem publicadas, o Firestore e o Storage usarão as regras existentes no projeto (ou negarão tudo em modo de produção).

### Publicar as regras do Firestore (`firestore.rules`)

**Via Console:** Firebase Console → Firestore → Regras → substituir o conteúdo → Publicar.

**Via CLI** (requer `firebase.json` na raiz, já incluído neste projeto):
```bash
npm install -g firebase-tools
firebase login
firebase use <SEU_PROJECT_ID>
firebase deploy --only firestore:rules
```

### Publicar as regras do Storage (`storage.rules`)

**Via Console:** Firebase Console → Storage → Regras → substituir o conteúdo → Publicar.

**Via CLI:**
```bash
firebase deploy --only storage
```

### Índices compostos (`firestore.indexes.json`)

Os índices necessários estão definidos em `firestore.indexes.json`. Para implantá-los via CLI:

```bash
firebase deploy --only firestore:indexes
```

Ou crie manualmente no Console (Firestore → Índices):

| Campos | Ordem | Finalidade |
|---|---|---|
| `userId` ASC, `updatedAt` DESC | Composto | Listener reativo (`useTransactionWatcher`) |
| `userId` ASC, `date` DESC | Composto | Listagem padrão |
| `userId` ASC, `type` ASC, `date` DESC | Composto | Filtro por tipo |
| `userId` ASC, `category` ASC, `date` DESC | Composto | Filtro por categoria |
| `userId` ASC, `date` ASC (range) | Composto | Filtro por período |

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

Inicia o Metro em modo **LAN** (`--lan --clear`). Recomendado para dispositivos físicos na mesma rede Wi-Fi.

> **⚠️ Não use `--tunnel` com Expo SDK 57 + iOS**  
> O ATS do iOS bloqueia conexões HTTP geradas pelo modo tunnel com URLs `*.exp.direct`. Use LAN ou USB.

### Modos disponíveis

| Comando | Modo | Quando usar |
|---|---|---|
| `npm start` | LAN (padrão) | Dispositivo na mesma rede Wi-Fi |
| `npm run start:tunnel` | Tunnel | Redes diferentes |
| `npm run start:localhost` | Localhost | Dispositivo via USB + `iproxy` |

---

## Arquitetura

O projeto segue princípios de **Clean Architecture** adaptados ao contexto mobile, separando apresentação, domínio e infraestrutura.

```
app/                          # Expo Router — arquivo = rota
  (auth)/                     # Grupo de autenticação
  (tabs)/                     # Grupo de tabs principais
  transactions/               # Telas de criação e edição
  _layout.tsx                 # Layout raiz — providers e navegação

src/
  features/
    auth/                     # Autenticação
      context/                # AuthProvider (useReducer + Context)
      hooks/                  # useAuth
      services/               # FirebaseAuthService : IAuthService
      types/                  # User, IAuthService
      utils/                  # Mapeamento de erros
    dashboard/                # Resumo financeiro
      components/             # DashboardScreen, gráficos, cards
      hooks/                  # useDashboard
      services/               # dashboardService + dashboard-cache
      types/                  # DashboardSummary
      utils/                  # Calculadores financeiros
    receipts/                 # Upload e análise de recibos
    transactions/             # Transações financeiras
      components/             # TransactionForm, TransactionListScreen
      context/                # TransactionProvider + TransactionContext
      hooks/                  # useTransactions, useCreate/Edit/Delete,
                              #   useTransactionWatcher (listener reativo)
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
firebase.json                 # Configuração da Firebase CLI (deploy de regras e índices)
firestore.indexes.json        # Índices compostos do Firestore
```

### Camadas e dependências

| Camada | Onde | Depende de |
|---|---|---|
| Apresentação | `app/`, `features/*/components/` | Domínio (hooks, types) |
| Domínio | `features/*/hooks/`, `features/*/types/`, `features/*/utils/` | Interfaces (não implementações) |
| Infraestrutura | `lib/firebase/`, `features/*/services/` | Firebase SDK, interfaces de domínio |
| Estado global | `features/*/context/` | Domínio + hooks |

Componentes de apresentação não importam diretamente de `lib/firebase`.

---

## Gerenciamento de estado

### Auth — `useReducer` + Context

`AuthProvider` usa `useReducer` com ações explícitas (`SET_USER`, `SET_LOADING`, `SET_ERROR`, `CLEAR_ERROR`). O listener `onAuthStateChanged` é registrado uma única vez no `useEffect` com cleanup via `unsubscribe` — sem duplicação de assinaturas.

### Transações — Context + paginação cursor-based

`TransactionProvider` instancia `useTransactions` uma vez e expõe o estado globalmente via `TransactionContext`. Paginação via Firestore `startAfter`: quando o filtro muda, o cursor é resetado e a lista reinicia automaticamente.

### Dashboard — estado local por tela

`useDashboard` mantém estado local. Sem Context próprio — os dados são derivados sob demanda do Firestore com cache in-memory.

---

## Carregamento de rotas (lazy loading)

### Comportamento real no Expo SDK 57

O Expo Router oferece **async routes** (code splitting por rota), mas no SDK 57:

- **Web:** requer opt-in explícito via `asyncRoutes` no `app.json`
- **Nativo (iOS/Android):** async routes são **experimentais, apenas em desenvolvimento** e **não se aplicam a builds de produção**

Este projeto **não configura `asyncRoutes`** no `app.json`, portanto:

- Em desenvolvimento nativo (Expo Go): o Metro faz lazy bundling por padrão no processo de desenvolvimento (carrega módulos quando solicitados), mas isso é comportamento do servidor de desenvolvimento, não do app.
- Em produção nativa: todo o bundle JavaScript é carregado de uma vez ao iniciar o app. Não há code splitting por rota em produção nativa no SDK 57.

### O que o projeto faz para otimizar carregamento

- **`InteractionManager.runAfterInteractions` no dashboard:** o fetch do Firestore é adiado até que as animações de transição de navegação terminem. Isso reduz a competição pelo thread JavaScript durante a abertura da tela. Funciona em iOS, Android e web (no web a callback é chamada imediatamente). Implementado em `use-dashboard.ts`.
- **Paginação de transações:** scroll infinito cursor-based — carrega 20 itens por vez, busca mais ao rolar.
- **Pré-carregamento da próxima página (`prefetchNext`):** logo após a primeira página ser exibida, `use-transactions.ts` busca silenciosamente a segunda em background e a armazena em `prefetchRef`. Quando o usuário aciona `loadMore`, o resultado já está disponível — sem nova requisição ao Firestore. O padrão se repete a cada página carregada.
- **Dados do dashboard sob demanda:** `useDashboard` só busca quando o componente monta, com cache in-memory para evitar re-fetches desnecessários.
- **Carregamento condicional por autenticação:** telas de `(tabs)` e `(auth)` não montam até o estado de autenticação ser resolvido.

Não há `React.lazy()`, `Suspense` ou `asyncRoutes` configurado neste projeto.

---

## Cache do dashboard

`dashboardService.getSummary()` usa cache in-memory com:

- **Chave:** `userId:ano-mês` — isolado por usuário e período
- **TTL:** 5 minutos (sem persistência entre sessões)
- **Invalidação explícita:**
  - Após criar ou editar transação (`TransactionForm`)
  - Após excluir transação (`TransactionListScreen`)
  - Ao fazer logout (`AuthProvider.signOut`)

**Limitação documentada:** o cache não reage a mudanças feitas em outro dispositivo ou sessão. O `useTransactionWatcher` (listener `onSnapshot`) detecta essas mudanças e invalida o cache automaticamente — mas o refresh da listagem paginada é necessário para refletir os novos dados.

---

## Programação reativa

| Mecanismo | Onde | Comportamento |
|---|---|---|
| `onAuthStateChanged` | `AuthProvider` | **Listener em tempo real** do Firebase Auth. Reage imediatamente a login/logout em qualquer sessão. Cleanup com `unsubscribe` no `useEffect`. |
| `useTransactionWatcher` | `TransactionListScreen` | **Listener `onSnapshot` sobre 1 documento** (`limit(1)`, `orderBy('updatedAt','desc')`). Detecta criações e edições (sempre vão ao topo por `updatedAt = now`) e exclusão do documento mais recente. **Não detecta exclusão de documentos não-topo** — nesses casos o `useFocusEffect` cobre o refresh ao retornar à tela. Limpo no unmount e na troca de `userId`. |
| `useFocusEffect` | `DashboardScreen`, `TransactionListScreen` | **Recarga imperativa ao focar a tela.** Busca os dados no momento em que a tela recebe foco (ex.: ao voltar de outra tela). `hasMountedRef` evita fetch duplo no mount inicial. **Não reage a mudanças remotas enquanto a tela permanece aberta** — nesse intervalo, o `useTransactionWatcher` assume esse papel para criações e edições. |
| `InteractionManager` | `useDashboard` | Adia o fetch do Firestore até as animações de transição terminarem. |
| Reação ao `userId` | `TransactionProvider` | Quando o usuário muda, `useTransactions` reinicia automaticamente com o novo `userId`. |

`onAuthStateChanged` e `useTransactionWatcher` são listeners em tempo real (reagem sem polling). `useFocusEffect` é recarga imperativa e serve como fallback universal. A paginação cursor-based permanece inalterada — `useTransactionWatcher` usa `onSnapshot` apenas para detecção de mudanças, não para substituir a listagem paginada.

---

## Segurança

### Autenticação

Firebase Authentication com persistência via AsyncStorage. Erros mapeados para mensagens em português sem expor códigos internos ao usuário. Guard `isFirebaseConfigured()` previne chamadas sem credenciais.

### Isolamento de dados

Cada transação tem campo `userId`. As regras do Firestore e do Storage garantem no servidor que apenas o dono pode acessar seus dados.

### Regras do Firestore (`firestore.rules`)

- **Deny-by-default**
- Leitura e exclusão: somente `userId == request.auth.uid`
- **Create:** valida campos obrigatórios, `amount > 0`, `userId` correto
- **Update:** mesmas validações do create + `createdAt` imutável

### Regras do Storage (`storage.rules`)

- Acesso isolado por `userId` no caminho `receipts/{userId}/…`
- Create/update: autenticação + ownership + tamanho ≤ 10 MB + tipo em `image/(jpeg|png|webp|heic)` ou `application/pdf` — todas as condições são `&&` com o tipo em bloco `||` parentizado explicitamente
- Delete: somente o dono autenticado

### Criptografia

O Firebase criptografa todos os dados **em repouso** e **em trânsito** de forma automática, gerenciada pela infraestrutura do Google Cloud.

**Não foi implementada criptografia adicional na camada da aplicação** (criptografia client-side antes de persistir no Firestore). Em aplicações mobile sem backend próprio, armazenar uma chave de criptografia no bundle ou no dispositivo não oferece proteção adicional real — um atacante com acesso ao dispositivo ou ao bundle teria acesso à chave e aos dados. O modelo de segurança adotado (autenticação + regras de acesso + criptografia da infraestrutura Firebase) é a abordagem padrão documentada para aplicações mobile com Firebase.

O PDF menciona "criptografia de dados sensíveis" sem especificar a técnica. O status deste item é mantido como **Parcial** — a criptografia em repouso e em trânsito está garantida pelo Firebase; criptografia client-side adicional não foi implementada.

### Credenciais

`.env` está no `.gitignore`. Nenhuma credencial é logada, exposta no bundle ou incluída em commits.

---

## Polyfill de AbortSignal

O runtime Hermes não implementa `AbortSignal.any()`, usado pelo Firebase AI Logic. `src/polyfills/abort-signal-any.ts` é o **primeiro import** em `app/_layout.tsx`.

---

## Tecnologias utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.86.3 | Base da aplicação mobile |
| Expo SDK | 57 | Ferramental, câmera, storage, router |
| TypeScript | ~5.9 | Tipagem estática |
| Expo Router | ~57.0.0 | Roteamento file-based |
| Firebase Authentication | SDK 12 | Login, registro, recuperação de senha |
| Cloud Firestore | SDK 12 | Banco de dados |
| Firebase Storage | SDK 12 | Upload de recibos |
| Firebase AI Logic | SDK 12 | Extração de dados (Gemini) |
| React Native Reanimated | 4.5.1 | Animações |
| React Native Gesture Handler | ~2.32.0 | Gestos nativos |
| @shopify/react-native-skia | 2.6.2 | Canvas para gráficos |
| expo-skia-charts | ^0.5.0 | Gráficos donut |
| @react-native-async-storage/async-storage | 2.2.0 | Persistência de sessão Firebase Auth |

---

## Verificações realizadas

| Verificação | Resultado |
|---|---|
| TypeScript (`npx tsc --noEmit`) | ✅ 0 erros |
| Lint (`npx expo lint`) | ✅ 0 erros, 0 warnings — `react-hooks/set-state-in-effect` suprimido por arquivo com justificativa nos 2 hooks afetados |
| Build nativo | ⚠️ Não executado — requer EAS Build ou ambiente com Xcode/Android SDK |
| Execução em dispositivo iOS/Android | ⚠️ Não realizado — requer dispositivo físico ou simulador |

> Build nativo e testes em dispositivo não foram realizados neste ambiente e permanecem como pendências externas.

---

## Roteiro — Vídeo Demonstrativo (até 5 min)

> ⚠️ O vídeo ainda precisa ser gravado. Este roteiro é uma guia para a gravação.

| Tempo | Conteúdo |
|---|---|
| 0:00–0:30 | Apresentação: ByteBank, stack, o que evoluiu na Fase 4 |
| 0:30–1:00 | Login e registro — validação inline, mensagens de erro |
| 1:00–2:00 | Dashboard — saldo, patrimônio, gráficos |
| 2:00–3:00 | Nova transação — campos, upload de recibo, análise por IA |
| 3:00–3:30 | Listagem com filtros e scroll infinito |
| 3:30–4:00 | Editar e excluir — mostrar que o dashboard atualiza |
| 4:00–4:30 | Tema claro/escuro |
| 4:30–5:00 | Arquitetura, cache, regras Firestore e Storage |

---

## Tabela de rastreabilidade — Fase 4

| Requisito (PDF) | Evidência no código | Arquivos | Status |
|---|---|---|---|
| Arquitetura modular | `src/features/{auth,dashboard,transactions,receipts}` com context/hooks/services/types | `src/features/*/` | ✅ Concluído |
| State Management Patterns avançados | `AuthProvider` com `useReducer`; `TransactionProvider` com Context | `auth-provider.tsx`, `transaction-provider.tsx` | ✅ Concluído |
| Separação apresentação / domínio / infraestrutura | Interfaces `IAuthService`, `ITransactionService`; componentes não importam Firebase diretamente | `features/*/types/*.interface.ts`, `lib/firebase/` | ✅ Concluído |
| Lazy loading / carregamento sob demanda | `InteractionManager.runAfterInteractions` no dashboard adia o fetch durante animações; paginação cursor-based (20 itens/vez); **pré-carregamento da próxima página** em background (`prefetchNext` em `use-transactions.ts` — a página N+1 é buscada imediatamente após a página N ser exibida, sem nova requisição quando o usuário aciona scroll); carregamento condicional por autenticação. **Sem code splitting por rota em produção nativa no SDK 57** (async routes requer opt-in explícito) | `use-dashboard.ts`, `use-transactions.ts` | ✅ Concluído |
| Cache para otimizar requisições | Cache in-memory no `dashboardService`, chave `userId:ano-mês`, TTL 5 min, invalidado em create/edit/delete/logout e por `useTransactionWatcher` | `dashboard-cache.ts`, `dashboard.service.ts` | ✅ Concluído |
| Programação reativa | `onAuthStateChanged` (listener real do Auth); `useTransactionWatcher` com `onSnapshot` detecta criações, edições e exclusões do documento mais recente em tempo real (qualquer dispositivo), invalida cache e dispara refresh; exclusões de documentos não-topo são cobertas pelo `useFocusEffect`; `useFocusEffect` como recarga ao focar | `auth-provider.tsx`, `use-transaction-watcher.ts`, `transaction-list-screen.tsx` | ✅ Concluído (com limitação documentada no watcher) |
| Autenticação segura | Firebase Auth, persistência AsyncStorage, erros mapeados, guard `isFirebaseConfigured()` | `firebase-auth.service.ts`, `auth-provider.tsx` | ✅ Concluído |
| Isolamento de dados por usuário | Regras Firestore e Storage isolam por `userId`; serviços TypeScript validam antes de chamar Firebase | `firestore.rules`, `storage.rules`, `firestore-transaction.service.ts` | ✅ Concluído (regras precisam ser publicadas — ver pendências) |
| Regras Firestore completas | Create/update com validação de campos, `amount > 0`, `createdAt` imutável; delete somente dono | `firestore.rules` | ✅ Concluído (publicação pendente) |
| Regras Storage completas | `create`/`update` separados de `delete`; condições de autenticação, ownership, tamanho e tipo em AND explícito com `||` parentizado para tipos | `storage.rules` | ✅ Concluído (publicação pendente) |
| Criptografia de dados sensíveis | Firebase criptografa em repouso e em trânsito (infraestrutura Google Cloud). Sem criptografia client-side adicional — explicação na seção Segurança | Infraestrutura Firebase | ⚠️ Parcial |
| Credenciais fora do repositório | `.env` no `.gitignore`; nenhuma credencial em commits | `.gitignore`, `.env.example` | ✅ Concluído |
| README com tecnologias e passo a passo | Este arquivo | `README.md` | ✅ Concluído |
| Vídeo demonstrativo (até 5 min) | Roteiro elaborado; vídeo não gravado | Seção "Roteiro" neste README | ⏳ Pendente |

---

## Pendências externas

| Pendência | Instrução |
|---|---|
| **Publicar `firestore.rules`** | Firebase Console → Firestore → Regras → Publicar, ou `firebase deploy --only firestore:rules` |
| **Publicar `storage.rules`** | Firebase Console → Storage → Regras → Publicar, ou `firebase deploy --only storage` |
| **Implantar índices** (`firestore.indexes.json`) | `firebase deploy --only firestore:indexes` — inclui o índice `userId ASC, updatedAt DESC` necessário para o `useTransactionWatcher` |
| Gravar vídeo demonstrativo | Usar o roteiro acima; máximo 5 min |
| Teste em dispositivo físico | Requer Expo Go em iOS/Android — não realizado neste ambiente |
| Build de produção | Não gerado — requer EAS Build ou `npx expo export` |
