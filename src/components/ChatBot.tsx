import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, SendHorizontal, Loader2, Mic, MicOff, VolumeX, Volume2, Headphones, MessageSquare, Square, Send, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from "uuid";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getFinancialAdvice, synthesizeSpeech, transcribeSpeech } from '@/services/api';

type InputMode = "text" | "voice";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
};

// Add SpeechRecognition type definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: any;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal?: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: { error: string }) => void;
  start(): void;
  stop(): void;
}

// Fix the SpeechRecognition type declaration
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Create a wrapper function to safely start speech recognition
const startSpeechRecognition = (recognition: SpeechRecognition) => {
  return new Promise<void>((resolve, reject) => {
    try {
      recognition.start();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

const ChatBot = forwardRef((props, ref) => {
  const { userData } = useAuth();
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // For speech recognition and synthesis
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add initial welcome message after component mounts
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{
        id: uuidv4(),
        role: "assistant",
        content: "Hi there! I'm your financial advisor. I can provide general financial advice and tips. How can I assist you today?"
      }]);
      
      // After initial message is added, mark initial load as complete
      setTimeout(() => {
        setInitialLoad(false);
      }, 100);
    }
  }, []);

  // Prevent default browser scroll behavior
  useEffect(() => {
    // Store the current scroll position
    const scrollPosition = window.scrollY;
    
    // Restore scroll position after render
    return () => {
      window.scrollTo(0, scrollPosition);
    };
  }, [chatHistory]);

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    if (messagesEndRef.current && !initialLoad) {
      // Get container element
      const chatContainer = chatContainerRef.current;
      
      if (chatContainer) {
        // Check if user was already at the bottom before the message was added
        const wasAtBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 100;
        
        // Only auto-scroll the chat container if user was already at the bottom or if a new message was just added
        if (wasAtBottom) {
          // Use requestAnimationFrame to ensure this runs after render
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end'
            });
          });
        }
      }
    }
  }, [chatHistory, initialLoad]);

  // Initialize speech recognition
  useEffect(() => {
    const initSpeechRecognition = () => {
      if (!recognitionRef.current) {
        if ('SpeechRecognition' in window) {
          recognitionRef.current = new (window as any).SpeechRecognition();
        } else if ('webkitSpeechRecognition' in window) {
          recognitionRef.current = new (window as any).webkitSpeechRecognition();
        } else {
          console.warn('Speech recognition not supported');
          return;
        }
  
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event) => {
          try {
            const transcript = event.results[0][0].transcript;
            console.log('Transcript:', transcript);
            
            if (!transcript || !transcript.trim()) {
              console.warn('Empty transcript received');
              return;
            }
            
            setMessage(transcript);
            
            // If this is voice input, process it directly
            processVoiceInput(transcript);
          } catch (e) {
            console.error('Error handling speech result:', e);
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
  
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            // Add a message to chat history about microphone permissions
            const assistantMessage: ChatMessage = {
              id: uuidv4(),
              role: "assistant",
              content: "I need permission to access your microphone. Please click the microphone icon in your browser address bar and allow access."
            };
            
            setChatHistory((prev) => [...prev, assistantMessage]);
          } else if (event.error === 'no-speech') {
            console.log('No speech detected');
          }
        };
      }
    };

    initSpeechRecognition();
    
    // Cleanup
    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition on cleanup:', e);
        }
      }
      
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error('Error stopping media recorder on cleanup:', e);
        }
      }
    };
  }, [inputMode, isListening, isRecording]);

  // Process voice input for STT mode
  const processVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: transcript
    };
    
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    
    try {
      // Get response from the financial advice API
      const response = await getFinancialAdvice(transcript);
      
      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: response
      };
      
      setChatHistory((prev) => [...prev, assistantMessage]);
      
      // If text-to-speech is enabled, speak the response
      if (isTTSEnabled) {
        speakText(response);
      }
    } catch (error) {
      console.error("Error with chatbot:", error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to the financial advice service right now. Please try again later."
      };
      
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voice recording for voice conversation mode
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set options for better audio quality for speech recognition
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Process the recorded audio with Assembly AI
        processRecordedAudio(audioBlob);
        
        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      setIsRecording(true);
      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setIsRecording(false);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "I couldn't access your microphone. Please make sure your browser has permission to use it and try again."
      };
      
      setChatHistory((prev) => [...prev, errorMessage]);
    }
  };
  
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecordedAudio = async (audioBlob: Blob) => {
    // Create a URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Add user voice message to chat with loading indicator
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: "Voice message (transcribing...)",
      audioUrl: audioUrl
    };
    
    setChatHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Show a processing message
      setChatHistory((prev) => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, content: "Voice message (processing with Assembly AI...)" } 
            : msg
        )
      );
      
      setProcessingStatus("Uploading audio to Assembly AI...");
      
      // Transcribe the audio using Assembly AI
      const transcript = await transcribeSpeech(audioBlob);
      
      setProcessingStatus("");
      
      // Update the user message with the transcription
      setChatHistory((prev) => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, content: `"${transcript}"` } 
            : msg
        )
      );
      
      // Add a temporary loading message while we get the response
      setChatHistory((prev) => [
        ...prev, 
        {
          id: 'temp-loading',
          role: 'assistant',
          content: 'Processing your question...'
        }
      ]);
      
      // Get response from the financial advice API
      const response = await getFinancialAdvice(transcript);
      
      // Remove the temporary message and add the AI response to chat
      setChatHistory((prev) => {
        const filtered = prev.filter(msg => msg.id !== 'temp-loading');
        return [
          ...filtered,
          {
            id: uuidv4(),
            role: "assistant",
            content: response
          }
        ];
      });
      
      // Speak the response
      if (isTTSEnabled) {
        speakText(response);
      }
    } catch (error) {
      console.error("Error processing voice message:", error);
      setProcessingStatus("");
      
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "I'm sorry, I couldn't process your voice message. The Assembly AI service might be temporarily unavailable. Please try again or type your question."
      };
      
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text-to-speech function
  const speakText = (text: string) => {
    synthesizeSpeech(text);
  };

  // Toggle STT mode
  const toggleSTT = async () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        await startSpeechRecognition(recognitionRef.current);
        console.log('Speech recognition started');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        
        // Add error message to chat
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: "I couldn't access your microphone. Please make sure your browser has permission to use it and try again."
        };
        
        setChatHistory((prev) => [...prev, errorMessage]);
      }
    }
  };

  // Toggle voice recording
  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Listen for Assembly AI status updates
  useEffect(() => {
    const handleAssemblyStatusUpdate = (event: CustomEvent) => {
      setProcessingStatus(event.detail.status);
    };

    // Add event listener
    window.addEventListener('assembly-status-update', handleAssemblyStatusUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('assembly-status-update', handleAssemblyStatusUpdate as EventListener);
    };
  }, []);

  // Handle scroll events in the chat container
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    
    const handleScroll = () => {
      if (!chatContainer) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShowScrollButton(!isNearBottom);
    };
    
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      
      return () => {
        chatContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message
    };
    
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    
    // User just sent a message, they probably want to see the response
    // Make sure scroll button shows if needed
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 100;
      if (!isScrolledToBottom) {
        setShowScrollButton(true);
      }
    }
    
    try {
      // Get response from the financial advice API
      const response = await getFinancialAdvice(message);
      
      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: response
      };
      
      setChatHistory((prev) => [...prev, assistantMessage]);
      
      // If text-to-speech is enabled, speak the response
      if (isTTSEnabled) {
        speakText(response);
      }
    } catch (error) {
      console.error("Error with chatbot:", error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to the financial advice service right now. Please try again later."
      };
      
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleQuestion = (question: string) => {
    setMessage(question);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    handleExampleQuestion
  }));

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="bg-blue-600 dark:bg-blue-800 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">Financial Advisor AI</h1>
        <div className="flex items-center mt-2">
          <p className="text-sm">Text-to-Speech:</p>
          <button
            onClick={() => setIsTTSEnabled(!isTTSEnabled)}
            className={`ml-2 px-3 py-1 rounded text-xs ${
              isTTSEnabled ? "bg-green-500 dark:bg-green-600" : "bg-gray-500 dark:bg-gray-600"
            }`}
          >
            {isTTSEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 relative min-h-0" ref={chatContainerRef}>
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className={`mb-4 flex ${
              chat.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3/4 rounded-lg p-3 ${
                chat.role === "user"
                  ? "bg-blue-500 text-white dark:bg-blue-600"
                  : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
              }`}
            >
              {chat.content}
              {chat.audioUrl && (
                <div className="mt-2">
                  <audio src={chat.audioUrl} controls className="w-full" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center items-center my-4">
            <div className="animate-pulse flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {processingStatus && (
        <div className="bg-yellow-100 border-t border-yellow-200 p-2 text-center text-sm text-gray-700 dark:bg-yellow-800/30 dark:border-yellow-700 dark:text-yellow-100">
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{processingStatus}</span>
          </div>
        </div>
      )}

      <div className="border-t border-gray-300 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="mb-3">
          <ToggleGroup 
            type="single" 
            defaultValue="text"
            value={inputMode}
            onValueChange={(value: string) => {
              if (value) setInputMode(value as InputMode);
            }}
            className="flex justify-center"
          >
            <ToggleGroupItem value="text" aria-label="Text input">
              <MessageSquare className="h-4 w-4 mr-1" />
              Text
            </ToggleGroupItem>
            <ToggleGroupItem value="voice" aria-label="Voice input">
              <Mic className="h-4 w-4 mr-1" />
              Voice
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {inputMode === "text" ? (
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              disabled={isLoading}
              className={`${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700" 
                  : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              } text-white p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-600`}
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatBot; 