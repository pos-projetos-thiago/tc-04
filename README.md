# ByteBank | Gerenciamento Financeiro Pessoal

![React Native](https://img.shields.io/badge/React_Native-0.88.1-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_SDK-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-58-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%E2%89%A522.13-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

Aplicação mobile de gerenciamento financeiro feita com React Native, Expo e Firebase para o Tech Challenge da Fase 4 da pós-graduação PosTech FIAP.

Repositório: [github.com/pos-projetos-thiago/tc-04](https://github.com/pos-projetos-thiago/tc-04).

O projeto dá continuidade ao app da Fase 3. Na Fase 4, a aplicação foi organizada por módulos, com serviços definidos por interfaces, cache para o dashboard, carregamento paginado e atualizações reativas. As regras de acesso do Firestore e do Storage estão versionadas junto ao código.

## Início rápido

Requisitos: Node.js compatível com o Expo SDK 58 (22.13+, 24.3+ ou 26+) e Expo Go no dispositivo. O computador e o dispositivo devem estar na mesma rede Wi-Fi.

No Windows com NVM, selecione uma versão compatível antes de iniciar, por exemplo `nvm use 24.12.0`. Confirme com `node --version`.

```bash
npm install
```

Configure o Firebase e preencha o arquivo `.env` conforme a seção [Configuração do Firebase](#configuração-do-firebase). Em seguida, inicie o projeto:

```bash
npm start
```

Escaneie o QR code exibido no terminal usando o Expo Go.

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

## Conexão com o Expo Go

`npm start` inicia o Metro em modo LAN, recomendado quando computador e dispositivo estão na mesma rede Wi-Fi. Se o QR code não conectar, confira a rede e permita o acesso do Node.js no firewall do computador.

### Modos disponíveis

| Comando | Modo | Quando usar |
|---|---|---|
| `npm start` | LAN (padrão) | Dispositivo na mesma rede Wi-Fi |
| `npm run start:tunnel` | Tunnel | Redes diferentes |
| `npm run start:localhost` | Localhost | Dispositivo via USB + `iproxy` |

---

## Arquitetura

A arquitetura aplica princípios de Clean Architecture ao contexto mobile: organiza funcionalidades por módulos, separa apresentação, lógica de aplicação e infraestrutura e usa interfaces para manter as features desacopladas dos adaptadores Firebase. As implementações são conectadas no ponto de composição da aplicação.

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
| Domínio | `features/*/hooks/`, `features/*/types/`, `features/*/utils/` | Interfaces de serviços e modelos de domínio |
| Infraestrutura | `lib/firebase/`, `features/*/services/` | Firebase SDK, interfaces de domínio |
| Estado global | `features/*/context/` | Domínio + hooks |

`AuthProvider`, os hooks de transações e o upload de recibos recebem serviços por interfaces. O serviço do dashboard também recebe `ITransactionService` por uma factory. O app conecta as implementações Firebase em `app/_layout.tsx`, mantendo as dependências externas na borda da aplicação.

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

### Comportamento no Expo SDK 58

No SDK 58, o Expo Router habilita async routes por padrão na web, em desenvolvimento e produção. Em iOS e Android, o recurso permanece experimental e não divide o bundle da versão nativa de produção. O projeto mantém as configurações padrão do Router e otimiza o carregamento mobile principalmente no acesso aos dados.

### O que o projeto faz para otimizar carregamento

- **`requestIdleCallback` no dashboard:** substitui o `InteractionManager`, removido no React Native 0.87. O fetch do Firestore é agendado quando a thread JavaScript fica ociosa, com timeout de 1 segundo e cancelamento no unmount. Implementado em `use-dashboard.ts`.
- **Paginação de transações:** scroll infinito cursor-based: carrega 20 itens por vez, busca mais ao rolar.
- **Pré-carregamento da próxima página (`prefetchNext`):** logo após a primeira página ser exibida, `use-transactions.ts` busca silenciosamente a segunda em background e a armazena em `prefetchRef`. Quando o usuário aciona `loadMore`, o resultado já está disponível: sem nova requisição ao Firestore. O padrão se repete a cada página carregada.
- **Dados do dashboard sob demanda:** `useDashboard` busca ao montar ou voltar à tela. O cache in-memory evita consultas repetidas. Em cache miss, totais de todo o período são calculados por agregações do Firestore; os documentos baixados são limitados ao mês selecionado para montar categorias e transações recentes. As agregações transferem apenas os resultados, mas o Firestore ainda processa entradas de índice, então o custo cresce com o histórico.
- **Carregamento condicional por autenticação:** telas de `(tabs)` e `(auth)` não montam até o estado de autenticação ser resolvido.

Assim, o carregamento sob demanda de dados é aplicado nas plataformas mobile; a divisão de código por rota segue o suporte padrão do Expo Router para cada plataforma.

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

O listener reativo acompanha a transação mais recente para detectar inclusões, edições e a exclusão desse registro. A lista também é atualizada ao receber foco; esse refresh cobre alterações remotas fora do escopo do listener, como a exclusão de uma transação antiga.

---

## Programação reativa

| Mecanismo | Onde | Comportamento |
|---|---|---|
| `onAuthStateChanged` | `AuthProvider` | **Listener em tempo real** do Firebase Auth. Reage imediatamente a login/logout em qualquer sessão. Cleanup com `unsubscribe` no `useEffect`. |
| `useTransactionWatcher` | `TransactionListScreen` | Usa `ITransactionService.watchLatestChange`; o adaptador Firestore mantém `onSnapshot` em uma consulta de um documento (`limit(1)`, `orderBy('updatedAt','desc')`). Detecta criações, edições e exclusão do documento mais recente. O escopo limitado reduz leituras; alterações em outros documentos são refletidas no próximo foco da tela. A assinatura é encerrada no unmount ou na troca de `userId`. |
| `useFocusEffect` | `DashboardScreen`, `TransactionListScreen` | Atualiza os dados quando a tela recebe foco, por exemplo, ao retornar de outra tela. `hasMountedRef` evita uma consulta duplicada na montagem inicial. |
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

### Proteção criptográfica

Os dados armazenados no Firestore, Authentication e Storage contam com criptografia em repouso gerenciada pelo Firebase; a comunicação com os serviços usa HTTPS. O acesso é complementado pelo Firebase Authentication e pelas regras de segurança por usuário. A aplicação utiliza o modelo de criptografia gerenciada pela plataforma e não cifra os campos do Firestore antes do envio. A sessão do Firebase Auth é persistida em AsyncStorage pelo adaptador React Native do SDK.

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
| React Native SVG | 15.16.0 | Renderização dos gráficos donut e elementos vetoriais |
| React Native Safe Area Context | ~5.11.0 | Áreas seguras em dispositivos |
| React Native Screens | ~4.30.0 | Telas nativas para navegação |
| @react-native-async-storage/async-storage | 2.2.0 | Persistência de sessão Firebase Auth |

---

## Verificações realizadas

| Verificação | Resultado |
|---|---|
| Expo Doctor (`npx expo-doctor`) | 20/20 verificações passaram após o alinhamento do SDK 58 |
| TypeScript (`npx tsc --noEmit`) | 0 erros após a migração para SDK 58 |
| Lint (`npx expo lint`) | 0 erros, 0 warnings |
| Expo Go em dispositivo iOS | Abertura do aplicativo validada após o alinhamento para o SDK 58 |

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
| Separação apresentação / domínio / infraestrutura | Providers e hooks de autenticação, transações e recibos dependem de contratos; implementações Firebase são conectadas no ponto de composição do app | `auth-service.interface.ts`, `transaction-service.interface.ts`, `receipt-service.interface.ts`, `app/_layout.tsx` | Implementado por módulos, contratos e composição de dependências |
| Lazy loading / carregamento sob demanda | Paginação cursor-based (20 itens/vez), pré-carregamento da próxima página (`prefetchNext`), carregamento condicional por autenticação e consultas de dashboard sob demanda. `requestIdleCallback` agenda o dashboard quando a thread fica ociosa. Async routes seguem o suporte da plataforma no SDK 58 | `use-dashboard.ts`, `use-transactions.ts`, `firestore-transaction.service.ts` | Implementado para dados; divisão de código por rota disponível na web conforme o Expo Router |
| Cache para otimizar requisições | Cache in-memory no `dashboardService`, chave `userId:ano-mês`, TTL 5 min, invalidado em create/edit/delete/logout e por `useTransactionWatcher` | `dashboard-cache.ts`, `dashboard.service.ts` | Concluído |
| Programação reativa | `onAuthStateChanged`; watcher chama o contrato do serviço, cuja implementação Firestore usa `onSnapshot` limitado ao documento mais recente. Invalida cache e recarrega a lista; alterações fora da consulta são atualizadas ao focar a tela | `auth-provider.tsx`, `use-transaction-watcher.ts`, `transaction-service.interface.ts`, `firestore-transaction.service.ts` | Implementado com consulta reativa de baixo escopo e atualização ao focar |
| Autenticação segura | Firebase Auth, persistência AsyncStorage, erros mapeados, guard `isFirebaseConfigured()` | `firebase-auth.service.ts`, `auth-provider.tsx` | Concluído |
| Isolamento de dados por usuário | Código das regras e serviços valida propriedade por `userId`; regras versionadas no repositório | `firestore.rules`, `storage.rules`, `firestore-transaction.service.ts` | Regras incluídas; conferir publicação no projeto Firebase configurado |
| Regras Firestore completas | Create/update validam allowlist de campos, tipos, limites, `amount > 0`, `createdAt` imutável; delete somente dono | `firestore.rules` | Regras incluídas; conferir publicação no projeto Firebase configurado |
| Regras Storage completas | `create`/`update` separados de `delete`; autenticação, ownership, limite de 10 MB e imagens/PDF/TXT | `storage.rules` | Regras incluídas; conferir publicação no projeto Firebase configurado |
| Criptografia de dados sensíveis | Criptografia em repouso e em trânsito gerenciada pelo Firebase; acesso protegido por autenticação e regras por usuário | Firebase, `firestore.rules`, `storage.rules` | Atendido pela proteção criptográfica da plataforma |
| Credenciais privadas fora do repositório | `.env` ignorado; não há chave de conta de serviço no código. A chave Firebase `EXPO_PUBLIC_*` é configuração de cliente, não segredo | `.gitignore`, `.env.example` | Concluído; restringir a chave no Google Cloud Console |
| README com tecnologias e passo a passo | Este arquivo inclui tecnologias, configuração local e link do repositório | `README.md` | Concluído |
| Vídeo demonstrativo (até 5 min) | Roteiro elaborado; vídeo não gravado | Seção "Roteiro" neste README | Pendente |

---

## Fechamento da entrega

| Etapa | Ação |
|---|---|
| Regras Firebase | Conferir se Firestore e Storage estão usando as versões dos arquivos versionados neste repositório. Um commit Git não publica regras no Console. |
| Demonstração | Gravar o vídeo de até cinco minutos usando o roteiro desta documentação. |
