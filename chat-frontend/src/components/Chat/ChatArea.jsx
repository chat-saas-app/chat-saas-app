import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Send, MessageCircle } from 'lucide-react';

export function ChatArea({ 
  currentUser, 
  selectedContact, 
  messages, 
  onSendMessage, 
  socket,
  typingUsers 
}) {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;

    onSendMessage(selectedContact.user_id, messageText.trim());
    setMessageText('');
    
    // Parar indicador de digitação
    if (socket && isTyping) {
      socket.emit('typing', {
        sender_id: currentUser.id,
        receiver_id: selectedContact.user_id,
        is_typing: false
      });
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);

    if (!socket || !selectedContact) return;

    // Enviar indicador de digitação
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        sender_id: currentUser.id,
        receiver_id: selectedContact.user_id,
        is_typing: true
      });
    }

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Parar indicador após 2 segundos sem digitar
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          sender_id: currentUser.id,
          receiver_id: selectedContact.user_id,
          is_typing: false
        });
      }
    }, 2000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Bem-vindo ao ChatApp</h3>
          <p>Selecione uma conversa para começar a trocar mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback>
              {getInitials(selectedContact.username)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-medium">{selectedContact.username}</h3>
            <div className="flex items-center gap-2">
              {selectedContact.is_online ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  Online
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Visto por último: {selectedContact.last_seen ? 
                    new Date(selectedContact.last_seen).toLocaleString('pt-BR') : 
                    'Nunca'
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUser.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          
          {/* Indicador de digitação */}
          {typingUsers[selectedContact.user_id] && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {selectedContact.username} está digitando...
                </p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={messageText}
            onChange={handleTyping}
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={!messageText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

