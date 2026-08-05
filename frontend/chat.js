document.addEventListener('DOMContentLoaded', () => {
    const widgetBtn = document.getElementById('ai-widget-btn');
    const popup = document.getElementById('ai-chat-popup');
    const closeBtn = document.getElementById('ai-close-btn');
    const sendBtn = document.getElementById('ai-send-btn');
    const inputField = document.getElementById('ai-chat-input');
    const chatBody = document.getElementById('ai-chat-body');

    // Toggle popup
    widgetBtn.addEventListener('click', () => {
        popup.classList.toggle('hidden');
        if (!popup.classList.contains('hidden')) {
            inputField.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        popup.classList.add('hidden');
    });

    // Send message
    const sendMessage = async () => {
        const query = inputField.value.trim();
        if (!query) return;

        // Add user message to UI
        addMessage(query, 'user');
        inputField.value = '';

        // Add loading state
        const loadingId = addMessage('Analyzing your request...', 'system', true);

        try {
            const userGender = window.app && window.app.currentUser ? window.app.currentUser.gender : null;
            const response = await fetch('/api/ai/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, userGender })
            });

            const data = await response.json();
            
            // Remove loading message
            removeMessage(loadingId);

            if (data.success && data.recommendations && data.recommendations.length > 0) {
                const rationaleText = data.intent.rationale || `I found ${data.recommendations.length} recommendations for you.`;
                let resultHtml = `<p style="margin-bottom: 0.5rem; color: #555;"><em>"${rationaleText}"</em></p>`;
                resultHtml += `<div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">`;
                
                data.recommendations.forEach(perfume => {
                    // Quick fallback for image
                    const imgUrl = perfume.image_url || 'https://via.placeholder.com/40';
                    const notesStr = perfume.notes ? perfume.notes.map(n => n.note_name).slice(0,3).join(', ') : '';
                    
                    resultHtml += `
                        <div class="ai-perfume-result" onclick="window.app.loadDetail(${perfume.perfume_id})">
                            <img src="${imgUrl}" alt="${perfume.name}">
                            <div class="ai-perfume-info">
                                <strong>${perfume.name}</strong>
                                <span>$${perfume.price} | Notes: ${notesStr}...</span>
                            </div>
                        </div>
                    `;
                });
                resultHtml += `</div>`;
                
                addMessage(resultHtml, 'system', false, true);
            } else if (data.success) {
                const rationaleText = data.intent.rationale || "I couldn't find any perfumes matching exactly what you asked for.";
                addMessage(`<p style="margin-bottom: 0.5rem; color: #555;"><em>"${rationaleText}"</em></p><p>Unfortunately, I couldn't find any exact matches in our database. Try broadening your search!</p>`, 'system', false, true);
            } else {
                addMessage('Sorry, there was an error processing your request.', 'system');
            }
        } catch (error) {
            console.error('Error fetching AI recommendations:', error);
            removeMessage(loadingId);
            addMessage('Failed to connect to the AI service.', 'system');
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Helper functions for chat UI
    function addMessage(text, type, isLoading = false, isHtml = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${type}`;
        
        const id = 'msg-' + Date.now();
        msgDiv.id = id;

        if (isHtml) {
            msgDiv.innerHTML = text;
        } else {
            msgDiv.textContent = text;
        }

        if (isLoading) {
            msgDiv.style.opacity = '0.7';
            msgDiv.style.fontStyle = 'italic';
        }

        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        
        return id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
