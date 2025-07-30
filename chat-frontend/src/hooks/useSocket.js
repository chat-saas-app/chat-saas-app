import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket(user) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!user) return;

    // Conectar ao socket
    socketRef.current = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Conectado ao servidor');
      setConnected(true);
      
      // Entrar no chat
      socket.emit('join', { user_id: user.id });
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
      setConnected(false);
    });

    socket.on('user_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.user_id]: data.is_typing
      }));

      // Remover indicador após 3 segundos
      if (data.is_typing) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.user_id]: false
          }));
        }, 3000);
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const sendMessage = (receiverId, content) => {
    if (socketRef.current && user) {
      socketRef.current.emit('send_message', {
        sender_id: user.id,
        receiver_id: receiverId,
        content: content
      });
    }
  };

  return {
    socket: socketRef.current,
    connected,
    typingUsers,
    sendMessage
  };
}

