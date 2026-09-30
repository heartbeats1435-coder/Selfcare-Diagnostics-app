/* file: assets/js/ai-assistant.js */
/**
 * Selfcare Diagnostics - SIA AI Assistant v4.0.0
 * Handles floating SIA assistant, voice search, prescription photo upload (Strictly Images),
 * OCR, catalogue matching, and safe cart addition.
 */

const AIAssistant = {
  isInitialized: false,

  init() {
    if (this.isInitialized) return;
    this.renderFloatingButton();
    this.isInitialized = true;
  },

  renderFloatingButton() {
    if (document.getElementById('sia-floating-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'sia-floating-btn';
    btn.className = 'sia-float-btn glass-card';
    btn.innerHTML = `
      <span class="sia-avatar">🤖</span>
      <div class="sia-label">
        <span class="sia-title">ASK SIA</span>
        <span class="sia-sub">AI Health Assistant</span>
      </div>
    `;
    btn.onclick = () => this.openAIModal();
    document.body.appendChild(btn);
  },

  openAIModal() {
    let modal = document.getElementById('sia-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sia-modal';
      modal.className = 'sia-modal-overlay';
      modal.innerHTML = `
        <div class="sia-modal-content glass-card">
          <div class="sia-modal-header">
            <h3>🤖 SIA AI Assistant</h3>
            <button class="sia-close-btn" onclick="AIAssistant.closeAIModal()">✕</button>
          </div>
          <div class="sia-modal-body">
            <div class="sia-tabs">
              <button class="sia-tab active" onclick="AIAssistant.switchTab('chat', this)">💬 Assistant</button>
              <button class="sia-tab" onclick="AIAssistant.switchTab('prescription', this)">📄 Prescription OCR</button>
              <button class="sia-tab" onclick="AIAssistant.switchTab('voice', this)">🎙️ Voice Search</button>
            </div>
            
            <div id="sia-tab-chat" class="sia-tab-pane active">
              <div class="sia-chat-box" id="sia-chat-messages">
                <div class="sia-msg ai">Hello! I am SIA, your Selfcare AI assistant. How can I help you find tests or packages today?</div>
              </div>
              <div class="sia-input-area">
                <input type="text" id="sia-chat-input" placeholder="Ask about tests, packages, or symptoms..." onkeypress="if(event.key==='Enter') AIAssistant.sendChatMessage()">
                <button class="primary-btn" onclick="AIAssistant.sendChatMessage()">Send</button>
              </div>
            </div>

            <div id="sia-tab-prescription" class="sia-tab-pane" style="display:none;">
              <div class="sia-rx-upload-box">
                <p>Upload a clear photo of your doctor's prescription to automatically match Selfcare tests.</p>
                <input type="file" id="sia-rx-file" accept="image/jpeg,image/png,image/*" capture="environment" style="display:none;" onchange="AIAssistant.handlePrescriptionFile(this)">
                <button class="primary-btn" onclick="document.getElementById('sia-rx-file').click()">📸 Select Prescription Photo</button>
                <div id="sia-rx-loading" style="display:none; margin-top: 15px;">Analyzing prescription photo with OCR...</div>
                <div id="sia-rx-results" style="margin-top: 15px;"></div>
              </div>
            </div>

            <div id="sia-tab-voice" class="sia-tab-pane" style="display:none; text-align: center; padding: 20px;">
              <p>Tap microphone and speak your test or symptom requirement.</p>
              <button id="sia-mic-btn" class="sia-mic-circle" onclick="AIAssistant.toggleVoiceSearch()">🎙️</button>
              <div id="sia-voice-status" style="margin-top: 15px; font-weight: 500;">Tap to speak</div>
              <div id="sia-voice-results" style="margin-top: 15px; text-align: left;"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
  },

  closeAIModal() {
    const modal = document.getElementById('sia-modal');
    if (modal) modal.style.display = 'none';
  },

  switchTab(tabName, triggerElement = null) {
    document.querySelectorAll('.sia-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sia-tab-pane').forEach(p => {
      p.style.display = 'none';
      p.classList.remove('active');
    });

    if (triggerElement) {
      triggerElement.classList.add('active');
    } else {
      const tabBtn = document.querySelector(`.sia-tab[onclick*="${tabName}"]`);
      if (tabBtn) tabBtn.classList.add('active');
    }

    const targetPane = document.getElementById(`sia-tab-${tabName}`);
    if (targetPane) {
      targetPane.style.display = 'block';
      targetPane.classList.add('active');
    }
  },

  async sendChatMessage() {
    const input = document.getElementById('sia-chat-input');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;

    const chatBox = document.getElementById('sia-chat-messages');
    chatBox.innerHTML += `<div class="sia-msg user">${Utils.escapeHtml(query)}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const res = await Api.aiSearch(query);
      const tests = (res && res.tests) ? res.tests : (Array.isArray(res) ? res : []);
      const pkgs = (res && res.packages) ? res.packages : [];

      chatBox.innerHTML += `<div class="sia-msg ai">I found these matching catalogue items:</div>`;

      if (tests.length > 0 || pkgs.length > 0) {
        tests.forEach(item => {
          chatBox.innerHTML += `
            <div class="sia-msg ai-card">
              <span style="font-size: 10px; color: var(--primary-green); font-weight: 800;">🧪 TEST</span><br>
              <strong>${Utils.escapeHtml(item.TestName)}</strong><br>
              MRP: ${Utils.formatCurrency(item.MRP)} | <strong>Offer: ${Utils.formatCurrency(item.OfferPrice)}</strong><br>
              <button class="small-btn primary-btn" style="margin-top: 6px; padding: 6px 12px; font-size: 11px;" onclick='App.addToCart(${JSON.stringify(item)})'>+ Add to Cart</button>
            </div>
          `;
        });
        pkgs.forEach(item => {
          chatBox.innerHTML += `
            <div class="sia-msg ai-card">
              <span style="font-size: 10px; color: #E4005A; font-weight: 800;">📦 PACKAGE</span><br>
              <strong>${Utils.escapeHtml(item.PackageName)}</strong><br>
              MRP: ${Utils.formatCurrency(item.MRP)} | <strong>Offer: ${Utils.formatCurrency(item.OfferPrice)}</strong><br>
              <button class="small-btn primary-btn" style="margin-top: 6px; padding: 6px 12px; font-size: 11px;" onclick='App.addToCart(${JSON.stringify(item)})'>+ Add to Cart</button>
            </div>
          `;
        });
      } else {
        chatBox.innerHTML += `<div class="sia-msg ai">No exact matches found in the Selfcare catalogue. Please try searching by keyword or symptom.</div>`;
      }
    } catch (error) {
      chatBox.innerHTML += `<div class="sia-msg ai">Error connecting to SIA backend. Please check your network.</div>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
  },

  async handlePrescriptionFile(input) {
    const file = input.files[0];
    if (!file) return;

    // Reject non-image uploads
    if (file.type && !file.type.startsWith('image/')) {
      Utils.showToast('Please upload an image photo (JPEG/PNG). PDF is not supported.', 'error');
      input.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      Utils.showToast('File size exceeds 15MB limit', 'error');
      input.value = '';
      return;
    }

    const loading = document.getElementById('sia-rx-loading');
    const resultsContainer = document.getElementById('sia-rx-results');
    if (loading) loading.style.display = 'block';
    if (resultsContainer) resultsContainer.innerHTML = '';

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result.split(',')[1];
      const mimeType = file.type || 'image/jpeg';

      try {
        const response = await Api.processPrescriptionOCR(base64String, mimeType);
        if (loading) loading.style.display = 'none';

        const matches = (response && (response.matches || response.matchedTests)) || [];
        const unmatched = (response && response.unmatched) || [];

        let html = `<p class="sia-disclaimer">ℹ️ Tests identified via Selfcare Smart Matching:</p>`;

        if (matches.length > 0) {
          html += `<button class="primary-btn" style="margin-bottom:10px; width:100%;" onclick='AIAssistant.addAllMatched(${JSON.stringify(matches)})'>Add All Matched Tests to Cart</button>`;
          
          matches.forEach(match => {
            const name = match.testName || match.TestName;
            const price = match.offerPrice || match.OfferPrice;
            const ocr = match.ocrText || '';
            const conf = match.confidence ? `${match.confidence}%` : 'High';
            const isReview = match.status === 'needs_confirmation';

            html += `
              <div class="sia-match-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.85); border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${isReview ? '#F59E0B' : '#078866'};">
                <div>
                  <strong>${Utils.escapeHtml(name)}</strong>
                  <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${isReview ? '#FEF3C7' : '#D1FAE5'}; color: ${isReview ? '#92400E' : '#065F46'}; font-weight: 700; margin-left: 5px;">${conf}</span><br>
                  <small style="color: var(--text-muted);">From prescription: "${Utils.escapeHtml(ocr)}"</small><br>
                  <span style="color: var(--primary-green); font-weight: 700;">Offer: ${Utils.formatCurrency(price)}</span>
                </div>
                <button class="small-btn primary-btn" style="padding: 6px 12px; font-size: 11px;" onclick='App.addToCart(${JSON.stringify({
                  TestID: match.testId || match.TestID,
                  TestCode: match.testCode || match.TestCode,
                  TestName: name,
                  OfferPrice: price
                })})'>+ Add</button>
              </div>
            `;
          });
        } else {
          html += `<p style="font-size: 13px; color: var(--text-muted);">No confident catalogue test matches found in this prescription photo.</p>`;
        }

        if (unmatched.length > 0) {
          html += `<div style="margin-top: 10px; font-size: 11px; color: var(--text-muted);">Unidentified text items: ${unmatched.map(u => Utils.escapeHtml(u.ocrText)).join(', ')}</div>`;
        }

        if (resultsContainer) resultsContainer.innerHTML = html;
      } catch (error) {
        if (loading) loading.style.display = 'none';
        Utils.showToast(error.message || 'Prescription OCR analysis failed', 'error');
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      if (loading) loading.style.display = 'none';
      Utils.showToast('Failed to read photo', 'error');
      input.value = '';
    };
    reader.readAsDataURL(file);
  },

  addAllMatched(matches) {
    if (matches && Array.isArray(matches)) {
      matches.forEach(match => {
        App.addToCart({
          TestID: match.testId || match.TestID,
          TestCode: match.testCode || match.TestCode,
          TestName: match.testName || match.TestName,
          OfferPrice: match.offerPrice || match.OfferPrice,
          MRP: match.mrp || match.MRP
        });
      });
    }
  },

  toggleVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Utils.showToast('Speech recognition not supported in this browser', 'error');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      const status = document.getElementById('sia-voice-status');
      const resultsDiv = document.getElementById('sia-voice-results');

      recognition.onstart = () => {
        if (status) status.textContent = 'Listening... Speak now.';
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        if (status) status.textContent = `You said: "${transcript}"`;
        try {
          const res = await Api.aiSearch(transcript);
          const tests = (res && res.tests) ? res.tests : (Array.isArray(res) ? res : []);
          let html = '<h4 style="margin-top: 10px; font-size: 14px; color: var(--dark-green);">Matching Tests:</h4>';
          if (tests && tests.length > 0) {
            tests.forEach(item => {
              html += `
                <div class="sia-match-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.8); border-radius: 8px; margin-bottom: 8px;">
                  <div>
                    <strong>${Utils.escapeHtml(item.TestName || item.PackageName)}</strong><br>
                    <span style="color: var(--primary-green); font-weight: 700;">${Utils.formatCurrency(item.OfferPrice)}</span>
                  </div>
                  <button class="small-btn primary-btn" style="padding: 6px 12px; font-size: 11px;" onclick='App.addToCart(${JSON.stringify(item)})'>+ Add</button>
                </div>
              `;
            });
          } else {
            html += '<p style="font-size: 13px; color: var(--text-muted);">No matches found.</p>';
          }
          if (resultsDiv) resultsDiv.innerHTML = html;
        } catch (e) {
          if (resultsDiv) resultsDiv.innerHTML = '<p style="font-size: 13px; color: var(--text-muted);">Error searching catalogue.</p>';
        }
      };

      recognition.onerror = (e) => {
        if (status) status.textContent = 'Voice recognition error. Try again.';
        console.warn('Speech recognition error:', e);
      };

      recognition.start();
    } catch (err) {
      console.error('SpeechRecognition initialization error:', err);
      Utils.showToast('Could not start voice recognition', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AIAssistant.init();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAssistant;
}
