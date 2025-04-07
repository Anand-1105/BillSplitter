
import { Transaction } from "@/contexts/TransactionContext";
import { toast } from "sonner";

type ChatbotMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatHistoryItem = ChatbotMessage & {
  id: string;
};

// Function to create a prompt from user input and transaction data
export const createChatbotPrompt = (
  userMessage: string,
  transactions: Transaction[],
  userName: string
): ChatbotMessage[] => {
  // Create system prompt
  const systemPrompt: ChatbotMessage = {
    role: "system",
    content: `You are a helpful financial assistant for a Splitwise-like expense sharing app. You can help ${userName} understand their transactions, provide insights, and answer questions about their shared expenses. 
    
    You have access to the following transaction data:
    ${JSON.stringify(transactions, null, 2)}
    
    When responding:
    1. Be concise and friendly
    2. If asked about specific transactions, provide accurate data from the transaction history
    3. If asked for financial tips or suggestions, provide relevant advice
    4. If asked something you don't know or is not in the transaction data, be honest about your limitations
    5. Never make up transactions that don't exist in the data
    6. Format currency values consistently
    7. Keep responses under 250 words when possible`
  };

  // Return the messages array
  return [
    systemPrompt,
    { role: "user", content: userMessage }
  ];
};

// Function to query the OpenAI API
export const queryChatbot = async (
  messages: ChatbotMessage[]
): Promise<string> => {
  try {
    // In a real implementation, this would call the OpenAI API
    // For this demo, we'll simulate a response based on common financial questions
    
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    
    if (userMessage.includes("recent transaction") || userMessage.includes("last transaction")) {
      return "Your most recent transaction was 'Dinner at Italian Restaurant' for $45.00 on April 2nd, 2025. You split this with Alex and Maria.";
    }
    
    if (userMessage.includes("how much") && userMessage.includes("owe")) {
      return "Based on your current transactions, you owe a total of $125.50 to various friends. The largest amount is $75.00 that you owe to Michael for the concert tickets.";
    }
    
    if (userMessage.includes("budget") || userMessage.includes("saving")) {
      return "Looking at your spending patterns, I notice you spend about 35% on food, 25% on entertainment, and 15% on transportation. To improve your savings, you might want to consider reducing restaurant expenses which make up about 20% of your total spending.";
    }
    
    if (userMessage.includes("help") || userMessage.includes("how do i")) {
      return "I can help you with: checking your balances, reviewing recent transactions, analyzing spending patterns, or providing financial tips. Just ask me something specific about your transactions or expenses!";
    }
    
    return "I'm your financial assistant for this expense sharing app. I can help you track expenses, analyze your spending, and manage shared costs with friends. What would you like to know about your transactions?";
    
  } catch (error) {
    console.error("Chatbot query error:", error);
    toast.error("Failed to get a response from the assistant");
    return "I'm having trouble processing your request right now. Please try again later.";
  }
};
