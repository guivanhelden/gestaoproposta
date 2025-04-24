# Gestão de Propostas

Aplicação para gestão de propostas de seguros.

## Requisitos

- Node.js 18 ou superior
- PostgreSQL 16

## Instalação

1. Clone o repositório
```bash
git clone [url-do-repositório]
cd gestaoproposta
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
Edite o arquivo `.env` com as configurações apropriadas:
- PORT: porta do servidor
- DATABASE_URL: URL de conexão com o banco de dados
- SESSION_SECRET: segredo para criptografar as sessões

## Comandos

- `npm run dev`: Inicia o servidor em modo de desenvolvimento
- `npm run build`: Compila o projeto para produção
- `npm start`: Inicia o servidor em modo de produção
- `npm run check`: Verifica erros de tipagem TypeScript
- `npm run db:push`: Atualiza o banco de dados com o esquema atual

## Estrutura do Projeto

- `client/`: Frontend React
- `server/`: Backend Express
- `shared/`: Código compartilhado entre cliente e servidor
- `dist/`: Arquivos compilados para produção 