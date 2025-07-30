import { useState, useEffect } from 'react';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ContactList } from './components/Chat/ContactList';
import { ChatArea } from './components/Chat/ChatArea';
import { Button } from './components/ui/button';
import { useSocket } from './hooks/useSocket';
import { LogOut, User } from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' ou 'register'
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const { socket, connected, typingUsers, sendMessage } = useSocket(user);

  // Verificar se usuário já está logado
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Carregar conversas quando usuário estiver logado
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Carregar mensagens quando contato for selecionado
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.user_id);
    }
  }, [selectedContact]);

  // Escutar novas mensagens via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      const { message, sender } = data;
      
      // Atualizar mensagens se for da conversa atual
      if (selectedContact && 
          (message.sender_id === selectedContact.user_id || 
           message.receiver_id === selectedContact.user_id)) {
        setMessages(prev => [...prev, message]);
      }
      
      // Atualizar lista de conversas
      loadConversations();
    };

    const handleMessageSent = (data) => {
      const { message } = data;
      setMessages(prev => [...prev, message]);
      loadConversations();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
    };
  }, [socket, selectedContact]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await fetch(`/api/messages/${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      setSelectedContact(null);
      setConversations([]);
      setMessages([]);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
  };

  const handleSendMessage = (receiverId, content) => {
    sendMessage(receiverId, content);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/20">
        {authMode === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="font-medium">{user.username}</span>
            </div>
            {connected && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Conectado</span>
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex">
        <ContactList
          currentUser={user}
          selectedContact={selectedContact}
          onSelectContact={handleSelectContact}
          conversations={conversations}
        />
        
        <ChatArea
          currentUser={user}
          selectedContact={selectedContact}
          messages={messages}
          onSendMessage={handleSendMessage}
          socket={socket}
          typingUsers={typingUsers}
        />
      </div>
    </div>
  );
}

export default App;
