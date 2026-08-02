/**
 * AI page — natural language ScentAI assistant.
 */
let chatHistory = [];

async function renderAI() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="page-header" style="text-align:center;">
      <h1 class="page-header__title" style="background:linear-gradient(135deg, var(--purple-light), var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ScentAI Consultant</h1>
      <p class="page-header__subtitle">Your personal sommelier for the perfect fragrance.</p>
    </div>

    <div class="ai-container">
      <div class="ai-chat" id="chatBox">
        <!-- Messages rendered here -->
      </div>
      
      <form id="aiForm" class="ai-input-row">
        <input name="message" id="aiInput" autocomplete="off" placeholder="E.g. I want a fresh, aquatic scent for the office under $100..." required />
        <button type="submit" class="btn btn--ai" id="aiBtn">Send ✦</button>
      </form>
    </div>
  `;

  renderChat();
  document.getElementById('aiForm').addEventListener('submit', handleAiSubmit);
}

function renderChat() {
  const box = document.getElementById('chatBox');
  if (!box) return;

  if (chatHistory.length === 0) {
    box.innerHTML = `
      <div class="ai-msg ai-msg--bot">
        <p>Hello! I'm <strong>ScentAI</strong>. I know every note, season, and performance detail in our catalog. What kind of fragrance are you looking for today?</p>
      </div>
    `;
    return;
  }

  box.innerHTML = chatHistory.map(msg => {
    // Basic markdown to HTML (bold and line breaks)
    const formattedText = escapeHtml(msg.content)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
      
    return `<div class="ai-msg ai-msg--${msg.role === 'user' ? 'user' : 'bot'}">${formattedText}</div>`;
  }).join('');
  
  box.scrollTop = box.scrollHeight;
}

async function handleAiSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('aiInput');
  const btn = document.getElementById('aiBtn');
  const msg = input.value.trim();
  if (!msg) return;

  // Add user message to UI immediately
  chatHistory.push({ role: 'user', content: msg });
  input.value = '';
  input.disabled = true;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin:0;"></span>';
  renderChat();

  // Show thinking indicator
  const box = document.getElementById('chatBox');
  const thinkingId = 'thinking-' + Date.now();
  box.innerHTML += `<div class="ai-msg ai-msg--bot" id="${thinkingId}" style="opacity:0.6;font-style:italic;">ScentAI is thinking...</div>`;
  box.scrollTop = box.scrollHeight;

  try {
    const res = await API.post('/ai/chat', { 
      message: msg,
      history: chatHistory.slice(0, -1) // Send history excluding the message we just added
    });
    
    document.getElementById(thinkingId)?.remove();
    chatHistory.push({ role: 'model', content: res.response });
  } catch (err) {
    document.getElementById(thinkingId)?.remove();
    chatHistory.push({ role: 'model', content: `⚠️ Error: ${err.message}` });
  } finally {
    input.disabled = false;
    btn.disabled = false;
    btn.innerHTML = 'Send ✦';
    renderChat();
    input.focus();
  }
}
