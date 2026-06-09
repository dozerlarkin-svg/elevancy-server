// ============================================================
// Elevancy AI Receptionist — Embed Script
// Any business pastes 2 lines into their website and this
// chat bubble appears automatically. No coding needed!
// ============================================================

const ElevancyChat = (function () {

  const SERVER_URL = "https://elevancy-server-production.up.railway.app";
  let conversationHistory = [];
  let chatOpen = false;
  let firstOpen = true;
  let businessName = "us";

  // ============================================================
  // Step 1 — Inject the CSS styles into the page
  // ============================================================
  function injectStyles() {
    const styles = `
      #elevancy-bubble {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #1a56db, #0e3a8c);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(26,86,219,0.5);
        transition: transform 0.2s;
        z-index: 999999;
      }
      #elevancy-bubble:hover { transform: scale(1.1); }
      #elevancy-bubble svg { width: 28px; height: 28px; fill: white; }

      #elevancy-notification {
        position: absolute;
        top: -8px;
        right: -4px;
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: bold;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #elevancy-window {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 360px;
        height: 500px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 999999;
        font-family: Arial, sans-serif;
      }

      #elevancy-window.open { display: flex; }

      #elevancy-header {
        background: linear-gradient(135deg, #1a56db, #0e3a8c);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      #elevancy-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }

      #elevancy-header h3 {
        font-size: 15px;
        margin: 0 0 2px 0;
        font-weight: 600;
      }

      #elevancy-header p {
        font-size: 12px;
        margin: 0;
        opacity: 0.8;
      }

      #elevancy-close {
        margin-left: auto;
        background: none;
        border: none;
        color: white;
        font-size: 22px;
        cursor: pointer;
        opacity: 0.8;
        line-height: 1;
        padding: 0;
      }

      #elevancy-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .elevancy-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
      }

      .elevancy-message.ai {
        background: #f0f4ff;
        color: #1a1a2e;
        border-bottom-left-radius: 4px;
        align-self: flex-start;
      }

      .elevancy-message.user {
        background: linear-gradient(135deg, #1a56db, #0e3a8c);
        color: white;
        border-bottom-right-radius: 4px;
        align-self: flex-end;
      }

      .elevancy-typing {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 10px 14px;
        background: #f0f4ff;
        border-radius: 12px;
        border-bottom-left-radius: 4px;
        align-self: flex-start;
        width: fit-content;
      }

      .elevancy-typing span {
        width: 8px;
        height: 8px;
        background: #1a56db;
        border-radius: 50%;
        animation: elevancy-bounce 1s infinite;
      }

      .elevancy-typing span:nth-child(2) { animation-delay: 0.15s; }
      .elevancy-typing span:nth-child(3) { animation-delay: 0.3s; }

      @keyframes elevancy-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }

      #elevancy-input-area {
        padding: 12px 16px;
        border-top: 1px solid #f0f0f0;
        display: flex;
        gap: 10px;
        align-items: center;
      }

      #elevancy-input {
        flex: 1;
        border: 1px solid #e0e0e0;
        border-radius: 24px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        font-family: Arial, sans-serif;
      }

      #elevancy-input:focus { border-color: #1a56db; }

      #elevancy-send {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #1a56db, #0e3a8c);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      #elevancy-send svg { width: 18px; height: 18px; fill: white; }

      #elevancy-powered {
        text-align: center;
        font-size: 11px;
        color: #999;
        padding: 6px;
        border-top: 1px solid #f0f0f0;
      }

      #elevancy-powered a {
        color: #1a56db;
        text-decoration: none;
        font-weight: 500;
      }
    `;

    const styleTag = document.createElement("style");
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
  }

  // ============================================================
  // Step 2 — Build the chat bubble and window HTML
  // ============================================================
  function buildHTML() {
    const bubble = document.createElement("div");
    bubble.id = "elevancy-bubble";
    bubble.onclick = toggleChat;
    bubble.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      <div id="elevancy-notification">1</div>
    `;

    const window_ = document.createElement("div");
    window_.id = "elevancy-window";
    window_.innerHTML = `
      <div id="elevancy-header">
        <div id="elevancy-avatar">🤖</div>
        <div>
          <h3 id="elevancy-business-name">AI Receptionist</h3>
          <p>Online now • Powered by Elevancy</p>
        </div>
        <button id="elevancy-close" onclick="ElevancyChat.toggle()">×</button>
      </div>
      <div id="elevancy-messages"></div>
      <div id="elevancy-input-area">
        <input id="elevancy-input" type="text" placeholder="Type your question..."/>
        <button id="elevancy-send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
      <div id="elevancy-powered">Powered by <a href="#">Elevancy</a></div>
    `;

    document.body.appendChild(bubble);
    document.body.appendChild(window_);

    // Wire up send button and enter key
    document.getElementById("elevancy-send").onclick = sendMessage;
    document.getElementById("elevancy-input").onkeypress = function(e) {
      if (e.key === "Enter") sendMessage();
    };
  }

  // ============================================================
  // Step 3 — Load business name from server automatically
  // ============================================================
  async function loadBusinessName() {
    try {
      const res = await fetch(`${SERVER_URL}/business-info`);
      const data = await res.json();
      businessName = data.name;
      document.getElementById("elevancy-business-name").textContent = data.name;
    } catch (e) {
      console.log("Elevancy: Could not load business info");
    }
  }

  // ============================================================
  // Step 4 — Chat functions
  // ============================================================
  function toggleChat() {
    chatOpen = !chatOpen;
    const win = document.getElementById("elevancy-window");
    win.classList.toggle("open", chatOpen);
    document.getElementById("elevancy-notification").style.display = "none";

    if (firstOpen && chatOpen) {
      firstOpen = false;
      setTimeout(() => {
        addMessage("ai", `👋 Hi there! I'm the AI receptionist for ${businessName}. How can I help you today?`);
      }, 400);
    }

    if (chatOpen) {
      document.getElementById("elevancy-input").focus();
    }
  }

  function addMessage(role, text) {
    const messages = document.getElementById("elevancy-messages");
    const div = document.createElement("div");
    div.className = `elevancy-message ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const messages = document.getElementById("elevancy-messages");
    const div = document.createElement("div");
    div.className = "elevancy-typing";
    div.id = "elevancy-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById("elevancy-typing");
    if (t) t.remove();
  }

  async function sendMessage() {
    const input = document.getElementById("elevancy-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    input.value = "";
    conversationHistory.push({ role: "user", content: text });
    showTyping();

    try {
      const response = await fetch(`${SERVER_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationHistory })
      });

      const data = await response.json();
      hideTyping();
      conversationHistory.push({ role: "assistant", content: data.response });
      addMessage("ai", data.response);

    } catch (error) {
      hideTyping();
      addMessage("ai", "Sorry, I'm having trouble connecting right now. Please call us directly for immediate help!");
    }
  }

  // ============================================================
  // Public init function — this is what businesses call
  // ============================================================
  function init() {
    injectStyles();
    buildHTML();
    loadBusinessName();
    console.log("Elevancy AI Receptionist loaded successfully!");
  }

  return { init, toggle: toggleChat };

})();
