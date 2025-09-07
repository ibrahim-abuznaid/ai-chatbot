// Configuration
const CONFIG = {
    // Replace this with your actual webhook URL
    WEBHOOK_URL: 'https://cloud.activepieces.com/api/v1/webhooks/Mv38eBdOp6AP7ctrdOGOP',
    MAX_MESSAGE_LENGTH: 5000,
    TYPING_DELAY: 100,
    API_TIMEOUT: 30000, // 30 seconds
    MESSAGES: {
        THINKING: [
            'AI is thinking...',
            'Processing your request...',
            'Generating response...',
            'Working on it...',
            'Almost ready...'
        ],
        ERROR: [
            "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
            "Something went wrong on my end. Could you please try sending your message again?",
            "I'm experiencing some technical difficulties. Please give me a moment and try again."
        ],
        TIMEOUT: "I'm taking longer than usual to respond. Please try again, or check your connection.",
        NO_RESPONSE: "I received your message and I'm processing it. Thank you for your patience!"
    }
};

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const loadingOverlay = document.getElementById('loadingOverlay');
const charCount = document.querySelector('.char-count');
const starterCards = document.querySelectorAll('.starter-card');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettings');
const saveSettingsBtn = document.getElementById('saveSettings');
const resetSettingsBtn = document.getElementById('resetSettings');
const webhookUrlInput = document.getElementById('webhookUrl');
const apiTimeoutInput = document.getElementById('apiTimeout');

// State
let isLoading = false;
let messageHistory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateCharCount();
    showWelcomeMessage();
    initializeSettings();
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
    
    // Settings modal event listeners
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    resetSettingsBtn.addEventListener('click', resetSettings);
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) {
            closeSettings();
        }
    });
    
    // Close modal with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && settingsModal.classList.contains('show')) {
            closeSettings();
        }
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
    
    let typingIndicator = null;
    
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
        
        // Show typing indicator instead of full screen loading
        const typingMessage = {
            isBot: true,
            isTyping: true,
            timestamp: new Date(),
            thinkingText: getRandomThinkingMessage()
        };
        
        typingIndicator = addMessageToChat(typingMessage);
        
        // Update thinking message periodically for long requests
        const thinkingInterval = setInterval(() => {
            if (typingIndicator && typingIndicator.parentNode) {
                const textElement = typingIndicator.querySelector('.typing-text');
                if (textElement) {
                    textElement.textContent = getRandomThinkingMessage();
                }
            } else {
                clearInterval(thinkingInterval);
            }
        }, 3000);
        
        // Send to webhook
        const response = await sendToWebhook(message);
        
        // Clear the thinking interval
        clearInterval(thinkingInterval);
        
        // Remove typing indicator
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Add bot response to chat with typing animation
        const botMessage = {
            text: response || CONFIG.MESSAGES.NO_RESPONSE,
            isBot: true,
            timestamp: new Date()
        };
        
        // Add the real response with a slight delay for better UX
        setTimeout(() => {
            addMessageToChat(botMessage);
            messageHistory.push(botMessage);
        }, 300);
        
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Clear the thinking interval
        if (typeof thinkingInterval !== 'undefined') {
            clearInterval(thinkingInterval);
        }
        
        // Remove typing indicator if there's an error
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        // Determine error message based on error type
        let errorText;
        if (error.message.includes('timed out') || error.message.includes('timeout')) {
            errorText = CONFIG.MESSAGES.TIMEOUT;
        } else {
            errorText = getRandomErrorMessage();
        }
        
        const errorMessage = {
            text: errorText,
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
        
        const response = await fetch(getWebhookURL(), {
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
    messageElement.className = `message ${message.isBot ? 'bot' : 'user'}${message.isError ? ' error' : ''}${message.isTyping ? ' typing' : ''}`;
    
    const timeString = formatTime(message.timestamp);
    
    if (message.isTyping) {
        messageElement.innerHTML = `
            <div class="message-text">
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span class="typing-text">${message.thinkingText || 'AI is thinking...'}</span>
                </div>
            </div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="message-text">${escapeHtml(message.text)}</div>
            <div class="message-time">${timeString}</div>
        `;
    }
    
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
    
    return messageElement;
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

// Get random thinking message
function getRandomThinkingMessage() {
    const messages = CONFIG.MESSAGES.THINKING;
    return messages[Math.floor(Math.random() * messages.length)];
}

// Get random error message
function getRandomErrorMessage() {
    const messages = CONFIG.MESSAGES.ERROR;
    return messages[Math.floor(Math.random() * messages.length)];
}

// Webhook URL configuration
function setWebhookURL(url) {
    if (url && typeof url === 'string') {
        CONFIG.WEBHOOK_URL = url;
        localStorage.setItem('chatbot_webhook_url', url);
    }
}

function getWebhookURL() {
    const stored = localStorage.getItem('chatbot_webhook_url');
    return stored || CONFIG.WEBHOOK_URL;
}

// Settings Management
function initializeSettings() {
    const storedURL = localStorage.getItem('chatbot_webhook_url');
    const storedTimeout = localStorage.getItem('chatbot_api_timeout');
    
    if (storedURL) {
        CONFIG.WEBHOOK_URL = storedURL;
    }
    
    if (storedTimeout) {
        CONFIG.API_TIMEOUT = parseInt(storedTimeout) * 1000; // Convert to milliseconds
    }
    
    updateSettingsUI();
}

function updateSettingsUI() {
    webhookUrlInput.value = CONFIG.WEBHOOK_URL;
    apiTimeoutInput.value = CONFIG.API_TIMEOUT / 1000; // Convert to seconds
}

function openSettings() {
    updateSettingsUI();
    settingsModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    settingsModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function saveSettings() {
    const newWebhookUrl = webhookUrlInput.value.trim();
    const newTimeout = parseInt(apiTimeoutInput.value);
    
    if (!newWebhookUrl) {
        alert('Please enter a valid webhook URL');
        return;
    }
    
    if (!newTimeout || newTimeout < 5 || newTimeout > 120) {
        alert('Please enter a timeout between 5 and 120 seconds');
        return;
    }
    
    // Save to config and localStorage
    CONFIG.WEBHOOK_URL = newWebhookUrl;
    CONFIG.API_TIMEOUT = newTimeout * 1000; // Convert to milliseconds
    
    localStorage.setItem('chatbot_webhook_url', newWebhookUrl);
    localStorage.setItem('chatbot_api_timeout', newTimeout.toString());
    
    // Show success message
    const successMessage = {
        text: "Settings saved successfully! 🎉",
        isBot: true,
        timestamp: new Date()
    };
    
    addMessageToChat(successMessage);
    closeSettings();
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        // Clear localStorage
        localStorage.removeItem('chatbot_webhook_url');
        localStorage.removeItem('chatbot_api_timeout');
        
        // Reset config to defaults
        CONFIG.WEBHOOK_URL = 'https://cloud.activepieces.com/api/v1/webhooks/Mv38eBdOp6AP7ctrdOGOP';
        CONFIG.API_TIMEOUT = 30000;
        
        updateSettingsUI();
        
        const resetMessage = {
            text: "Settings have been reset to default values.",
            isBot: true,
            timestamp: new Date()
        };
        
        addMessageToChat(resetMessage);
        closeSettings();
    }
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

