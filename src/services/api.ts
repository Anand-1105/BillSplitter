import dotenv from 'dotenv';
dotenv.config();

// API service for external services

// For demonstration purposes, we'd typically use environment variables for API keys
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || ""; // Replace with your actual Finnhub API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""; // Replace with your actual OpenAI API key
const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY || ""; // Assembly AI API key

// Financial data API (Finnhub)
export const getStockQuote = async (symbol: string) => {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching stock quote:", error);
    throw error;
  }
};

export const getCompanyProfile = async (symbol: string) => {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching company profile:", error);
    throw error;
  }
};

// OpenAI API for generating responses
export const generateAIResponse = async (prompt: string) => {
  try {
    // In a production environment, you would call the OpenAI API
    // This would be the code to call OpenAI API:
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor providing concise, expert advice on personal finance topics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
    */
    
    // Handle empty or undefined prompts
    if (!prompt || !prompt.trim()) {
      return "Is there something specific about personal finance you'd like to know?";
    }
    
    const prompt_lower = prompt.toLowerCase().trim();
    
    // Handle personal data requests - these would connect to real APIs in a production app
    if (prompt_lower.includes("my transactions") || 
        prompt_lower.includes("my recent transactions") ||
        prompt_lower.includes("my spending") ||
        prompt_lower.includes("what did i spend") ||
        prompt_lower.includes("transaction history")) {
      return "I don't have access to your personal transaction data in this demo. In a real financial advisor app, I would connect to your bank accounts securely and show your recent transactions here. Would you like advice on how to track your transactions effectively?";
    }
    
    if (prompt_lower.includes("my balance") || 
        prompt_lower.includes("my account balance") ||
        prompt_lower.includes("how much money") ||
        prompt_lower.includes("my savings")) {
      return "I don't have access to your account balances in this demo version. In a full implementation, I would securely connect to your financial institutions to provide real-time balance information. Would you like some advice on managing account balances instead?";
    }
    
    if (prompt_lower.includes("my budget") || 
        prompt_lower.includes("my spending plan") ||
        prompt_lower.includes("my financial plan")) {
      return "I don't have access to your personal budget information in this demo. In a complete app, I would display your budget categories and spending patterns. Would you like advice on creating an effective budget?";
    }
    
    if (prompt_lower.includes("my investments") || 
        prompt_lower.includes("my portfolio") ||
        prompt_lower.includes("my stocks") ||
        prompt_lower.includes("my 401k")) {
      return "I don't have access to your investment portfolio in this demo. In a full version, I would show your current investments, performance, and allocation. Would you like general advice about investment strategies instead?";
    }
    
    // Handle greetings and conversational inputs first
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy", "sup", "what's up", "greetings"];
    if (greetings.some(greeting => prompt_lower === greeting || prompt_lower.startsWith(greeting + " "))) {
      return "Hello! I'm your financial advisor bot. How can I help with your financial questions today?";
    }
    
    // Handle thank you messages
    if (prompt_lower.includes("thank") || prompt_lower.includes("thanks") || prompt_lower === "ty") {
      return "You're welcome! Is there anything else I can help you with regarding your finances?";
    }
    
    // Handle how are you type questions
    if (prompt_lower.includes("how are you") || prompt_lower === "how r u" || prompt_lower === "how r you") {
      return "I'm functioning well, thank you! I'm here to help with your financial questions. What would you like to know?";
    }
    
    // Handle goodbye messages
    if (prompt_lower.includes("bye") || prompt_lower.includes("goodbye") || prompt_lower === "see ya" || prompt_lower === "cya") {
      return "Goodbye! Feel free to return if you have more financial questions in the future.";
    }
    
    // Enhanced mock implementation with more specific topics and better matching
    const financialTopics = {
      budget: [
        "Based on best practices in personal finance, I recommend using the 50/30/20 rule for budgeting: 50% for needs, 30% for wants, and 20% for savings and debt repayment.",
        "Financial experts suggest zero-based budgeting, where you assign every dollar a purpose at the beginning of the month.",
        "According to financial advisors, automating your savings with scheduled transfers to a separate account on payday is one of the most effective ways to build savings."
      ],
      debt: [
        "Financial analysts generally recommend the debt avalanche method—paying off high-interest debt first while making minimum payments on other debts.",
        "According to research, the debt snowball method (paying off smallest debts first) can provide psychological wins that keep you motivated.",
        "Many financial institutions offer options to consolidate high-interest debts into a lower-interest loan or 0% APR balance transfer credit card, which could save you significant money on interest."
      ],
      stocks: [
        "When investing in stocks, financial experts recommend starting with low-cost index funds that track the broader market, like S&P 500 index funds.",
        "Stocks historically have returned around 10% annually before inflation, though past performance doesn't guarantee future results.",
        "For stock investing, consider dollar-cost averaging—investing a fixed amount regularly regardless of market conditions—to reduce timing risk."
      ],
      investing: [
        "Investment professionals emphasize that starting retirement investments early is crucial due to the power of compound interest.",
        "According to Vanguard research, low-cost index funds typically outperform actively managed funds over the long term due to lower fees.",
        "Financial planners generally recommend investing 15-20% of your income for retirement through tax-advantaged accounts like 401(k)s and IRAs."
      ],
      retirement: [
        "For retirement planning, most financial advisors recommend saving at least 15% of your pre-tax income annually.",
        "The 4% rule suggests that retirees can withdraw 4% of their retirement savings in the first year, then adjust for inflation each year, with a high probability of not running out of money for at least 30 years.",
        "When planning for retirement, consider tax-advantaged accounts in this priority: first max out employer 401(k) match, then max out HSA if eligible, then max out IRA or Roth IRA, then contribute more to 401(k)."
      ],
      lowcostfunds: [
        "Low-cost index funds typically have expense ratios below 0.2%, compared to 1-2% for actively managed funds, which can save you tens of thousands of dollars over your investing lifetime.",
        "Low-cost funds refer to investment vehicles with minimal expense ratios that track market indices rather than trying to beat the market through active management.",
        "Low-cost index funds provide broad diversification by investing in hundreds or thousands of companies through a single fund, reducing the risk associated with individual stocks."
      ],
      housing: [
        "According to housing affordability guidelines, you should aim to spend no more than 28% of your gross monthly income on housing costs.",
        "Mortgage experts recommend a 20% down payment when buying a home to avoid private mortgage insurance (PMI) and secure better interest rates.",
        "Financial analysts suggest that refinancing can be beneficial when interest rates drop at least 1% lower than your current rate."
      ],
      credit: [
        "To improve your credit score, focus on paying bills on time (35% of your score), keeping credit utilization below 30% (30% of your score), and maintaining a long credit history (15% of your score).",
        "Credit bureaus recommend checking your credit report annually for errors, as studies show that 1 in 4 reports contain errors that could affect your score.",
        "Building good credit involves making on-time payments, keeping old accounts open to establish credit history, and limiting applications for new credit to avoid hard inquiries."
      ],
      wheretoinvest: [
        "For most investors, brokerages like Vanguard, Fidelity, or Charles Schwab offer excellent low-cost investment options with minimal fees.",
        "When deciding where to invest, prioritize tax-advantaged accounts like 401(k)s, IRAs, HSAs, and 529 plans before using taxable brokerage accounts.",
        "Investment advisors recommend online brokerages with low trading fees, no account minimums, and access to low-cost index funds and ETFs for beginning investors."
      ],
      multiplestreams: [
        "Research shows that building multiple streams of income is one of the most effective strategies for achieving financial independence.",
        "Financial experts suggest developing at least 3-7 income streams across different categories: active income (job), portfolio income (investments), passive income (real estate, businesses), and royalty income (content creation).",
        "Creating multiple income streams provides financial resilience by ensuring that if one source decreases or disappears, you have others to rely on."
      ]
    };
    
    // Define pattern matches for each category - order matters for specificity
    const patterns = [
      { category: "lowcostfunds", keywords: ["low cost fund", "low-cost fund", "index fund fee", "expense ratio", "low fee"] },
      { category: "wheretoinvest", keywords: ["where to invest", "where should i invest", "best place to invest", "investment platform", "brokerage"] },
      { category: "stocks", keywords: ["stock", "equity", "shares", "market", "trading"] },
      { category: "multiplestreams", keywords: ["multiple stream", "different income", "side hustle", "passive income"] },
      { category: "retirement", keywords: ["retire", "401k", "ira", "pension", "social security"] },
      { category: "credit", keywords: ["credit score", "fico", "credit card", "credit report", "credit history", "improve credit"] },
      { category: "budget", keywords: ["budget", "save", "saving", "expense", "spending", "track money"] },
      { category: "debt", keywords: ["debt", "loan", "mortgage", "credit card", "interest rate", "pay off"] },
      { category: "investing", keywords: ["invest", "return", "portfolio", "asset", "fund", "etf", "roth"] },
      { category: "housing", keywords: ["house", "apartment", "rent", "mortgage", "property", "real estate", "buy home"] }
    ];
    
    // Check for exact question matches first - most specific answers
    if (prompt_lower.includes("what do you mean by low cost funds") || 
        prompt_lower.includes("what are low cost funds") ||
        prompt_lower.includes("low cost funds")) {
      return "Low-cost funds refer to investment vehicles with minimal expense ratios (typically below 0.2%) that track market indices rather than trying to beat the market through active management. They save investors money by charging less in fees, allowing more of your money to remain invested and grow over time.";
    }
    
    if (prompt_lower.includes("where do i invest") || 
        prompt_lower.includes("where should i invest") ||
        prompt_lower.includes("where to invest")) {
      return "For most investors, brokerages like Vanguard, Fidelity, or Charles Schwab offer excellent low-cost investment options with minimal fees. When deciding where to invest, prioritize tax-advantaged accounts like 401(k)s, IRAs, and HSAs before using taxable brokerage accounts. Look for platforms that offer commission-free trading and access to low-cost index funds.";
    }
    
    if (prompt_lower.includes("teach me about stocks") || 
        prompt_lower.includes("learn about stocks") ||
        prompt_lower === "stocks" ||
        prompt_lower.includes("stock investing") ||
        prompt_lower.includes("can you teach me about stocks")) {
      return "Stocks represent ownership in a company. When investing in stocks, financial experts recommend starting with broad-based, low-cost index funds that track the entire market before picking individual stocks. This provides instant diversification. Consider dollar-cost averaging—investing a fixed amount regularly—to reduce timing risk, and focus on long-term growth rather than short-term market movements.";
    }
    
    // Match patterns for each topic
    let matchedCategory = "general";
    
    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => prompt_lower.includes(keyword))) {
        matchedCategory = pattern.category;
        break;
      }
    }
    
    // Get responses for the matched category
    const responses = financialTopics[matchedCategory as keyof typeof financialTopics] || [
      "According to financial advisors, reviewing your subscriptions regularly and canceling unused services can save the average household over $500 annually.",
      "Research shows that building multiple streams of income is one of the most effective strategies for achieving financial independence.",
      "Financial experts recommend maintaining an emergency fund of 3-6 months of living expenses in a high-yield savings account for financial security."
    ];
    
    // Return a response from the category
    return responses[Math.floor(Math.random() * responses.length)];
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw error;
  }
};

// Speech-to-text API using Assembly AI
export const transcribeSpeech = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log("Starting transcription with Assembly AI...");
    
    // Setup status update function using custom events
    const updateStatus = (status: string) => {
      const event = new CustomEvent('assembly-status-update', { 
        detail: { status } 
      });
      window.dispatchEvent(event);
    };
    
    updateStatus("Preparing audio for upload...");
    
    // Convert Blob to File (necessary for FormData)
    const audioFile = new File([audioBlob], "recording.webm", { 
      type: audioBlob.type 
    });
    
    // Create form data to upload the audio file
    const formData = new FormData();
    formData.append("audio", audioFile);
    
    updateStatus("Uploading audio to Assembly AI...");
    
    // Upload the audio file to Assembly AI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLY_API_KEY
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Assembly AI upload failed: ${uploadResponse.statusText}`);
    }
    
    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;
    
    console.log("Audio successfully uploaded, creating transcription...");
    updateStatus("Starting transcription process...");
    
    // Submit the transcription request
    const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'en'
      })
    });
    
    if (!transcriptionResponse.ok) {
      throw new Error(`Assembly AI transcription request failed: ${transcriptionResponse.statusText}`);
    }
    
    const transcriptionData = await transcriptionResponse.json();
    const transcriptId = transcriptionData.id;
    
    console.log("Transcription job created, polling for results...");
    updateStatus("Processing audio, please wait...");
    
    // Poll for the transcription result
    let result = null;
    let attempts = 0;
    const maxAttempts = 60; // Poll for a maximum of 60 seconds
    
    while (!result && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      if (attempts % 5 === 0) {
        updateStatus(`Still processing audio... (${attempts} seconds)`);
      }
      
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        method: 'GET',
        headers: {
          'Authorization': ASSEMBLY_API_KEY
        }
      });
      
      if (!pollingResponse.ok) {
        throw new Error(`Assembly AI polling failed: ${pollingResponse.statusText}`);
      }
      
      const pollingData = await pollingResponse.json();
      
      if (pollingData.status === 'completed') {
        result = pollingData.text;
        console.log("Transcription completed successfully");
        updateStatus("Transcription complete!");
        break;
      } else if (pollingData.status === 'error') {
        throw new Error(`Assembly AI transcription error: ${pollingData.error}`);
      }
      
      attempts++;
    }
    
    if (!result) {
      throw new Error('Transcription timed out');
    }
    
    // Clear status before returning
    updateStatus("");
    return result;
  } catch (error) {
    console.error("Error in transcribeSpeech:", error);
    
    // Update status on error
    try {
      const event = new CustomEvent('assembly-status-update', { 
        detail: { status: "Transcription failed, using fallback..." } 
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error("Failed to dispatch status event:", e);
    }
    
    // Fallback options for when transcription fails
    const fallbackResponses = [
      "How can I improve my credit score?",
      "What's the best way to invest for retirement?",
      "Should I pay off debt or invest first?",
      "How do I create a budget?",
      "What are the tax benefits of a 401k?"
    ];
    
    // Return a random fallback response
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
};

// Text-to-speech API using Web Speech API
export const synthesizeSpeech = (text: string): void => {
  // We're using the browser's built-in Web Speech API
  // In most contexts, this is sufficient for text-to-speech
  
  // But if you want more control, you could use a service like Google Text-to-Speech API
  // This would be the code to call Google TTS API:
  /*
  // Typically this would be a server-side call due to API keys
  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer YOUR_GOOGLE_API_KEY`
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
      audioConfig: { audioEncoding: 'MP3' }
    })
  });
  
  const data = await response.json();
  // Convert base64 to audio and play
  const audioContent = data.audioContent;
  const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
  audio.play();
  */
  
  // Use the Web Speech API's SpeechSynthesis interface
  if (!('speechSynthesis' in window)) {
    console.warn("Text-to-speech not supported in this browser");
    return;
  }
  
  // Stop any current speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Use a neutral voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.name.includes('Daniel') || 
    voice.name.includes('Google') || 
    voice.name.includes('English')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  window.speechSynthesis.speak(utterance);
};

// Financial advice API (simulated)
export const getFinancialAdvice = async (query: string): Promise<string> => {
  // In a real scenario, this would call a financial advice API or use OpenAI
  // For now, we'll use our AI response generator
  return generateAIResponse(query);
}; 