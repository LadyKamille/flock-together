import { useState, useEffect, useCallback, useRef } from 'react';

// Add a top-level log to check if this file is being loaded
console.log('useWebSocket.ts is being loaded');

// Extend WebSocket to add our custom property for rate limiting
interface ExtendedWebSocket extends WebSocket {
  lastSendTime?: number;
}

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
  const [socket, setSocket] = useState<ExtendedWebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const socketRef = useRef<ExtendedWebSocket | null>(null);
  
  // Log essential info on mount
  useEffect(() => {
    console.log(`WebSocket hook initialized with URL: ${url}`);
    console.log('Running in browser:', typeof window !== 'undefined');
    console.log('WebSocket supported:', typeof WebSocket !== 'undefined');
    console.log('WebSocket.CONNECTING:', WebSocket.CONNECTING);
    console.log('WebSocket.OPEN:', WebSocket.OPEN);
    console.log('WebSocket.CLOSING:', WebSocket.CLOSING);
    console.log('WebSocket.CLOSED:', WebSocket.CLOSED);
    
    // Ensure WebSocket is supported
    if (typeof WebSocket === 'undefined') {
      console.error('WebSocket is not supported in this environment');
      setReadyState(-1); // Custom state for not supported
      return;
    }
    
    // Validate URL
    try {
      const parsedUrl = new URL(url);
      console.log('Parsed WebSocket URL:', {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.search
      });
    } catch (error) {
      console.error('Invalid WebSocket URL:', url, error);
      setReadyState(-1); // Custom state for invalid URL
      return;
    }
  }, [url]);

  const connectWebSocket = useCallback(async () => {
    // Safari detection
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Normalize URL for better cross-browser compatibility
    let normalizedUrl = url;
    try {
      const urlObj = new URL(url);
      // Ensure proper protocol based on current page
      if (window.location.protocol === 'https:' && urlObj.protocol === 'ws:') {
        urlObj.protocol = 'wss:';
        normalizedUrl = urlObj.toString();
      }
    } catch (error) {
      console.error('Error normalizing WebSocket URL:', error);
    }
    
    console.log('connectWebSocket function called with URL:', normalizedUrl);
    
    try {
      // If we've exceeded the maximum number of reconnect attempts, give up
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(`Maximum reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
        setReadyState(WebSocket.CLOSED);
        return null;
      }
      
      console.log(`Attempting to connect to WebSocket at ${normalizedUrl} (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      
      // Close any existing socket with special handling for Safari
      if (socketRef.current) {
        console.log('Existing socket state:', {
          readyState: socketRef.current.readyState,
          readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socketRef.current.readyState] || 'UNKNOWN'
        });
        
        if (socketRef.current.readyState !== WebSocket.CLOSED) {
          try {
            console.log('Closing existing WebSocket connection before creating a new one');
            // For Safari, remove event handlers first to prevent any callbacks during closing
            if (isSafari) {
              socketRef.current.onopen = null;
              socketRef.current.onmessage = null;
              socketRef.current.onerror = null;
              socketRef.current.onclose = null;
            }
            socketRef.current.close();
            
            // For Safari, add a small delay after closing
            if (isSafari) {
              console.log('Safari detected: Adding small delay after closing connection');
              // Small delay to ensure Safari has fully closed the previous connection
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          } catch (e) {
            console.warn('Error closing existing WebSocket:', e);
          }
        }
      } else {
        console.log('No existing WebSocket connection to close');
      }
      
      // Set state to connecting
      setReadyState(WebSocket.CONNECTING);
      console.log('Set readyState to CONNECTING:', WebSocket.CONNECTING);
      
      // Log the complete WebSocket URL
      console.log('Connecting to full WebSocket URL:', {
        normalizedUrl,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        port: window.location.port
      });
      
      // Create a new WebSocket - with special handling for Safari
      console.log('Creating new WebSocket instance...');
      
      // Create the WebSocket instance
      const ws = new WebSocket(normalizedUrl);
      
      // Set up event handlers immediately
      console.log("WebSocket instance created with initial readyState:", ws.readyState);

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
        // Safari may need special error handling
        if (isSafari) {
          console.log('Safari detected: Adding additional error logging');
          // Log additional information that might help debug Safari-specific issues
          console.log('Current connection state:', {
            readyState: ws.readyState,
            url: normalizedUrl,
            binaryType: ws.binaryType,
            protocol: ws.protocol
          });
        }
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        setLastMessage(event.data);
      };

      // Store references and set state
      socketRef.current = ws;
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
    console.log('Connection effect triggered with URL:', url);
    console.log('Browser information:', {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform
    });
    
    // Safari detection
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    console.log('Is Safari browser:', isSafari);
    
    // Manually check if we should proceed with connection
    if (!url || url.trim() === '') {
      console.error('Empty URL provided to useWebSocket');
      return;
    }
    
    // Normalize URL format for better cross-browser compatibility
    let normalizedUrl = url;
    try {
      const urlObj = new URL(url);
      // Ensure proper protocol based on current page
      if (window.location.protocol === 'https:' && urlObj.protocol === 'ws:') {
        urlObj.protocol = 'wss:';
        normalizedUrl = urlObj.toString();
        console.log('Normalized WebSocket URL to use secure protocol:', normalizedUrl);
      }
    } catch (error) {
      console.error('Error normalizing WebSocket URL:', error);
    }
    
    // Add a small delay before connecting (helps with initialization timing)
    console.log('Scheduling WebSocket connection in 100ms...');
    const connectionTimer = setTimeout(() => {
      console.log('Now attempting WebSocket connection to:', normalizedUrl);
      
      // For Safari, try to ensure no previous connections are active
      if (isSafari && socketRef.current) {
        try {
          console.log('Safari detected: Explicitly closing any existing connections before creating new one');
          socketRef.current.onclose = null; // Prevent the reconnect logic in the onclose handler
          socketRef.current.close();
          socketRef.current = null;
        } catch (e) {
          console.warn('Error closing existing WebSocket on Safari:', e);
        }
      }
      
      // Now connect
      const ws = connectWebSocket();
      if (ws) {
        console.log('WebSocket connection initiated successfully');
      } else {
        console.warn('WebSocket connection failed to initialize');
      }
    }, 100);

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket resources');
      
      // Clear the connection timer if it exists
      clearTimeout(connectionTimer);
      
      // Close the socket if it exists - with special handling for Safari
      if (socketRef.current) {
        try {
          console.log('Closing WebSocket connection due to component unmount or URL change');
          // For Safari, make sure we remove event handlers first
          if (isSafari) {
            socketRef.current.onopen = null;
            socketRef.current.onmessage = null;
            socketRef.current.onerror = null;
            socketRef.current.onclose = null;
          }
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
  }, [connectWebSocket, url]);

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

  // Send message function with enhanced error handling and Safari compatibility
  const sendMessage = useCallback(
    (data: any) => {
      // First check if socket exists and is open
      if (!socket) {
        console.warn('Cannot send message, WebSocket instance does not exist');
        return;
      }
      
      // Safari detection for special handling
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (socket.readyState !== WebSocket.OPEN) {
        console.warn(`Cannot send message, WebSocket is not open (readyState: ${socket.readyState})`);
        
        if (isSafari) {
          console.log('Safari detected: Adding more diagnostics for WebSocket readyState issue');
          console.log({
            readyState: socket.readyState,
            readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket.readyState] || 'UNKNOWN',
            protocol: socket.protocol,
            binaryType: socket.binaryType,
            url: socket.url
          });
        }
        
        // If we detect Safari and the socket is not in CLOSING state, try to reconnect
        // Safari sometimes gets stuck in CONNECTING state
        if (isSafari && socket.readyState !== WebSocket.CLOSING) {
          console.log('Safari detected with non-open socket, attempting to reconnect');
          // Introduce small delay before reconnect to let Safari clean up
          setTimeout(() => {
            connectWebSocket();
          }, 100);
        }
        return;
      }
      
      // Rate limiting for Safari to prevent excessive messages
      // This helps with Safari's "sending too many messages" issue
      if (isSafari) {
        // Simple debounce mechanism for Safari
        const now = Date.now();
        const lastSendTime = socket.lastSendTime || 0;
        
        if (now - lastSendTime < 50) { // 50ms debounce for Safari
          console.log('Safari detected: Rate limiting WebSocket messages');
          return;
        }
        
        // Update last send time
        socket.lastSendTime = now;
      }
      
      // Try to send the message
      try {
        const message = JSON.stringify(data);
        
        // Use more lightweight logging to reduce console noise
        console.log(`Sending WebSocket message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
        
        socket.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        
        // If sending fails due to a closed connection, try to reconnect
        if (socket.readyState === WebSocket.CLOSED) {
          console.log('WebSocket was closed when trying to send message, attempting to reconnect');
          // Small delay for Safari
          setTimeout(() => {
            connectWebSocket();
          }, isSafari ? 200 : 0);
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