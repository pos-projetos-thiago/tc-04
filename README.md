# ByteBank - Gerenciamento Financeiro Pessoal

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.88.1-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native 0.88.1">
  <img src="https://img.shields.io/badge/Expo_SDK-58-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 58">
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 6.0">
  <img src="https://img.shields.io/badge/Firebase_SDK-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase SDK 12">
  <img src="https://img.shields.io/badge/Node.js-22.13%2B_or_24.3%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 22.13 ou 24.3 ou superior">
</p>

Aplicativo mobile de gerenciamento financeiro pessoal desenvolvido com React Native, Expo e Firebase para o Tech Challenge da Fase 4 da pós-graduação PosTech FIAP. O projeto evolui a aplicação desenvolvida na Fase 3.

[Acessar o repositório no GitHub](https://github.com/pos-projetos-thiago/tc-04)

## Funcionalidades

- Login, cadastro e recuperação de senha com Firebase Authentication.
- Dashboard com saldo, patrimônio, movimentações e gráficos.
- Cadastro, edição e exclusão de transações, com filtros e paginação.
- Upload de recibos e extração de dados de documentos com Firebase AI Logic/Gemini.
- Temas claro e escuro.

## Pré-requisitos

- Node.js 22.13 ou superior, 24.3 ou superior, ou 26 ou superior.
- npm.
- Expo Go instalado no dispositivo iOS ou Android.
- Projeto no Firebase Console.

Para abrir o app em um dispositivo físico com Expo Go, mantenha o computador e o celular na mesma rede Wi-Fi.

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. Habilite Authentication com o provedor e-mail/senha, Cloud Firestore e Storage.
3. Para importar dados de recibos, habilite Firebase AI Logic.
4. Registre um app Web e copie os dados de configuração do SDK.
5. Crie o arquivo `.env` na raiz do projeto com base no `.env.example`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

O `.env` está no `.gitignore`. As variáveis `EXPO_PUBLIC_*` são usadas pelo aplicativo cliente e não devem ser tratadas como segredos.

## Instalação e execução

Na pasta do projeto, instale as dependências:

```bash
npm install
```

Inicie o Expo:

```bash
npm start
```

Escaneie o QR code do terminal com o Expo Go. O script inicia o servidor em modo LAN.

## Organização do projeto

As telas e rotas usam Expo Router. As funcionalidades ficam organizadas por módulos em `src/features`:

```text
src/features/
  auth/          autenticação e sessão
  dashboard/     resumo financeiro, cache e gráficos
  receipts/      recibos e integração de análise por IA
  transactions/  transações, filtros e paginação
src/lib/firebase/ configuração e adaptadores Firebase
src/shared/      componentes e utilitários compartilhados
```

Dentro dos módulos, componentes cuidam da apresentação, hooks e tipos concentram a lógica da aplicação, e serviços implementam os contratos de acesso à infraestrutura. As implementações Firebase são conectadas em `app/_layout.tsx`.

## Melhorias da Fase 4

- **Estado:** `useReducer` e Context na autenticação; Context para compartilhar o estado das transações.
- **Desempenho:** cache em memória do dashboard com TTL de cinco minutos, paginação cursor-based e pré-carregamento da próxima página.
- **Reatividade:** listeners do Firebase Auth e do Firestore. O watcher de transações observa o registro mais recente; a lista também atualiza ao receber foco.
- **Carregamento:** dados do dashboard e páginas de transações são carregados sob demanda. O carregamento do código das rotas depende do suporte do Expo Router em cada plataforma.

## Segurança e implantação Firebase

As regras de [Firestore](firestore.rules) e [Storage](storage.rules), e os índices em [firestore.indexes.json](firestore.indexes.json), estão versionados no repositório. Para publicá-los com a CLI do Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase use <SEU_PROJECT_ID>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

O deploy é separado do commit e do push. Confira no Firebase Console se as regras e os índices publicados correspondem aos arquivos do projeto.

O Firebase gerencia a criptografia dos dados armazenados e a comunicação com os serviços usa HTTPS. O aplicativo não cifra os campos do Firestore antes do envio. O acesso aos dados é controlado pela autenticação e pelas regras por usuário.

## Tecnologias

React Native, Expo SDK 58, TypeScript, Expo Router, Firebase Authentication, Cloud Firestore, Firebase Storage, Firebase AI Logic, React Context, `useReducer` e React Native SVG.

## Entrega

O código-fonte e as instruções para execução estão neste repositório. O vídeo demonstrativo de até cinco minutos, solicitado no desafio, deve apresentar as funcionalidades e as melhorias da Fase 4; a gravação ainda está pendente.
