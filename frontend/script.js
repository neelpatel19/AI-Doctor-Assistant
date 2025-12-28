// Configuration
const API_BASE_URL = 'http://localhost:8000';
const SESSION_ID = generateSessionId();

// State
let conversationHistory = [];
let isLoading = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAPIHealth();
    autoResizeTextarea();
});

// Generate unique session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check API health
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        
        const statusIndicator = document.getElementById('statusIndicator');
        if (data.status === 'healthy') {
            statusIndicator.innerHTML = `
                <span class="status-dot"></span>
                <span class="status-text">Online (${data.total_documents} conditions)</span>
            `;
        } else {
            statusIndicator.innerHTML = `
                <span class="status-dot" style="background: #f59e0b;"></span>
                <span class="status-text">Limited</span>
            `;
        }
    } catch (error) {
        console.error('Health check failed:', error);
        const statusIndicator = document.getElementById('statusIndicator');
        statusIndicator.innerHTML = `
            <span class="status-dot" style="background: #ef4444;"></span>
            <span class="status-text">Offline</span>
        `;
    }
}

// Start chat
function startChat() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'flex';
    
    // Add welcome message from doctor
    addMessage('assistant', 'Hello! I\'m your AI Medical Assistant. 👋\n\nI\'m here to help you understand your symptoms and provide general health guidance. Please describe what you\'re experiencing, and I\'ll do my best to assist you.\n\n**Remember:** This is for informational purposes only. Always consult a healthcare professional for medical advice.');
}

// Send example message
function sendExample(text) {
    startChat();
    document.getElementById('messageInput').value = text;
    setTimeout(() => sendMessage(), 300);
}

// Reset chat
function resetChat() {
    if (confirm('Start a new consultation? Your current conversation will be cleared.')) {
        conversationHistory = [];
        document.getElementById('messagesContainer').innerHTML = '';
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || isLoading) return;
    
    // Add user message
    addMessage('user', message);
    input.value = '';
    input.style.height = 'auto';
    
    // Show typing indicator
    const typingId = addTypingIndicator();
    
    // Disable input
    isLoading = true;
    document.getElementById('sendButton').disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                session_id: SESSION_ID,
                conversation_history: conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add assistant response
        addMessage('assistant', data.reply);
        
        // Update conversation history
        conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: data.reply }
        );
        
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator(typingId);
        addMessage('assistant', '⚠️ Sorry, I encountered an error. Please make sure the API server is running and try again.');
    } finally {
        isLoading = false;
        document.getElementById('sendButton').disabled = false;
        input.focus();
    }
}

// Add message to chat
function addMessage(role, content) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatarSvg = role === 'user' 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke-width="2"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke-width="2"/><path d="M12 8v8m-4-4h8" stroke-width="2" stroke-linecap="round"/></svg>';
    
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Format content (basic markdown support)
    const formattedContent = formatMessage(content);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatarSvg}</div>
        <div class="message-content">
            <div class="message-bubble">${formattedContent}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    scrollToBottom();
}

// Format message (basic markdown)
function formatMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

// Add typing indicator
function addTypingIndicator() {
    const container = document.getElementById('messagesContainer');
    const typingDiv = document.createElement('div');
    const id = `typing-${Date.now()}`;
    typingDiv.id = id;
    typingDiv.className = 'message assistant';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke-width="2"/>
                <path d="M12 8v8m-4-4h8" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(typingDiv);
    scrollToBottom();
    return id;
}

// Remove typing indicator
function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Handle keyboard shortcuts
function handleKeyDown(event) {
    // Enter without shift sends message
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Show loading overlay (for future use)
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
