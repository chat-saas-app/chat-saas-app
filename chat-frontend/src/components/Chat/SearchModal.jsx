import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Search, User } from 'lucide-react';

export function SearchModal({ open, onOpenChange, currentUser, onSelectContact }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const users = await response.json();
          setSearchResults(users);
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelectUser = (user) => {
    onSelectContact({
      user_id: user.id,
      username: user.username,
      phone: user.phone,
      is_online: user.is_online,
      last_seen: user.last_seen,
      last_message_time: null,
      last_message_content: null
    });
    onOpenChange(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Contatos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Buscando...
              </div>
            ) : searchResults.length === 0 && searchTerm.trim() ? (
              <div className="text-center py-4 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Digite para buscar contatos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{user.username}</h4>
                        {user.is_online && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Online
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

