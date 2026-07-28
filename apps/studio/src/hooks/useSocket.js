import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(user, token) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const socket = io(window.location.origin, {
      path: '/socket.io',
      auth: { token },
    });
    socketRef.current = socket;
    socket.emit('join:user', user.id);
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.id, token]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) socketRef.current.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    if (socketRef.current) socketRef.current.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  const joinWhiteboard = useCallback((boardId, userInfo) => {
    emit('whiteboard:join', { boardId, user: userInfo });
  }, [emit]);

  const leaveWhiteboard = useCallback((boardId) => {
    emit('whiteboard:leave', { boardId });
  }, [emit]);

  return { socketRef, emit, on, off, joinWhiteboard, leaveWhiteboard };
}
