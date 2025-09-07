// Configuration
const CONFIG = {
    // Replace this with your actual ActivePieces webhook URL
    WEBHOOK_URL: 'https://your-activepieces-webhook-url.com/webhook',
    MAX_MESSAGE_LENGTH: 500,
    TYPING_DELAY: 100,
    API_TIMEOUT: 30000 // 30 seconds
};

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const loadingOverlay = document.getElementById('loadingOverlay');
const charCount = document.querySelector('.char-count');
const starterCards = document.querySelectorAll('.starter-card');

// State
let isLoading = false;
let messageHistory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateCharCount();
    showWelcomeMessage();
});

// Event Listeners
function initializeEventListeners() {
    // Send button click
    sendButton.addEventListener('click', handleSendMessage);
    
    // Enter key press
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Input character count
    messageInput.addEventListener('input', function() {
        updateCharCount();
        updateSendButtonState();
    });
    
    // Starter card clicks
    starterCards.forEach(card => {
        card.addEventListener('click', function() {
            const message = this.getAttribute('data-message');
            if (message) {
                messageInput.value = message;
                updateCharCount();
                updateSendButtonState();
                handleSendMessage();
            }
        });
        
        // Add keyboard support for starter cards
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Show welcome message
function showWelcomeMessage() {
    const welcomeMessage = {
        text: "👋 Welcome! I'm your AI assistant. Feel free to ask me anything or choose one of the conversation starters above to get started.",
        isBot: true,
        timestamp: new Date()
    };
    
    addMessageToChat(welcomeMessage);
}

// Handle sending messages
async function handleSendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isLoading) {
        return;
    }
    
    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showError(`Message too long. Please keep it under ${CONFIG.MAX_MESSAGE_LENGTH} characters.`);
        return;
    }
    
    try {
        // Add user message to chat
        const userMessage = {
            text: message,
            isBot: false,
            timestamp: new Date()
        };
        
        addMessageToChat(userMessage);
        messageHistory.push(userMessage);
        
        // Clear input and disable send button
        messageInput.value = '';
        updateCharCount();
        updateSendButtonState();
        
        // Show loading state
        setLoadingState(true);
        
        // Send to webhook
        const response = await sendToWebhook(message);
        
        // Add bot response to chat
        const botMessage = {
            text: response || "I received your message and I'm processing it. Thank you for your patience!",
            isBot: true,
            timestamp: new Date()
        };
        
        addMessageToChat(botMessage);
        messageHistory.push(botMessage);
        
    } catch (error) {
        console.error('Error sending message:', error);
        
        const errorMessage = {
            text: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
            isBot: true,
            timestamp: new Date(),
            isError: true
        };
        
        addMessageToChat(errorMessage);
    } finally {
        setLoadingState(false);
        messageInput.focus();
    }
}

// Send message to ActivePieces webhook
async function sendToWebhook(message) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
    
    try {
        const payload = {
            message: message,
            timestamp: new Date().toISOString(),
            sessionId: getSessionId(),
            userAgent: navigator.userAgent
        };
        
        const response = await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.response || data.message || "Thank you for your message!";
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        
        throw error;
    }
}

// Add message to chat interface
function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.isBot ? 'bot' : 'user'}${message.isError ? ' error' : ''}`;
    
    const timeString = formatTime(message.timestamp);
    
    messageElement.innerHTML = `
        <div class="message-text">${escapeHtml(message.text)}</div>
        <div class="message-time">${timeString}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Smooth scroll to bottom with animation
    setTimeout(() => {
        messageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end' 
        });
    }, 100);
    
    // Hide conversation starters after first message
    if (messageHistory.length === 1) {
        hideConversationStarters();
    }
}

// Hide conversation starters with animation
function hideConversationStarters() {
    const startersSection = document.querySelector('.conversation-starters');
    if (startersSection) {
        startersSection.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        startersSection.style.opacity = '0';
        startersSection.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            startersSection.style.display = 'none';
        }, 500);
    }
}

// Update character count display
function updateCharCount() {
    const currentLength = messageInput.value.length;
    charCount.textContent = `${currentLength}/${CONFIG.MAX_MESSAGE_LENGTH}`;
    
    // Change color based on character count
    if (currentLength > CONFIG.MAX_MESSAGE_LENGTH * 0.9) {
        charCount.style.color = '#ef4444';
    } else if (currentLength > CONFIG.MAX_MESSAGE_LENGTH * 0.7) {
        charCount.style.color = '#f59e0b';
    } else {
        charCount.style.color = '#94a3b8';
    }
}

// Update send button state
function updateSendButtonState() {
    const hasText = messageInput.value.trim().length > 0;
    const isValidLength = messageInput.value.length <= CONFIG.MAX_MESSAGE_LENGTH;
    
    sendButton.disabled = !hasText || !isValidLength || isLoading;
}

// Set loading state
function setLoadingState(loading) {
    isLoading = loading;
    
    if (loading) {
        loadingOverlay.classList.add('show');
        sendButton.disabled = true;
        messageInput.disabled = true;
    } else {
        loadingOverlay.classList.remove('show');
        messageInput.disabled = false;
        updateSendButtonState();
    }
}

// Utility functions
function formatTime(date) {
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getSessionId() {
    let sessionId = sessionStorage.getItem('chatSessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('chatSessionId', sessionId);
    }
    return sessionId;
}

function showError(message) {
    const errorMessage = {
        text: message,
        isBot: true,
        timestamp: new Date(),
        isError: true
    };
    
    addMessageToChat(errorMessage);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Focus input on any key press (except special keys)
    if (!e.ctrlKey && !e.altKey && !e.metaKey && 
        e.key.length === 1 && 
        document.activeElement !== messageInput) {
        messageInput.focus();
    }
    
    // Clear chat with Ctrl+K (like Discord/Slack)
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        clearChat();
    }
});

// Clear chat function
function clearChat() {
    chatMessages.innerHTML = '';
    messageHistory = [];
    showWelcomeMessage();
    
    // Show conversation starters again
    const startersSection = document.querySelector('.conversation-starters');
    if (startersSection) {
        startersSection.style.display = 'block';
        startersSection.style.opacity = '1';
        startersSection.style.transform = 'translateY(0)';
    }
}

// Add copy functionality for messages
chatMessages.addEventListener('click', function(e) {
    if (e.target.closest('.message')) {
        const messageElement = e.target.closest('.message');
        const messageText = messageElement.querySelector('.message-text').textContent;
        
        // Double-click to copy
        if (e.detail === 2) {
            navigator.clipboard.writeText(messageText).then(() => {
                // Show brief feedback
                const originalText = messageElement.querySelector('.message-text').innerHTML;
                messageElement.querySelector('.message-text').innerHTML = '📋 Copied!';
                
                setTimeout(() => {
                    messageElement.querySelector('.message-text').innerHTML = originalText;
                }, 1000);
            }).catch(err => {
                console.error('Failed to copy text:', err);
            });
        }
    }
});

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.name === 'webhook-request') {
            console.log(`Webhook request took ${entry.duration}ms`);
        }
    }
});

performanceObserver.observe({ entryTypes: ['measure'] });

// Error handling for uncaught errors
window.addEventListener('error', function(e) {
    console.error('Uncaught error:', e.error);
    setLoadingState(false);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    setLoadingState(false);
});

// Service worker registration (for future PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment when you want to add offline capabilities
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}
