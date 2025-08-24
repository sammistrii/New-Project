// Simple MindMate Script - Immediate Working Version

// Quiz Data
const QUIZ_QUESTIONS = [
    {
        key: 'subjects',
        question: 'Which subjects interest you the most?',
        options: [
            'Mathematics and Science',
            'Languages and Literature',
            'Arts and Design',
            'Business and Economics',
            'Technology and Computers',
            'Social Sciences and History'
        ]
    },
    {
        key: 'activities',
        question: 'What activities do you enjoy doing?',
        options: [
            'Solving complex problems',
            'Creating and designing',
            'Helping and teaching others',
            'Leading and organizing',
            'Researching and analyzing',
            'Building and fixing things'
        ]
    },
    {
        key: 'environment',
        question: 'What work environment do you prefer?',
        options: [
            'Office with team collaboration',
            'Creative studio or workshop',
            'Remote or flexible work',
            'Outdoor or field work',
            'Laboratory or research facility',
            'Client-facing or customer service'
        ]
    },
    {
        key: 'careerTrack',
        question: 'Which career track appeals to you most?',
        options: [
            'Engineering and Technology',
            'Healthcare and Medicine',
            'Business and Management',
            'Arts and Creative Industries',
            'Education and Training',
            'Research and Development'
        ]
    }
];

// Global Variables
let currentQuestionIndex = 0;
let quizAnswers = {};

// Navigation Functions
function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    
    // Hide all sections including features
    document.querySelectorAll('section[id]').forEach(section => {
        section.classList.remove('active');
    });
    
    // Explicitly hide features section first
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.classList.remove('active');
        console.log('Features section explicitly hidden');
    }
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Special handling for hero section - show features too
    if (sectionName === 'hero') {
        console.log('Showing features section for hero');
        if (featuresSection) {
            featuresSection.classList.add('active');
            console.log('Features section shown for hero');
        }
    }
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Quiz Functions
function startQuiz() {
    showSection('quiz-section');
    currentQuestionIndex = 0;
    quizAnswers = {};
    displayQuestion();
}

function displayQuestion() {
    const question = QUIZ_QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100;
    
    // Update progress display
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('progress-fill').style.width = progress + '%';
    
    const quizContent = document.getElementById('quiz-content');
    quizContent.innerHTML = `
        <div class="quiz-question">
            <h3>${question.question}</h3>
            <div class="quiz-options">
                ${question.options.map((option, index) => `
                    <div class="quiz-option ${quizAnswers[question.key] === option ? 'selected' : ''}" 
                         onclick="selectOption('${question.key}', '${option}')">
                        ${option}
                    </div>
                `).join('')}
            </div>
            <div class="quiz-navigation">
                ${currentQuestionIndex > 0 ? '<button onclick="previousQuestion()" class="btn btn-secondary">Previous</button>' : ''}
                <button onclick="nextQuestion()" class="btn btn-primary">
                    ${currentQuestionIndex === QUIZ_QUESTIONS.length - 1 ? 'Complete Quiz' : 'Next'}
                </button>
            </div>
        </div>
    `;
}

function selectOption(key, value) {
    quizAnswers[key] = value;
    
    // Update UI
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Find the clicked option and highlight it
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => {
        if (option.textContent.trim() === value) {
            option.classList.add('selected');
        }
    });
}

function nextQuestion() {
    if (!quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].key]) {
        alert('Please select an option before continuing.');
        return;
    }
    
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        completeQuiz();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

async function completeQuiz() {
    // Show roadmap section
    showSection('roadmap-section');
    
    // Generate AI-powered personalized roadmap
    try {
        const roadmapContent = document.querySelector('.roadmap-container');
        roadmapContent.innerHTML = `
            <div class="loading-roadmap">
                <h2>Generating Your Personalized Career Roadmap...</h2>
                <div class="loading-spinner"></div>
                <p>Analyzing your quiz answers to create the perfect career path...</p>
            </div>
        `;
        
        // Call AI to generate personalized roadmap
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                provider: 'gemini',
                model: 'gemini-1.5-flash',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a career counselor. Based on the user\'s quiz answers, create a personalized career roadmap with 3-4 specific career paths, steps to achieve each, and salary expectations. Keep each career description to 2-3 sentences maximum. Format as a clear, structured response.'
                    },
                    {
                        role: 'user',
                        content: `Based on these quiz answers, create a personalized career roadmap: ${JSON.stringify(quizAnswers)}`
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate roadmap');
        }
        
        const data = await response.json();
        
        // Display AI-generated roadmap
        roadmapContent.innerHTML = `
            <h2>Your Personalized Career Roadmap</h2>
            <p>Based on your quiz answers, here's your customized career guidance:</p>
            <div class="ai-roadmap">
                ${data.response.replace(/\n/g, '<br>')}
            </div>
            <div class="roadmap-actions">
                <button onclick="showSection('chat-section')" class="btn btn-primary">Chat with AI Mentor</button>
                <button onclick="showSection('hero')" class="btn btn-secondary">Take Quiz Again</button>
            </div>
        `;
        
    } catch (error) {
        console.error('Error generating roadmap:', error);
        // Fallback to static content
        roadmapContent.innerHTML = `
            <h2>Career Roadmaps</h2>
            <p>Explore detailed career paths and the steps to achieve your goals</p>
            <div class="careers-grid">
                <!-- Static career cards here -->
            </div>
        `;
    }
}

// Chat Functions
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message ai typing-indicator';
    typingDiv.innerHTML = `
        <strong>AI Mentor:</strong> 
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    document.getElementById('chat-messages').appendChild(typingDiv);
    document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    
    try {
        // Call the AI API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                provider: 'gemini', // Using Gemini API
                model: 'gemini-1.5-flash',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an AI career mentor. Give SHORT, concise answers (1-2 sentences max). Be direct and helpful. No long explanations.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        typingDiv.remove();
        
        // Add AI response
        addChatMessage(data.response, 'ai');
        
    } catch (error) {
        console.error('Error calling AI API:', error);
        
        // Remove typing indicator
        typingDiv.remove();
        
        // Fallback response
        addChatMessage("I'm having trouble connecting to my AI services right now. Please try again in a moment, or feel free to ask about career paths, skills development, or job search strategies!", 'ai');
    }
}

function addChatMessage(content, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.textContent = content;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mobile navigation toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    if (nav) {
        nav.classList.toggle('open');
    }
}

// Initialize the app immediately
document.addEventListener('DOMContentLoaded', function() {
    console.log('MindMate app initializing...');
    
    // Immediately hide loading screen and show main content
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    
    // Show hero section by default (this will also show features)
    showSection('hero');
    
    // Initialize quiz
    document.getElementById('total-questions').textContent = QUIZ_QUESTIONS.length;
    
    console.log('MindMate app initialized successfully!');
});
