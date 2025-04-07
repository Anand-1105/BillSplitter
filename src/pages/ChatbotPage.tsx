import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChatBot from '@/components/ChatBot';
import { Mic, Headphones, MessageSquare, Volume2, Database, LineChart } from 'lucide-react';

const ChatbotPage = () => {
  const chatBotRef = useRef<any>(null);

  const handleExampleClick = (question: string) => {
    if (chatBotRef.current && chatBotRef.current.handleExampleQuestion) {
      chatBotRef.current.handleExampleQuestion(question);
    }
  };

  // Example questions with categories
  const exampleQuestions = [
    {
      category: "Budgeting",
      question: "How can I start budgeting effectively?"
    },
    {
      category: "Debt",
      question: "What's the best way to pay off credit card debt?"
    },
    {
      category: "Retirement",
      question: "How much should I save for retirement?"
    },
    {
      category: "Housing",
      question: "Should I rent or buy a house?"
    },
    {
      category: "Credit",
      question: "How can I improve my credit score?"
    },
    {
      category: "Stocks",
      question: "What should I know before investing in stocks?"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight dark:text-gray-100">Financial Advisor</h1>
        <p className="text-muted-foreground dark:text-gray-400">Get personalized financial advice through text or voice conversation</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="h-[calc(100vh-240px)] flex flex-col">
            <ChatBot ref={chatBotRef} />
          </div>
        </div>
        
        <div className="space-y-6 max-h-[calc(100vh-240px)] overflow-y-auto">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Example Questions</CardTitle>
              <CardDescription className="dark:text-gray-400">Try asking these questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {exampleQuestions.map((item, index) => (
                <button 
                  key={index}
                  className="w-full text-left text-sm p-2 bg-muted dark:bg-gray-700 rounded-md hover:bg-muted/80 dark:hover:bg-gray-600 cursor-pointer transition-colors dark:text-gray-200"
                  onClick={() => handleExampleClick(item.question)}
                >
                  <span className="font-medium text-xs text-primary dark:text-blue-400">{item.category}:</span> {item.question}
                </button>
              ))}
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Input Modes</CardTitle>
              <CardDescription className="dark:text-gray-400">Different ways to communicate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200">Text Mode</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Type your financial questions</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 flex items-center justify-center">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200">Speech-to-Text (STT)</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Speak and convert to text automatically</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 flex items-center justify-center">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200">Voice Conversation</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Send voice recordings and hear responses</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 flex items-center justify-center">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200">Text-to-Speech</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Toggle to hear the AI's responses read aloud</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Advanced Features</CardTitle>
              <CardDescription className="dark:text-gray-400">Powered by financial APIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 flex items-center justify-center">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200">Financial Data APIs</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Access to real-time financial information and market data</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 flex items-center justify-center">
                    <LineChart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200">AI-Powered Advice</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Get advice from advanced models trained on financial best practices</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 px-3 py-2 bg-muted/50 dark:bg-gray-700/50 rounded-md">
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                  This advisor uses advanced language models to provide financial guidance based on expert sources and industry best practices.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">About This Advisor</CardTitle>
              <CardDescription className="dark:text-gray-400">How it helps with your finances</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm dark:text-gray-300">
                The Financial Advisor provides guidance on topics like budgeting, saving, investing, 
                debt management, and more based on financial best practices and expert recommendations.
              </p>
              <p className="text-sm mt-2 dark:text-gray-300">
                While the advice is based on established financial principles, remember to consult with a qualified financial 
                professional for advice specific to your individual situation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
