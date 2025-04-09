import { useState, useEffect, useCallback } from 'react';

interface WebSocketHook {
  sendMessage: (data: any) => void;
  lastMessage: string | null;
  readyState: number;
  connecting: boolean;
  connected: boolean;
}

const useWebSocket = (url: string): WebSocketHook => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setReadyState(WebSocket.OPEN);
    };

    ws.onclose = () => {
      setReadyState(WebSocket.CLOSED);
    };

    ws.onmessage = (event) => {
      setLastMessage(event.data);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (data: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    },
    [socket]
  );

  return {
    sendMessage,
    lastMessage,
    readyState,
    connecting: readyState === WebSocket.CONNECTING,
    connected: readyState === WebSocket.OPEN,
  };
};

export default useWebSocket;