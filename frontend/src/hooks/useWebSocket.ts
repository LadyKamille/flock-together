import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketHook {
  sendMessage: (data: any) => void;
  lastMessage: string | null;
  readyState: number;
  connecting: boolean;
  connected: boolean;
}

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5;

const useWebSocket = (url: string): WebSocketHook => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Log essential info on mount
  useEffect(() => {
    console.log(`WebSocket hook initialized with URL: ${url}`);
    console.log('Running in browser:', typeof window !== 'undefined');
    console.log('WebSocket supported:', typeof WebSocket !== 'undefined');
    
    // Ensure WebSocket is supported
    if (typeof WebSocket === 'undefined') {
      console.error('WebSocket is not supported in this environment');
      setReadyState(-1); // Custom state for not supported
      return;
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      console.error('Invalid WebSocket URL:', url);
      setReadyState(-1); // Custom state for invalid URL
      return;
    }
  }, [url]);

  const connectWebSocket = useCallback(() => {
    try {
      // If we've exceeded the maximum number of reconnect attempts, give up
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(`Maximum reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
        setReadyState(WebSocket.CLOSED);
        return null;
      }
      
      console.log(`Attempting to connect to WebSocket at ${url} (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      
      // Close any existing socket
      if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
        try {
          socketRef.current.close();
        } catch (e) {
          console.warn('Error closing existing WebSocket:', e);
        }
      }
      
      // Set state to connecting
      setReadyState(WebSocket.CONNECTING);
      
      // Create a new WebSocket
      const ws = new WebSocket(url);
      socketRef.current = ws;
      console.log("WebSocket instance created");

      ws.onopen = () => {
        console.log('WebSocket connection established!');
        setReadyState(WebSocket.OPEN);
        reconnectAttempts.current = 0; // Reset reconnect attempts counter
        
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed: code=${event.code} reason=${event.reason}`);
        setReadyState(WebSocket.CLOSED);
        
        // Schedule reconnection attempt with exponential backoff
        if (!reconnectTimeoutRef.current) {
          reconnectAttempts.current += 1;
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          console.log(`Scheduling reconnection attempt in ${backoffTime/1000} seconds...`);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, backoffTime);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // We don't need to do anything special here, as an error will be followed by a close event
        // which will trigger our reconnection logic
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        setLastMessage(event.data);
      };

      setSocket(ws);
      return ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setReadyState(WebSocket.CLOSED);
      
      // Schedule a reconnection attempt even after an error
      if (!reconnectTimeoutRef.current) {
        reconnectAttempts.current += 1;
        const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        
        console.log(`Error occurred. Scheduling reconnection attempt in ${backoffTime/1000} seconds...`);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connectWebSocket();
        }, backoffTime);
      }
      
      return null;
    }
  }, [url]);

  // Connect and cleanup on mount/url change
  useEffect(() => {
    const ws = connectWebSocket();

    // Cleanup function
    return () => {
      // Close the socket if it exists
      if (socketRef.current) {
        try {
          console.log('Closing WebSocket connection due to component unmount or URL change');
          socketRef.current.close();
        } catch (e) {
          console.warn('Error closing WebSocket on cleanup:', e);
        }
      }
      
      // Clear any pending reconnect timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // Handle browser visibility changes to reconnect when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // If the connection is closed when the tab becomes visible, try to reconnect
        if (socketRef.current?.readyState === WebSocket.CLOSED) {
          console.log('Tab became visible and WebSocket is closed, attempting to reconnect');
          reconnectAttempts.current = 0; // Reset counter for visibility change
          connectWebSocket();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectWebSocket]);

  // Send message function with enhanced error handling
  const sendMessage = useCallback(
    (data: any) => {
      // First check if socket exists and is open
      if (!socket) {
        console.warn('Cannot send message, WebSocket instance does not exist');
        return;
      }
      
      if (socket.readyState !== WebSocket.OPEN) {
        console.warn(`Cannot send message, WebSocket is not open (readyState: ${socket.readyState})`);
        return;
      }
      
      // Try to send the message
      try {
        const message = JSON.stringify(data);
        console.log('Sending WebSocket message:', message);
        socket.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        
        // If sending fails due to a closed connection, try to reconnect
        if (socket.readyState === WebSocket.CLOSED) {
          console.log('WebSocket was closed when trying to send message, attempting to reconnect');
          connectWebSocket();
        }
      }
    },
    [socket, connectWebSocket]
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