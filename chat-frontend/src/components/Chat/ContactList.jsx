import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Search, Plus, User } from 'lucide-react';
import { SearchModal } from './SearchModal';

export function ContactList({ currentUser, selectedContact, onSelectContact, conversations }) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.phone.includes(searchTerm)
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-80 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversas</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSearchModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
              <Button
                variant="link"
                onClick={() => setSearchModalOpen(true)}
                className="mt-2"
              >
                Buscar contatos
              </Button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.user_id}
                className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                  selectedContact?.user_id === conversation.user_id ? 'bg-accent' : ''
                }`}
                onClick={() => onSelectContact(conversation)}
              >
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarFallback>
                    {getInitials(conversation.username)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">
                      {conversation.username}
                    </h3>
                    <div className="flex items-center gap-2">
                      {conversation.is_online && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Online
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.last_message_content || 'Nenhuma mensagem'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Search Modal */}
      <SearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        currentUser={currentUser}
        onSelectContact={onSelectContact}
      />
    </div>
  );
}

