# ByteBank | Gerenciamento Financeiro Pessoal

![React Native](https://img.shields.io/badge/React_Native-0.88.1-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_SDK-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-58-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%E2%89%A522.13-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

Aplicação mobile de gerenciamento financeiro feita com React Native, Expo e Firebase para o Tech Challenge da Fase 4 da pós-graduação PosTech FIAP.

Repositório: [github.com/pos-projetos-thiago/tc-04](https://github.com/pos-projetos-thiago/tc-04).

O projeto dá continuidade ao app da Fase 3. Nesta etapa, foram organizados os módulos, adicionados cache e atualizações reativas e configuradas regras de acesso no Firestore e no Storage.

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

- **Node.js 22.13+ (linha 22), 24.3+ (linha 24) ou 26+**, conforme os requisitos do Expo SDK 58. Consulte a [tabela oficial de compatibilidade](https://docs.expo.dev/versions/v58.0.0/).
- npm
- Aplicativo **Expo Go** instalado no dispositivo (iOS ou Android)
- Conta no [Firebase Console](https://console.firebase.google.com)

---

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. Ative os serviços:
   - **Authentication**: provedor **Email/Senha**
   - **Cloud Firestore**: modo produção ou teste
   - **Storage**: bucket padrão
   - **AI Logic** (Vertex AI / Gemini): para extração de dados de recibos
3. Registre um app **Web** e copie as credenciais geradas.
4. Aplique as regras de segurança do Firestore e do Storage (arquivos `firestore.rules` e `storage.rules` na raiz).

> **As regras dos arquivos `firestore.rules` e `storage.rules` só têm efeito depois de publicadas no Firebase Console ou via CLI.** Enquanto não forem publicadas, o Firestore e o Storage usarão as regras existentes no projeto (ou negarão tudo em modo de produção).

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

> **No iOS, prefira LAN em vez de `--tunnel`**
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
app/                          # Expo Router: arquivo = rota
  (auth)/                     # Grupo de autenticação
  (tabs)/                     # Grupo de tabs principais
  transactions/               # Telas de criação e edição
  _layout.tsx                 # Layout raiz: providers e navegação

src/
  features/
    auth/                     # Autenticação
      context/                # AuthProvider (useReducer + Context)
      hooks/                  # useAuth
      services/               # FirebaseAuthService: IAuthService
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
      services/               # FirestoreTransactionService: ITransactionService
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

As responsabilidades estão organizadas em módulos, com interfaces para Auth e transações. O serviço do dashboard recebe `ITransactionService` por uma factory, e a implementação Firebase é conectada em um ponto de composição. A inversão de dependências ainda é parcial: outros hooks continuam importando o serviço concreto de transações. O projeto aplica separação prática de responsabilidades, sem afirmar uma Clean Architecture estrita.

---

## Gerenciamento de estado

### Auth: `useReducer` + Context

`AuthProvider` usa `useReducer` com ações explícitas (`SET_USER`, `SET_LOADING`, `SET_ERROR`, `CLEAR_ERROR`). O listener `onAuthStateChanged` é registrado uma única vez no `useEffect` com cleanup via `unsubscribe`: sem duplicação de assinaturas.

### Transações: Context + paginação cursor-based

`TransactionProvider` instancia `useTransactions` uma vez e expõe o estado globalmente via `TransactionContext`. Paginação via Firestore `startAfter`: quando o filtro muda, o cursor é resetado e a lista reinicia automaticamente.

### Dashboard: estado local por tela

`useDashboard` mantém estado local. Sem Context próprio: os dados são derivados sob demanda do Firestore com cache in-memory.

---

## Carregamento de rotas e dados (lazy loading)

### Comportamento real no Expo SDK 58

O Expo Router oferece **async routes** (code splitting por rota):

- **Web:** async routes são estáveis e ativadas por padrão no SDK 58; o code splitting por rota também se aplica à produção web.
- **Nativo (iOS/Android):** async routes continuam experimentais e desativadas por padrão; code splitting de rotas em produção nativa não está disponível.

Este projeto não define `asyncRoutes` explicitamente no `app.json`; usa o padrão do Expo Router no SDK 58.

Em produção nativa, o bundle JavaScript é carregado ao iniciar o app. A estratégia de carregamento sob demanda usada pelo projeto é aplicada aos dados da lista de transações.

### O que o projeto faz para otimizar carregamento

- **`requestIdleCallback` no dashboard:** substitui o `InteractionManager`, removido no React Native 0.87. O fetch do Firestore é agendado quando a thread JavaScript fica ociosa, com timeout de 1 segundo e cancelamento no unmount. Implementado em `use-dashboard.ts`.
- **Paginação de transações:** scroll infinito cursor-based: carrega 20 itens por vez, busca mais ao rolar.
- **Pré-carregamento da próxima página (`prefetchNext`):** logo após a primeira página ser exibida, `use-transactions.ts` busca silenciosamente a segunda em background e a armazena em `prefetchRef`. Quando o usuário aciona `loadMore`, o resultado já está disponível: sem nova requisição ao Firestore. O padrão se repete a cada página carregada.
- **Dados do dashboard sob demanda:** `useDashboard` busca ao montar ou voltar à tela. O cache in-memory evita consultas repetidas. Em cache miss, totais de todo o período são calculados por agregações do Firestore; os documentos baixados são limitados ao mês selecionado para montar categorias e transações recentes. As agregações transferem apenas os resultados, mas o Firestore ainda processa entradas de índice, então o custo cresce com o histórico.
- **Carregamento condicional por autenticação:** telas de `(tabs)` e `(auth)` não montam até o estado de autenticação ser resolvido.

O projeto não usa `React.lazy()` nem `Suspense` explicitamente. O comportamento padrão de async routes do SDK 58 se aplica à web; não há code splitting de rotas em produção nativa.

---

## Cache do dashboard

`dashboardService.getSummary()` consulta totais históricos com agregações do Firestore e usa cache in-memory com:

- **Chave:** `userId:ano-mês`: isolado por usuário e período
- **TTL:** 5 minutos (sem persistência entre sessões)
- **Invalidação explícita:**
  - Após criar ou editar transação (`TransactionForm`)
  - Após excluir transação (`TransactionListScreen`)
  - Ao fazer logout (`AuthProvider.signOut`)

As agregações são consultadas no servidor. Com o cache expirado e sem conexão, o dashboard pode não conseguir carregar; um resumo ainda válido em memória continua disponível até o TTL vencer.

**Limitação documentada:** o cache não observa mudanças remotas diretamente. O `useTransactionWatcher` invalida o cache ao detectar criação, edição ou exclusão da transação mais recente; uma exclusão remota de uma transação antiga pode não ser detectada enquanto a tela permanece aberta. Ao voltar à tela, `useFocusEffect` atualiza a lista.

---

## Programação reativa

| Mecanismo | Onde | Comportamento |
|---|---|---|
| `onAuthStateChanged` | `AuthProvider` | **Listener em tempo real** do Firebase Auth. Reage imediatamente a login/logout em qualquer sessão. Cleanup com `unsubscribe` no `useEffect`. |
| `useTransactionWatcher` | `TransactionListScreen` | **Listener `onSnapshot` sobre 1 documento** (`limit(1)`, `orderBy('updatedAt','desc')`). Detecta criações e edições (sempre vão ao topo por `updatedAt = now`) e exclusão do documento mais recente. **Não detecta exclusão de documentos não-topo**: nesses casos o `useFocusEffect` cobre o refresh ao retornar à tela. Limpo no unmount e na troca de `userId`. |
| `useFocusEffect` | `DashboardScreen`, `TransactionListScreen` | **Recarga imperativa ao focar a tela.** Busca os dados no momento em que a tela recebe foco (ex.: ao voltar de outra tela). `hasMountedRef` evita fetch duplo no mount inicial. **Não reage a mudanças remotas enquanto a tela permanece aberta**: nesse intervalo, o `useTransactionWatcher` assume esse papel para criações e edições. |
| `requestIdleCallback` | `useDashboard` | Agenda o fetch para um período ocioso da thread JavaScript, com timeout e cancelamento no unmount. |
| Reação ao `userId` | `TransactionProvider` | Quando o usuário muda, `useTransactions` reinicia automaticamente com o novo `userId`. |

`onAuthStateChanged` e `useTransactionWatcher` são listeners em tempo real (reagem sem polling). `useFocusEffect` é recarga imperativa e serve como fallback universal. A paginação cursor-based permanece inalterada: `useTransactionWatcher` usa `onSnapshot` apenas para detecção de mudanças, não para substituir a listagem paginada.

---

## Segurança

### Autenticação

Firebase Authentication com persistência via AsyncStorage, usando o adaptador React Native documentado pelo Firebase. Isso mantém a sessão entre aberturas do app, mas não equivale a armazenamento local criptografado por SecureStore. Erros são mapeados para mensagens em português sem expor códigos internos ao usuário. Guard `isFirebaseConfigured()` previne chamadas sem credenciais.

### Isolamento de dados

Cada transação tem campo `userId`. As regras do Firestore e do Storage garantem no servidor que apenas o dono pode acessar seus dados.

### Regras do Firestore (`firestore.rules`)

- **Deny-by-default**
- Leitura e exclusão: somente `userId == request.auth.uid`
- **Create/update:** allowlist de campos, tipos e limites para categoria, descrição e URL do recibo; `amount > 0`, `userId` correto e `createdAt` imutável

### Regras do Storage (`storage.rules`)

- Acesso isolado por `userId` no caminho `receipts/{userId}/…`
- Create/update: autenticação + ownership + tamanho ≤ 10 MB + tipo em `image/(jpeg|png|webp|heic)`, `application/pdf` ou `text/plain`: todas as condições são `&&` com os tipos em bloco `||` parentizado explicitamente
- Delete: somente o dono autenticado

### Criptografia

O Firebase criptografa todos os dados **em repouso** e **em trânsito** de forma automática, gerenciada pela infraestrutura do Google Cloud.

**Não foi implementada criptografia client-side dos campos do Firestore.** Uma chave incluída no bundle seria pública; criptografar dados remotos também exigiria definir como chaves são protegidas e compartilhadas entre dispositivos. O app usa a criptografia gerenciada pelo Firebase e regras de acesso. A sessão do Firebase permanece em AsyncStorage, conforme o adaptador React Native do SDK.

O PDF menciona "criptografia de dados sensíveis" sem especificar a técnica. O status deste item é mantido como **Parcial**: a criptografia em repouso e em trânsito está garantida pelo Firebase; criptografia client-side adicional não foi implementada.

### Análise de recibos por IA

Antes da análise, o app informa e pede confirmação para enviar o documento ao Google Gemini via Firebase AI Logic. O upload do recibo ao Firebase Storage ocorre separadamente quando o usuário salva a transação.

### Credenciais

`.env` está no `.gitignore` e não contém credenciais de conta de serviço. A configuração Firebase usa variáveis `EXPO_PUBLIC_*`, que são incorporadas ao app cliente por definição e não devem ser tratadas como segredos. As regras Firebase controlam acesso aos dados. App Check ainda não está configurado neste projeto.

---

## Polyfill de AbortSignal

O runtime Hermes não implementa `AbortSignal.any()`, usado pelo Firebase AI Logic. `src/polyfills/abort-signal-any.ts` é o **primeiro import** em `app/_layout.tsx`.

---

## Tecnologias utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.88.1 | Base da aplicativo mobile |
| Expo SDK | 58 | Ferramental, câmera, storage, router |
| TypeScript | ~6.0.3 | Tipagem estática |
| Expo Router | ~58.0.0 | Roteamento file-based |
| Firebase Authentication | SDK 12 | Login, registro, recuperação de senha |
| Cloud Firestore | SDK 12 | Banco de dados |
| Firebase Storage | SDK 12 | Upload de recibos |
| Firebase AI Logic | SDK 12 | Extração de dados (Gemini) |
| React Native Reanimated | 4.7.1 | Animações |
| React Native Gesture Handler | ~3.3.0 | Gestos nativos |
| React Native Worklets | 0.13.0 | Execução de worklets para animações |
| React Native SVG | 15.16.0 | Renderização de SVG |
| React Native Safe Area Context | ~5.11.0 | Áreas seguras em dispositivos |
| React Native Screens | ~4.30.0 | Telas nativas para navegação |
| @shopify/react-native-skia | 2.14.0 | Canvas para gráficos |
| expo-skia-charts | ^0.5.0 | Gráficos donut |
| @react-native-async-storage/async-storage | 2.2.0 | Persistência de sessão Firebase Auth |

---

## Verificações realizadas

| Verificação | Resultado |
|---|---|
| Expo Doctor (`npx expo-doctor`) | 20/20 verificações passaram após o alinhamento do SDK 58 |
| TypeScript (`npx tsc --noEmit`) | 0 erros após a migração para SDK 58 |
| Lint (`npx expo lint`) | 0 erros, 0 warnings |
| Expo Go em iPhone | Aplicativo abriu e foi testado após a migração para SDK 58 |
| Build nativo | Não executado: requer EAS Build ou ambiente com Xcode/Android SDK |
| Auditoria de dependências | Após atualizações compatíveis, `npm audit` reportou 12 moderados, 0 altos e 0 críticos; `npm audit --omit=dev` reportou 5 moderados, 0 altos e 0 críticos. Os moderados restantes vêm da cadeia de ferramentas do Expo SDK 58 e não foram forçados a uma versão antiga do Expo |

> O teste no iPhone confirmou que o app abre no Expo Go. Um build nativo de produção ainda não foi gerado.

---

## Roteiro: Vídeo Demonstrativo (até 5 min)

> O vídeo ainda precisa ser gravado. Este roteiro é um guia para a gravação.

| Tempo | Conteúdo |
|---|---|
| 0:00-0:30 | Apresentação: ByteBank, stack, o que evoluiu na Fase 4 |
| 0:30-1:00 | Login e registro: validação inline, mensagens de erro |
| 1:00-2:00 | Dashboard: saldo, patrimônio, gráficos |
| 2:00-3:00 | Nova transação: campos, upload de recibo, análise por IA |
| 3:00-3:30 | Listagem com filtros e scroll infinito |
| 3:30-4:00 | Editar e excluir: mostrar que o dashboard atualiza |
| 4:00-4:30 | Tema claro/escuro |
| 4:30-5:00 | Arquitetura, cache, regras Firestore e Storage |

---

## Tabela de rastreabilidade: Fase 4

| Requisito (PDF) | Evidência no código | Arquivos | Status |
|---|---|---|---|
| Arquitetura modular | `src/features/{auth,dashboard,transactions,receipts}` com context/hooks/services/types | `src/features/*/` | Concluído |
| State Management Patterns avançados | `AuthProvider` com `useReducer`; `TransactionProvider` com Context | `auth-provider.tsx`, `transaction-provider.tsx` | Concluído |
| Separação apresentação / domínio / infraestrutura | Interfaces `IAuthService`, `ITransactionService`; o serviço do dashboard recebe o repositório por factory, conectado em um ponto de composição. Outros hooks ainda usam o serviço Firebase concreto | `features/*/types/*.interface.ts`, `dashboard.service.ts`, `dashboard-service.instance.ts` | Separação prática implementada; inversão de dependências parcial |
| Lazy loading / carregamento sob demanda | Paginação cursor-based (20 itens/vez), pré-carregamento em background da próxima página (`prefetchNext`), carregamento condicional por autenticação e totais históricos via agregações do Firestore. `requestIdleCallback` agenda o dashboard quando a thread fica ociosa. No SDK 58, async routes são padrão na web; code splitting nativo de produção não está disponível | `use-dashboard.ts`, `use-transactions.ts`, `firestore-transaction.service.ts` | Dados carregados sob demanda; agregações ainda percorrem entradas de índice e o bundle nativo não tem divisão por rota |
| Cache para otimizar requisições | Cache in-memory no `dashboardService`, chave `userId:ano-mês`, TTL 5 min, invalidado em create/edit/delete/logout e por `useTransactionWatcher` | `dashboard-cache.ts`, `dashboard.service.ts` | Concluído |
| Programação reativa | `onAuthStateChanged` (listener real do Auth); `useTransactionWatcher` com `onSnapshot` detecta criações, edições e exclusões do documento mais recente em tempo real (qualquer dispositivo), invalida cache e dispara refresh; exclusões de documentos não-topo são cobertas pelo `useFocusEffect`; `useFocusEffect` como recarga ao focar | `auth-provider.tsx`, `use-transaction-watcher.ts`, `transaction-list-screen.tsx` | Concluído (com limitação documentada no watcher) |
| Autenticação segura | Firebase Auth, persistência AsyncStorage, erros mapeados, guard `isFirebaseConfigured()` | `firebase-auth.service.ts`, `auth-provider.tsx` | Concluído |
| Isolamento de dados por usuário | Código das regras e serviços valida propriedade por `userId`; as regras locais deste commit ainda precisam ser republicadas | `firestore.rules`, `storage.rules`, `firestore-transaction.service.ts` | A versão anterior foi publicada em `tc03-fiap`; republicar as regras atualizadas |
| Regras Firestore completas | Create/update validam allowlist de campos, tipos, limites, `amount > 0`, `createdAt` imutável; delete somente dono | `firestore.rules` | Regras locais atualizadas; republicar no Firebase `tc03-fiap` |
| Regras Storage completas | `create`/`update` separados de `delete`; autenticação, ownership, limite de 10 MB e imagens/PDF/TXT | `storage.rules` | Regras locais atualizadas; republicar no Firebase `tc03-fiap` |
| Criptografia de dados sensíveis | Firebase criptografa em repouso e em trânsito. Sem criptografia client-side adicional; sessão Firebase fica em AsyncStorage | Infraestrutura Firebase e Firebase Auth | Parcial |
| Credenciais privadas fora do repositório | `.env` ignorado; não há chave de conta de serviço no código. A chave Firebase `EXPO_PUBLIC_*` é configuração de cliente, não segredo | `.gitignore`, `.env.example` | Concluído; restringir a chave no Google Cloud Console |
| README com tecnologias e passo a passo | Este arquivo inclui tecnologias, configuração local e link do repositório | `README.md` | Concluído |
| Vídeo demonstrativo (até 5 min) | Roteiro elaborado; vídeo não gravado | Seção "Roteiro" neste README | Pendente |

---

## Pendências externas

| Pendência | Instrução |
|---|---|
| Publicar as regras Firestore/Storage atualizadas | No Firebase `tc03-fiap`, publique as versões dos arquivos `firestore.rules` e `storage.rules` deste commit; as versões do Console não são alteradas por um commit Git |
| Restringir chave pública Firebase | No Google Cloud Console, aplique restrições de APIs e apps compatíveis à chave usada pelo cliente; não a trate como segredo |
| Configurar App Check | Avaliar e ativar App Check no Firebase para Firestore, Storage e Firebase AI Logic; testar em desenvolvimento antes de exigir atestação |
| Gravar vídeo demonstrativo | Usar o roteiro acima; máximo 5 min |
| Reavaliar avisos moderados de dependências | Acompanhar correções compatíveis do Expo SDK 58; não usar `npm audit fix --force`, pois ele propõe rebaixar o Expo para SDK 52 |
| Build de produção (opcional) | Não gerado: requer EAS Build ou `npx expo export` |
