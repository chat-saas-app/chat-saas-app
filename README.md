# ChatApp - Micro SaaS de Mensagens por Telefone

## Descrição

O ChatApp é um micro SaaS funcional para troca de mensagens entre pessoas através do número de celular, similar ao WhatsApp. A aplicação oferece uma interface web responsiva com comunicação em tempo real via WebSocket.

## Funcionalidades Principais

### ✅ Autenticação por Telefone
- Cadastro de usuários com número de telefone brasileiro
- Login seguro com validação de senha
- Validação de formato de telefone (+55 11 99999-9999)

### ✅ Interface de Chat Moderna
- Design responsivo similar ao WhatsApp
- Lista de contatos na lateral esquerda
- Área de chat principal com bolhas de mensagem
- Indicadores de status online/offline
- Timestamps nas mensagens

### ✅ Mensagens em Tempo Real
- WebSocket para comunicação instantânea
- Envio e recebimento de mensagens em tempo real
- Histórico de conversas persistente
- Notificações visuais de novas mensagens

### ✅ Busca de Contatos
- Busca por nome de usuário ou número de telefone
- Interface intuitiva para adicionar novos contatos
- Resultados de busca em tempo real

## Tecnologias Utilizadas

### Backend
- **Flask** - Framework web Python
- **Flask-SocketIO** - WebSocket para comunicação em tempo real
- **SQLAlchemy** - ORM para banco de dados
- **SQLite** - Banco de dados local
- **Flask-CORS** - Suporte a CORS para integração frontend/backend

### Frontend
- **React** - Biblioteca JavaScript para interface
- **Vite** - Build tool moderno
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de interface
- **Lucide Icons** - Ícones modernos
- **Socket.IO Client** - Cliente WebSocket

## Estrutura do Projeto
