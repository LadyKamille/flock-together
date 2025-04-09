import { useState, useEffect, useCallback, useRef } from 'react';

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
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connectWebSocket = useCallback(() => {
    try {
      console.log(`Attempting to connect to WebSocket at ${url}`);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setReadyState(WebSocket.OPEN);
        // Clear any reconnect timeout if we successfully connect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setReadyState(WebSocket.CLOSED);
        
        // Schedule reconnection attempt
        if (!reconnectTimeoutRef.current) {
          console.log('Scheduling reconnection attempt in 3 seconds...');
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        setLastMessage(event.data);
      };

      setSocket(ws);

      return ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      return null;
    }
  }, [url]);

  useEffect(() => {
    const ws = connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback(
    (data: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.stringify(data);
          console.log('Sending WebSocket message:', message);
          socket.send(message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      } else {
        console.warn('Cannot send message, WebSocket is not open');
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