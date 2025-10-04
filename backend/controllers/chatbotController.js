import Groq from 'groq-sdk';
import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import { UserFavourite, LibraryList } from '../models/UserBooks.js';
import { v4 as uuidv4 } from 'uuid';

// Enterprise Configuration Constants
const AI_CONFIG = {
  GROQ: {
    MODEL: 'llama-3.3-70b-versatile', // Latest Groq model (active and powerful)
    MAX_TOKENS: 1024,
    TEMPERATURE: 0.7,
    TOP_P: 0.9,
    TIMEOUT: 30000
  },
  OPENAI: {
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 800,
    TEMPERATURE: 0.7,
    PRESENCE_PENALTY: 0.1,
    FREQUENCY_PENALTY: 0.1,
    TIMEOUT: 20000
  },
  CONTEXT: {
    MAX_BOOKS_PER_CATEGORY: 5,
    MAX_GENRES: 5,
    MAX_CONVERSATION_HISTORY: 10
  }
};

// Initialize AI clients with proper error handling - now lazy loaded
let aiClients = null;

const initializeAIClients = () => {
  if (aiClients) {
    return aiClients; // Return existing clients if already initialized
  }
  
  const clients = {};
  
  console.log('🔧 Initializing AI clients...');
  console.log('🔧 GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
  console.log('🔧 OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
  
  try {
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
      clients.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
        timeout: AI_CONFIG.GROQ.TIMEOUT
      });
      console.log('✅ Groq client initialized successfully');
    } else {
      console.log('⚠️  No valid Groq API key found (should start with gsk_)');
    }
  } catch (error) {
    console.warn('⚠️  Groq client initialization failed:', error.message);
  }

  try {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      clients.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: AI_CONFIG.OPENAI.TIMEOUT
      });
      console.log('✅ OpenAI client initialized successfully');
    } else {
      console.log('⚠️  No valid OpenAI API key found (should start with sk-)');
    }
  } catch (error) {
    console.warn('⚠️  OpenAI client initialization failed:', error.message);
  }

  aiClients = clients;
  return clients;
};

// Function to get AI clients, initializing if needed
const getAIClients = () => {
  if (!aiClients) {
    return initializeAIClients();
  }
  return aiClients;
};



/**
 * Enterprise-grade user context aggregation with performance optimization
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {Promise<Object>} Comprehensive user reading profile
 */
const getUserContext = async (userId) => {
  const startTime = Date.now();
  
  try {
    // Parallel database queries with lean() for performance
    const [user, favorites, library] = await Promise.all([
      User.findById(userId)
        .select('username preferences readingHistory createdAt')
        .lean(),
      UserFavourite.findOne({ userId })
        .select('books')
        .lean(),
      LibraryList.find({ userId })
        .select('listName books')
        .lean()
    ]);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Process favorite books with null safety
    const favoriteBooks = favorites?.books
      ?.slice(0, AI_CONFIG.CONTEXT.MAX_BOOKS_PER_CATEGORY)
      .map(book => ({
        title: book.title || 'Untitled',
        author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown Author'),
        genre: Array.isArray(book.categories) ? book.categories.join(', ') : (book.categories || 'General'),
        description: book.description?.substring(0, 200) || '',
        rating: book.averageRating || null
      })) || [];

    // Process library books with intelligent deduplication
    const processedLibraryBooks = library?.flatMap(list => 
      list.books?.slice(0, 3).map(book => ({
        title: book.title || 'Untitled',
        author: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || 'Unknown Author'),
        genre: Array.isArray(book.categories) ? book.categories.join(', ') : (book.categories || 'General'),
        listName: list.listName || 'Personal Library',
        addedDate: book.createdAt
      })) || []
    ) || [];

    // Advanced genre analysis with frequency weighting
    const genreFrequency = new Map();
    const allBooks = [...favoriteBooks, ...processedLibraryBooks];
    
    allBooks.forEach(book => {
      const genres = book.genre.split(',').map(g => g.trim().toLowerCase());
      genres.forEach(genre => {
        if (genre && genre !== 'unknown' && genre !== 'general') {
          genreFrequency.set(genre, (genreFrequency.get(genre) || 0) + 1);
        }
      });
    });

    // Sort genres by frequency and relevance
    const favoriteGenres = Array.from(genreFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, AI_CONFIG.CONTEXT.MAX_GENRES)
      .map(([genre]) => genre);

    // Calculate user reading profile metrics
    const userMetrics = {
      totalBooks: allBooks.length,
      favoriteCount: favoriteBooks.length,
      libraryCount: processedLibraryBooks.length,
      genreDiversity: genreFrequency.size,
      accountAge: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0
    };

    const processingTime = Date.now() - startTime;
    console.log(`📊 User context processed in ${processingTime}ms for user: ${user.username}`);

    return {
      userId,
      username: user.username || 'Reader',
      favoriteGenres,
      favoriteBooks: favoriteBooks.slice(0, AI_CONFIG.CONTEXT.MAX_BOOKS_PER_CATEGORY),
      libraryBooks: processedLibraryBooks.slice(0, AI_CONFIG.CONTEXT.MAX_BOOKS_PER_CATEGORY),
      preferences: user.preferences || {},
      metrics: userMetrics,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error getting user context:', {
      userId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return safe fallback context
    return {
      userId,
      username: 'Reader',
      favoriteGenres: [],
      favoriteBooks: [],
      libraryBooks: [],
      preferences: {},
      metrics: { totalBooks: 0, favoriteCount: 0, libraryCount: 0, genreDiversity: 0, accountAge: 0 },
      lastUpdated: new Date().toISOString(),
      error: 'Failed to load user preferences'
    };
  }
};

/**
 * Enterprise-grade dynamic system prompt generation with advanced personalization
 * @param {Object} userContext - User's reading profile and preferences
 * @returns {string} Optimized system prompt for AI model
 */
const generateSystemPrompt = (userContext) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Build contextual information blocks
  const userProfile = buildUserProfileContext(userContext);
  const readingHistory = buildReadingHistoryContext(userContext);
  const personalizationLevel = determinePersonalizationLevel(userContext);

  return `# BookVerse AI Assistant - Advanced Literary Companion

## IDENTITY & ROLE
You are BookVerse Assistant, an elite AI literary advisor with deep expertise in global literature, reading psychology, and personalized recommendation algorithms. You combine the knowledge of a master librarian with the enthusiasm of a passionate book lover.

## CURRENT CONTEXT
- Date: ${currentDate}
- Session Type: ${personalizationLevel} Personalization
${userProfile}

${readingHistory}

## CORE CAPABILITIES & EXPERTISE
1. **Personalized Recommendations**: Analyze reading patterns, preferences, and emotional needs
2. **Literary Analysis**: Discuss themes, writing styles, narrative techniques, and cultural context
3. **Genre Expertise**: Navigate across all literary genres with specialized knowledge
4. **Mood-Based Curation**: Match books to emotional states, life situations, and reading goals
5. **Discovery Engine**: Introduce users to new authors, hidden gems, and emerging voices
6. **Reading Guidance**: Provide tips for reading comprehension, book club discussions, and literary appreciation

## INTERACTION PRINCIPLES
- **Personalization First**: Always consider the user's unique reading profile and preferences
- **Quality Over Quantity**: Provide 2-4 carefully selected recommendations with compelling rationales
- **Conversational Flow**: Ask thoughtful follow-up questions to refine understanding
- **Educational Value**: Share interesting insights about books, authors, or literary movements
- **Emotional Intelligence**: Recognize and respond to the user's mood and reading motivations
- **Diversity & Inclusion**: Actively promote diverse voices and perspectives in literature

## RESPONSE FORMATTING
- Use engaging, conversational tone with strategic emoji usage (📚 🎯 ✨)
- Structure recommendations with title, author, and compelling 1-2 sentence rationale
- Include follow-up questions to deepen the conversation
- Maintain professional enthusiasm without overwhelming the user

## ETHICAL GUIDELINES
- Respect all literary preferences without judgment
- Promote reading as a positive, accessible activity
- Acknowledge limitations and suggest alternatives when uncertain
- Encourage exploration while respecting comfort zones
- Support literacy and reading accessibility initiatives

Your mission: Transform every interaction into an exciting opportunity for literary discovery and reading joy!`;
};

/**
 * Build comprehensive user profile context for AI prompt
 */
const buildUserProfileContext = (userContext) => {
  if (!userContext.username || userContext.username === 'Reader') {
    return '- User Profile: New reader exploring BookVerse platform';
  }

  const sections = [
    `- Reader: ${userContext.username}`,
    `- Reading Experience: ${userContext.metrics?.accountAge > 30 ? 'Experienced' : 'Developing'} reader`,
    `- Library Size: ${userContext.metrics?.totalBooks || 0} books`,
    `- Genre Diversity: ${userContext.metrics?.genreDiversity || 0} different categories explored`
  ];

  if (userContext.favoriteGenres?.length > 0) {
    sections.push(`- Preferred Genres: ${userContext.favoriteGenres.slice(0, 3).join(', ')}`);
  }

  return sections.join('\n');
};

/**
 * Build reading history context for enhanced personalization
 */
const buildReadingHistoryContext = (userContext) => {
  const sections = ['## READING HISTORY & PREFERENCES'];

  if (userContext.favoriteBooks?.length > 0) {
    sections.push('### Recently Favorited:');
    userContext.favoriteBooks.slice(0, 3).forEach(book => {
      sections.push(`- "${book.title}" by ${book.author}${book.rating ? ` (${book.rating}⭐)` : ''}`);
    });
  }

  if (userContext.libraryBooks?.length > 0) {
    sections.push('### Current Library Collections:');
    const libraryByList = userContext.libraryBooks.reduce((acc, book) => {
      if (!acc[book.listName]) acc[book.listName] = [];
      acc[book.listName].push(book);
      return acc;
    }, {});

    Object.entries(libraryByList).slice(0, 2).forEach(([listName, books]) => {
      sections.push(`- ${listName}: ${books.slice(0, 2).map(b => `"${b.title}"`).join(', ')}`);
    });
  }

  if (sections.length === 1) {
    sections.push('- Status: New reader ready to explore literary recommendations');
  }

  return sections.join('\n');
};

/**
 * Determine personalization level based on available user data
 */
const determinePersonalizationLevel = (userContext) => {
  const dataPoints = [
    userContext.favoriteBooks?.length || 0,
    userContext.libraryBooks?.length || 0,
    userContext.favoriteGenres?.length || 0,
    userContext.preferences ? Object.keys(userContext.preferences).length : 0
  ].reduce((a, b) => a + b, 0);

  if (dataPoints > 10) return 'Advanced';
  if (dataPoints > 5) return 'Moderate';
  if (dataPoints > 0) return 'Basic';
  return 'Discovery';
};

// Enhanced fallback responses with personalized recommendations
const getFallbackResponse = (userMessage, userContext) => {
  const message = userMessage.toLowerCase();
  const { username, favoriteGenres, favoriteBooks, metrics } = userContext;
  
  // Greeting responses
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('start')) {
    const greetings = [
      `Hello ${username}! 👋 Welcome to BookVerse! I'm excited to help you discover your next favorite book.`,
      `Hi ${username}! 📚 Ready to explore some amazing books together?`,
      `Hey there, ${username}! 🌟 What kind of literary adventure are you looking for today?`
    ];
    
    let personalizedGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    if (favoriteGenres.length > 0) {
      personalizedGreeting += ` I see you enjoy ${favoriteGenres.slice(0, 2).join(' and ')} - I have some exciting suggestions in those genres!`;
    }
    
    personalizedGreeting += `\n\n🔹 Ask me for book recommendations\n🔹 Tell me your mood or favorite genres\n🔹 Let's chat about books you've loved\n\nWhat sounds interesting to you?`;
    
    return personalizedGreeting;
  }
  
  // Specific book requests
  if (message.includes('recommend') || message.includes('suggestion') || message.includes('what should i read')) {
    let response = `📚 I'd love to recommend some books for you, ${username}!\n\n`;
    
    if (favoriteGenres.length > 0) {
      response += `Based on your love for ${favoriteGenres.slice(0, 2).join(' and ')}, here are some perfect picks:\n\n`;
      
      const genreRecommendations = {
        'fiction': '• "The Atlas Six" by Olivie Blake - Dark academic fantasy\n• "Klara and the Sun" by Kazuo Ishiguro - Touching AI story\n• "The Seven Husbands of Evelyn Hugo" by Taylor Jenkins Reid',
        'mystery': '• "The Thursday Murder Club" by Richard Osman - Cozy mystery\n• "The Silent Patient" by Alex Michaelides - Psychological thriller\n• "Gone Girl" by Gillian Flynn - Twisty domestic suspense',
        'romance': '• "Beach Read" by Emily Henry - Enemies-to-lovers perfection\n• "The Hating Game" by Sally Thorne - Office romance with banter\n• "Red, White & Royal Blue" by Casey McQuiston - Political romance',
        'fantasy': '• "The Name of the Wind" by Patrick Rothfuss - Epic fantasy\n• "The Invisible Life of Addie LaRue" by V.E. Schwab - Historical fantasy\n• "The House in the Cerulean Sea" by TJ Klune - Cozy fantasy',
        'sci-fi': '• "Project Hail Mary" by Andy Weir - Space adventure with humor\n• "The Martian" by Andy Weir - Survival story on Mars\n• "Becky Chambers Space Wayfarers series" - Hopeful sci-fi'
      };
      
      for (const genre of favoriteGenres.slice(0, 2)) {
        if (genreRecommendations[genre]) {
          response += genreRecommendations[genre] + '\n\n';
        }
      }
    } else {
      response += `Here are some universally loved recent favorites across different genres:\n\n`;
      response += `• "It Ends with Us" by Colleen Hoover - Emotional contemporary romance\n`;
      response += `• "The Thursday Murder Club" by Richard Osman - Cozy mystery with humor\n`;
      response += `• "Circe" by Madeline Miller - Beautiful Greek mythology retelling\n`;
      response += `• "The Midnight Library" by Matt Haig - Philosophical fiction about choices\n\n`;
    }
    
    response += `✨ Which of these catches your interest? Or tell me more about what you're in the mood for!`;
    return response;
  }
  
  // Genre-specific responses with personalized touch
  if (message.includes('fiction') || message.includes('novel')) {
    return `📚 Excellent choice, ${username}! Fiction offers endless possibilities. Here are some standout novels:\n\n• "Tomorrow, and Tomorrow, and Tomorrow" by Gabrielle Zevin - About friendship and video game design\n• "The Atlas Six" by Olivie Blake - Dark academia meets magic\n• "Book Lovers" by Emily Henry - A fresh take on romance tropes\n• "The Seven Moons of Maali Almeida" by Shehan Karunatilaka - Magical realism masterpiece\n\nWhat type of fiction mood are you in? Literary, contemporary, or something with a magical twist?`;
  }
  
  if (message.includes('mystery') || message.includes('thriller') || message.includes('suspense')) {
    return `🔍 Perfect choice, ${username}! Here are some absolutely gripping mysteries:\n\n• "The Maid" by Nita Prose - Hotel maid solves a murder mystery\n• "Rock Paper Scissors" by Alice Feeney - Psychological thriller with twists\n• "The Appeal" by Janice Hallett - Told entirely through documents and emails\n• "The Hunting Party" by Lucy Foley - Remote location, dark secrets\n\nDo you prefer psychological thrillers, cozy mysteries, or police procedurals?`;
  }
  
  if (message.includes('romance') || message.includes('love story')) {
    return `💕 Romance recommendations for ${username}!\n\n• "The Spanish Love Deception" by Elena Armas - Fake dating academia romance\n• "People We Meet on Vacation" by Emily Henry - Friends-to-lovers perfection\n• "The Kiss Quotient" by Helen Hoang - Neurodivergent representation\n• "The Wedding Date" by Jasmine Guillory - Fake relationship turns real\n\nAre you looking for contemporary, historical, or romance with fantasy elements?`;
  }
  
  if (message.includes('fantasy') || message.includes('magic')) {
    return `🧙‍♀️ Magical choices, ${username}! Here are some enchanting fantasy reads:\n\n• "The Priory of the Orange Tree" by Samantha Shannon - Epic standalone fantasy\n• "The Ten Thousand Doors of January" by Alix E. Harrow - Portal fantasy\n• "The Once and Future Witches" by Alix E. Harrow - Historical fantasy with witches\n• "The Goblin Emperor" by Katherine Addison - Court intrigue and kindness\n\nDo you prefer epic high fantasy, urban fantasy, or cozy magical realism?`;
  }
  
  if (message.includes('sci-fi') || message.includes('science fiction') || message.includes('space')) {
    return `🚀 Fantastic choice, ${username}! Here are some stellar sci-fi picks:\n\n• "Klara and the Sun" by Kazuo Ishiguro - Literary AI story\n• "The Time Traveler's Wife" by Audrey Niffenegger - Time travel romance\n• "Station Eleven" by Emily St. John Mandel - Post-apocalyptic hope\n• "The Left Hand of Darkness" by Ursula K. Le Guin - Classic exploring gender\n\nAre you interested in hard sci-fi, space opera, dystopian futures, or time travel?`;
  }
  
  if (message.includes('non-fiction') || message.includes('biography') || message.includes('memoir')) {
    return `📖 Great choice, ${username}! Here are some compelling non-fiction reads:\n\n• "Crying in H Mart" by Michelle Zauner - Moving memoir about food and grief\n• "The Midnight Library" by Matt Haig - Philosophy meets fiction\n• "Untamed" by Glennon Doyle - Inspiring memoir about authenticity\n• "The Body Keeps the Score" by Bessel van der Kolk - Groundbreaking trauma research\n\nAre you interested in memoirs, self-help, science, history, or current events?`;
  }
  
  // Mood-based recommendations
  if (message.includes('sad') || message.includes('emotional') || message.includes('cry')) {
    return `😢 Sometimes we need a good emotional read, ${username}. Here are some beautifully sad books:\n\n• "A Man Called Ove" by Fredrik Backman - Heartwarming despite the tears\n• "The Book Thief" by Markus Zusak - WWII story told by Death\n• "Me Before You" by Jojo Moyes - Love story that will break your heart\n• "The Kite Runner" by Khaled Hosseini - Friendship and redemption\n\nDo you want cathartic sadness or stories with hopeful endings?`;
  }
  
  if (message.includes('funny') || message.includes('humor') || message.includes('comedy') || message.includes('laugh')) {
    return `😂 Time for some laughs, ${username}! Here are some hilarious reads:\n\n• "The Hitchhiker's Guide to the Galaxy" by Douglas Adams - Absurd space comedy\n• "Good Omens" by Terry Pratchett & Neil Gaiman - Apocalyptic humor\n• "Bridget Jones's Diary" by Helen Fielding - British romantic comedy\n• "Yes Please" by Amy Poehler - Comedy memoir with heart\n\nDo you prefer witty British humor, satirical comedy, or laugh-out-loud funny memoirs?`;
  }
  
  if (message.includes('short') || message.includes('quick') || message.includes('easy')) {
    return `⚡ Looking for a quick read, ${username}? Here are some engaging shorter books:\n\n• "The Alchemist" by Paulo Coelho - Inspiring philosophical tale (163 pages)\n• "Of Mice and Men" by John Steinbeck - Classic American literature (112 pages)\n• "The Great Gatsby" by F. Scott Fitzgerald - Jazz Age masterpiece (180 pages)\n• "Coraline" by Neil Gaiman - Dark children's fantasy (162 pages)\n\nAny particular genre for your quick read?`;
  }
  
  // Author-based responses
  if (message.includes('author') || message.includes('writer')) {
    return `📝 Here are some must-read authors by genre, ${username}:\n\n📚 **Contemporary Fiction**: Taylor Jenkins Reid, Colleen Hoover, Sally Rooney, Hanya Yanagihara\n🔍 **Mystery/Thriller**: Tana French, Ruth Ware, Alex Michaelides, Gillian Flynn\n💕 **Romance**: Emily Henry, Christina Lauren, Julia Quinn, Jasmine Guillory\n🎭 **Fantasy**: Brandon Sanderson, N.K. Jemisin, Rebecca Yarros, Sarah J. Maas\n� **Sci-Fi**: Andy Weir, Becky Chambers, Martha Wells, Jeff VanderMeer\n\nWhich author or genre interests you most?`;
  }
  
  // Default comprehensive response
  return `📚 Hi ${username}! I'm here to help you find your next amazing read! Here are some ways I can assist:\n\n� **Tell me your mood**: "I want something uplifting" or "I need a good cry"\n🔹 **Share your interests**: "I love fantasy" or "I'm into mysteries"\n🔹 **Ask for specifics**: "What's a good beach read?" or "Any book club suggestions?"\n🔹 **Get personalized recs**: Based on your reading history\n\n${favoriteGenres.length > 0 ? `I see you enjoy ${favoriteGenres.slice(0, 2).join(' and ')} - I have tons of suggestions in those areas!` : 'I have recommendations across all genres!'}\n\nWhat kind of book adventure are you looking for today? ✨`;
};

/**
 * Enterprise-grade AI response generation with multi-provider failover
 * @param {Array} messages - Conversation history
 * @param {Object} userContext - User's personalized context
 * @returns {Promise<string>} AI-generated response
 */
const getChatResponse = async (messages, userContext) => {
  const startTime = Date.now();
  
  // Get AI clients (lazy loaded)
  const clients = getAIClients();
  
  const systemPrompt = generateSystemPrompt(userContext);
  
  // Prepare optimized message history
  const optimizedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-AI_CONFIG.CONTEXT.MAX_CONVERSATION_HISTORY)
  ];

  // Try Groq first (faster and more cost-effective)
  if (clients.groq) {
    try {
      console.log('🚀 Attempting Groq API call...');
      
      const completion = await clients.groq.chat.completions.create({
        model: AI_CONFIG.GROQ.MODEL,
        messages: optimizedMessages,
        max_tokens: AI_CONFIG.GROQ.MAX_TOKENS,
        temperature: AI_CONFIG.GROQ.TEMPERATURE,
        top_p: AI_CONFIG.GROQ.TOP_P,
        stream: false
      });

      const responseTime = Date.now() - startTime;
      console.log(`✅ Groq response generated in ${responseTime}ms`);

      const response = completion.choices[0]?.message?.content;
      if (response && response.trim()) {
        logSuccessfulInteraction('groq', userContext.userId, responseTime);
        return response.trim();
      }
      
      throw new Error('Empty response from Groq');
      
    } catch (groqError) {
      console.warn('⚠️  Groq API failed:', {
        error: groqError.message,
        status: groqError.status,
        timestamp: new Date().toISOString()
      });
      
      // Log the failure for monitoring
      logFailedInteraction('groq', groqError, userContext.userId);
    }
  }

  // Fallback to OpenAI if Groq fails
  if (clients.openai) {
    try {
      console.log('🔄 Falling back to OpenAI API...');
      
      const completion = await clients.openai.chat.completions.create({
        model: AI_CONFIG.OPENAI.MODEL,
        messages: optimizedMessages,
        max_tokens: AI_CONFIG.OPENAI.MAX_TOKENS,
        temperature: AI_CONFIG.OPENAI.TEMPERATURE,
        presence_penalty: AI_CONFIG.OPENAI.PRESENCE_PENALTY,
        frequency_penalty: AI_CONFIG.OPENAI.FREQUENCY_PENALTY
      });

      const responseTime = Date.now() - startTime;
      console.log(`✅ OpenAI response generated in ${responseTime}ms`);

      const response = completion.choices[0]?.message?.content;
      if (response && response.trim()) {
        logSuccessfulInteraction('openai', userContext.userId, responseTime);
        return response.trim();
      }
      
      throw new Error('Empty response from OpenAI');
      
    } catch (openaiError) {
      console.warn('⚠️  OpenAI API failed:', {
        error: openaiError.message,
        status: openaiError.status,
        timestamp: new Date().toISOString()
      });
      
      logFailedInteraction('openai', openaiError, userContext.userId);
    }
  }

  // Final fallback to intelligent local responses
  console.log('🤖 Using enhanced intelligent fallback system...');
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage && lastUserMessage.role === 'user') {
    const fallbackResponse = getFallbackResponse(lastUserMessage.content, userContext);
    logSuccessfulInteraction('fallback', userContext.userId, Date.now() - startTime);
    return fallbackResponse;
  }

  // Ultimate fallback
  return generateEmergencyResponse(userContext);
};

/**
 * Log successful AI interactions for monitoring and analytics
 */
const logSuccessfulInteraction = (provider, userId, responseTime) => {
  console.log(`📊 Successful ${provider.toUpperCase()} interaction:`, {
    userId,
    provider,
    responseTime,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log failed AI interactions for monitoring and debugging
 */
const logFailedInteraction = (provider, error, userId) => {
  console.error(`❌ Failed ${provider.toUpperCase()} interaction:`, {
    userId,
    provider,
    errorMessage: error.message,
    errorCode: error.status || error.code,
    timestamp: new Date().toISOString()
  });
};

/**
 * Generate emergency response when all AI providers fail
 */
const generateEmergencyResponse = (userContext) => {
  const responses = [
    `Hello ${userContext.username}! 📚 I'm experiencing some technical difficulties, but I'm still excited to help you discover amazing books!`,
    `Hi there! While I work through some technical issues, I'd love to help you find your next great read!`,
    `Welcome back to BookVerse! Even with some system hiccups, I'm here to assist with book recommendations!`
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return `${randomResponse}\n\nWhat kind of books are you in the mood for? I have plenty of great suggestions ready! ✨`;
};

/**
 * Generate personalized welcome message based on user context
 */
const generateWelcomeMessage = (userContext) => {
  const timeOfDay = getTimeOfDayGreeting();
  let message = `${timeOfDay} ${userContext.username}! 👋 I'm your BookVerse Assistant, and I'm absolutely thrilled to help you discover your next amazing read!`;

  // Personalize based on user's reading history
  if (userContext.metrics?.totalBooks > 10) {
    message += ` I can see you're quite the accomplished reader with ${userContext.metrics.totalBooks} books in your collection!`;
  } else if (userContext.metrics?.totalBooks > 0) {
    message += ` I notice you've been building a wonderful collection of books!`;
  }

  // Add genre-specific enthusiasm
  if (userContext.favoriteGenres?.length > 0) {
    const topGenres = userContext.favoriteGenres.slice(0, 2);
    message += ` Your taste for ${topGenres.join(' and ')} tells me you have excellent literary instincts.`;
  }

  // Add recent favorites context
  if (userContext.favoriteBooks?.length > 0) {
    const recentFave = userContext.favoriteBooks[0];
    message += ` I see "${recentFave.title}" caught your attention recently - great choice!`;
  }

  message += `\n\n✨ Whether you're looking for:\n📚 Your next page-turner\n🎯 Something for a specific mood\n🌟 Hidden literary gems\n💫 Authors similar to your favorites\n\nI'm here to make every recommendation perfect for you! What kind of reading adventure are you ready for today?`;

  return message;
};

/**
 * Get appropriate greeting based on time of day
 */
const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Hello';
};

// Create new conversation
export const createConversation = async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to use the AI assistant.',
        code: 'AUTH_REQUIRED'
      });
    }

    const userId = req.user.userId;
    const sessionId = uuidv4();
    
    console.log(`🚀 Creating new conversation for user: ${req.user.username || userId}`);
    
    // Get user context with enhanced error handling
    const userContext = await getUserContext(userId);
    
    // Generate personalized welcome message
    const welcomeMessage = generateWelcomeMessage(userContext);

    const conversation = new Conversation({
      userId,
      sessionId,
      status: 'active',
      messages: [{
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        metadata: { 
          userContext: {
            userId: userContext.userId,
            username: userContext.username,
            genreCount: userContext.favoriteGenres?.length || 0,
            bookCount: userContext.metrics?.totalBooks || 0
          },
          sessionStart: true,
          version: '2.0'
        }
      }]
    });

    await conversation.save();

    console.log(`✅ Conversation created successfully:`, {
      sessionId,
      userId,
      username: userContext.username
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        message: conversation.messages[0],
        userContext: {
          username: userContext.username,
          genrePreferences: userContext.favoriteGenres?.slice(0, 3) || []
        }
      }
    });
  } catch (error) {
    console.error('❌ Create conversation error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });
    
    // Determine appropriate error status
    const status = error.message.includes('User not found') ? 404 : 500;
    
    res.status(status).json({
      success: false,
      message: status === 404 ? 'User profile not found. Please ensure your account is properly set up.' : 'Failed to create conversation. Please try again.',
      code: status === 404 ? 'USER_NOT_FOUND' : 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Enterprise-grade message sending with comprehensive error handling and performance monitoring
 */
export const sendMessage = async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
        code: 'AUTH_REQUIRED',
        requestId
      });
    }

    const { sessionId, message } = req.body;
    const userId = req.user.userId;

    // Input validation with detailed error messages
    const validationResult = validateMessageInput(sessionId, message);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.error,
        code: 'INVALID_INPUT',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📨 Processing message request:`, {
      requestId,
      userId,
      username: req.user.username,
      sessionId,
      messageLength: message.trim().length,
      timestamp: new Date().toISOString()
    });

    // Find conversation with error handling
    const conversation = await findActiveConversation(userId, sessionId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or expired. Please start a new conversation.',
        code: 'CONVERSATION_NOT_FOUND',
        requestId,
        suggestion: 'Click "New Chat" to start a fresh conversation.'
      });
    }

    // Add user message with metadata
    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
      metadata: {
        requestId,
        messageLength: message.trim().length,
        userAgent: req.headers['user-agent'] || 'Unknown'
      }
    };
    
    conversation.messages.push(userMessage);

    // Get enhanced user context
    const userContext = await getUserContext(userId);
    
    // Prepare optimized message history
    const recentMessages = conversation.messages
      .slice(-AI_CONFIG.CONTEXT.MAX_CONVERSATION_HISTORY)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Generate AI response with performance tracking
    const aiResponseStartTime = Date.now();
    const aiResponse = await getChatResponse(recentMessages, userContext);
    const aiResponseTime = Date.now() - aiResponseStartTime;

    // Add AI response with comprehensive metadata
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      metadata: {
        requestId,
        userContext: {
          userId: userContext.userId,
          username: userContext.username,
          genreCount: userContext.favoriteGenres?.length || 0,
          bookCount: userContext.metrics?.totalBooks || 0
        },
        performance: {
          aiResponseTime,
          totalRequestTime: Date.now() - startTime
        },
        version: '2.0'
      }
    };
    
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date();

    // Save conversation with error handling
    await saveConversationSafely(conversation);

    // Prepare response data
    const totalRequestTime = Date.now() - startTime;
    
    console.log(`✅ Message processed successfully:`, {
      requestId,
      userId,
      username: req.user.username,
      sessionId,
      totalTime: totalRequestTime,
      aiResponseTime,
      messageCount: conversation.messages.length
    });

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        conversationLength: conversation.messages.length,
        performance: {
          totalRequestTime,
          aiResponseTime
        }
      },
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const totalRequestTime = Date.now() - startTime;
    
    console.error(`❌ Send message error:`, {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.userId,
      username: req.user?.username,
      totalTime: totalRequestTime,
      timestamp: new Date().toISOString()
    });

    // Determine appropriate error response
    const errorResponse = determineErrorResponse(error);
    
    res.status(errorResponse.status).json({
      success: false,
      message: errorResponse.message,
      code: errorResponse.code,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId,
      timestamp: new Date().toISOString(),
      suggestion: errorResponse.suggestion
    });
  }
};

/**
 * Validate message input with comprehensive checks
 */
const validateMessageInput = (sessionId, message) => {
  if (!sessionId || typeof sessionId !== 'string') {
    return { isValid: false, error: 'Valid session ID is required' };
  }
  
  if (!message || typeof message !== 'string' || !message.trim()) {
    return { isValid: false, error: 'Message content cannot be empty' };
  }
  
  if (message.trim().length > 2000) {
    return { isValid: false, error: 'Message too long. Please keep messages under 2000 characters.' };
  }
  
  if (message.trim().length < 1) {
    return { isValid: false, error: 'Message too short. Please enter at least one character.' };
  }
  
  return { isValid: true };
};

/**
 * Find active conversation with enhanced error handling
 */
const findActiveConversation = async (userId, sessionId) => {
  try {
    const conversation = await Conversation.findOne({ 
      userId, 
      sessionId, 
      status: 'active' 
    });
    
    // Check if conversation is too old (older than 24 hours)
    if (conversation && conversation.updatedAt) {
      const conversationAge = Date.now() - new Date(conversation.updatedAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (conversationAge > maxAge) {
        console.log(`⏰ Conversation ${sessionId} is older than 24 hours, suggesting new session`);
        return null;
      }
    }
    
    return conversation;
  } catch (error) {
    console.error('Error finding conversation:', error);
    throw new Error('Database error while retrieving conversation');
  }
};

/**
 * Save conversation with retry logic
 */
const saveConversationSafely = async (conversation, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await conversation.save();
      return;
    } catch (error) {
      console.warn(`⚠️  Save attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw new Error('Failed to save conversation after multiple attempts');
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
};

/**
 * Determine appropriate error response based on error type
 */
const determineErrorResponse = (error) => {
  if (error.message.includes('User not found')) {
    return {
      status: 404,
      message: 'User profile not found. Please ensure your account is properly set up.',
      code: 'USER_NOT_FOUND',
      suggestion: 'Try logging out and logging back in, or contact support.'
    };
  }
  
  if (error.message.includes('Database error') || error.message.includes('connection')) {
    return {
      status: 503,
      message: 'Service temporarily unavailable. Please try again in a moment.',
      code: 'SERVICE_UNAVAILABLE',
      suggestion: 'Wait a few seconds and try sending your message again.'
    };
  }
  
  if (error.message.includes('API') || error.message.includes('timeout')) {
    return {
      status: 502,
      message: 'AI service temporarily unavailable. Please try again.',
      code: 'AI_SERVICE_ERROR',
      suggestion: 'Our AI assistant is experiencing issues. Please try again in a moment.'
    };
  }
  
  if (error.message.includes('timeout')) {
    return {
      status: 408,
      message: 'Request timeout. Please try again with a shorter message.',
      code: 'REQUEST_TIMEOUT',
      suggestion: 'Try sending a shorter message or check your internet connection.'
    };
  }
  
  // Default server error
  return {
    status: 500,
    message: 'An unexpected error occurred. Please try again.',
    code: 'SERVER_ERROR',
    suggestion: 'If the problem persists, please contact support.'
  };
};

// Get conversation history
export const getConversation = async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access your conversations.',
        code: 'AUTH_REQUIRED'
      });
    }

    const { sessionId } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findOne({ 
      userId, 
      sessionId, 
      status: 'active' 
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or expired.',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    console.log(`📖 Loading conversation: ${sessionId} for user: ${req.user.username || userId}`);

    res.json({
      success: true,
      data: {
        sessionId: conversation.sessionId,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messages.length
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation',
      error: error.message
    });
  }
};

// Get user's conversation list
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const conversations = await Conversation.find({ 
      userId, 
      status: 'active' 
    })
    .select('sessionId messages createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(limit * page)
    .skip((page - 1) * limit);

    // Get preview of each conversation
    const conversationPreviews = conversations.map(conv => ({
      sessionId: conv.sessionId,
      preview: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content.substring(0, 100) + '...' : '',
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

    res.json({
      success: true,
      data: conversationPreviews,
      pagination: {
        page,
        limit,
        total: conversations.length
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      error: error.message
    });
  }
};

// Archive conversation
export const archiveConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findOneAndUpdate(
      { userId, sessionId },
      { status: 'archived' },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation archived successfully'
    });

  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive conversation',
      error: error.message
    });
  }
};

// Get book recommendations from conversation context
export const getBookRecommendations = async (req, res) => {
  try {
    const { query, genre, mood } = req.query;
    const userId = req.user.userId;

    const userContext = await getUserContext(userId);
    
    let prompt = `Based on the user's preferences, recommend 5 books. User context: ${JSON.stringify(userContext)}`;
    
    if (query) prompt += ` Query: "${query}"`;
    if (genre) prompt += ` Genre: ${genre}`;
    if (mood) prompt += ` Mood/Occasion: ${mood}`;
    
    prompt += `. Provide recommendations in JSON format: [{"title": "", "author": "", "genre": "", "reason": ""}]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7
    });

    let recommendations;
    try {
      recommendations = JSON.parse(completion.choices[0].message.content);
    } catch {
      // Fallback if JSON parsing fails
      recommendations = [{
        title: "The Seven Husbands of Evelyn Hugo",
        author: "Taylor Jenkins Reid",
        genre: "Contemporary Fiction",
        reason: "A captivating story with complex characters"
      }];
    }

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Book recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get book recommendations',
      error: error.message
    });
  }
};