/**
 * ═══════════════════════════════════════════════════════════════════
 * NEXIA BABEL — Módulo de Tradução Simultânea v1.0
 * Speech-to-Speech · PT → EN / ES · Plug-and-Play
 * Usa webkitSpeechRecognition + speechSynthesis nativos do browser
 * ═══════════════════════════════════════════════════════════════════
 *
 * USO:
 *   1. Adicione <script src="nexia-babel.js"></script> no seu HTML
 *   2. Chame NexiaBabel.mount('#seu-container') — ele injeta o widget
 *   3. Ou chame NexiaBabel.init() para só ativar a API sem UI
 *
 * API PÚBLICA:
 *   NexiaBabel.mount(selector, options)  → injeta widget no elemento
 *   NexiaBabel.translate(text, langTo)   → Promise<string>
 *   NexiaBabel.speak(text, lang)         → fala o texto
 *   NexiaBabel.on(event, fn)             → events: 'transcript','translation','error'
 * ═══════════════════════════════════════════════════════════════════
 */

const NexiaBabel = (() => {

    // ── DICIONÁRIO LOCAL (frases de interface empresarial) ──────────
    // Formato: { "pt": { "en": "...", "es": "..." } }
    const DICT = {
        // Saudações
        "olá": { en: "hello", es: "hola" },
        "bom dia": { en: "good morning", es: "buenos días" },
        "boa tarde": { en: "good afternoon", es: "buenas tardes" },
        "boa noite": { en: "good evening", es: "buenas noches" },
        "obrigado": { en: "thank you", es: "gracias" },
        "obrigada": { en: "thank you", es: "gracias" },
        "por favor": { en: "please", es: "por favor" },
        "com licença": { en: "excuse me", es: "con permiso" },
        "desculpe": { en: "I'm sorry", es: "lo siento" },

        // Negócios / CES
        "reunião": { en: "meeting", es: "reunión" },
        "agenda": { en: "schedule", es: "agenda" },
        "apresentação": { en: "presentation", es: "presentación" },
        "investimento": { en: "investment", es: "inversión" },
        "parceria": { en: "partnership", es: "asociación" },
        "contrato": { en: "contract", es: "contrato" },
        "proposta": { en: "proposal", es: "propuesta" },
        "negócio": { en: "business", es: "negocio" },
        "empresa": { en: "company", es: "empresa" },
        "produto": { en: "product", es: "producto" },
        "serviço": { en: "service", es: "servicio" },
        "tecnologia": { en: "technology", es: "tecnología" },
        "startup": { en: "startup", es: "startup" },
        "inovação": { en: "innovation", es: "innovación" },
        "inteligência artificial": { en: "artificial intelligence", es: "inteligencia artificial" },
        "mercado": { en: "market", es: "mercado" },
        "cliente": { en: "client", es: "cliente" },
        "fornecedor": { en: "supplier", es: "proveedor" },
        "prazo": { en: "deadline", es: "plazo" },
        "orçamento": { en: "budget", es: "presupuesto" },
        "relatório": { en: "report", es: "informe" },
        "dados": { en: "data", es: "datos" },
        "resultado": { en: "result", es: "resultado" },
        "lucro": { en: "profit", es: "ganancia" },
        "receita": { en: "revenue", es: "ingresos" },
        "custo": { en: "cost", es: "costo" },

        // Viagem / CES Las Vegas
        "hotel": { en: "hotel", es: "hotel" },
        "aeroporto": { en: "airport", es: "aeropuerto" },
        "passagem": { en: "ticket", es: "boleto" },
        "passaporte": { en: "passport", es: "pasaporte" },
        "voo": { en: "flight", es: "vuelo" },
        "embarque": { en: "boarding", es: "embarque" },
        "bagagem": { en: "luggage", es: "equipaje" },
        "reserva": { en: "reservation", es: "reservación" },
        "check-in": { en: "check-in", es: "check-in" },
        "táxi": { en: "taxi", es: "taxi" },
        "uber": { en: "uber", es: "uber" },
        "restaurante": { en: "restaurant", es: "restaurante" },
        "cardápio": { en: "menu", es: "menú" },
        "conta": { en: "bill", es: "cuenta" },
        "gorjeta": { en: "tip", es: "propina" },
        "banheiro": { en: "restroom", es: "baño" },
        "saída": { en: "exit", es: "salida" },
        "entrada": { en: "entrance", es: "entrada" },
        "estande": { en: "booth", es: "stand" },
        "credencial": { en: "badge", es: "credencial" },
        "pavilhão": { en: "hall", es: "pabellón" },
        "exposição": { en: "exhibition", es: "exposición" },
        "demonstração": { en: "demo", es: "demostración" },

        // Urgência / Situações
        "ajuda": { en: "help", es: "ayuda" },
        "emergência": { en: "emergency", es: "emergencia" },
        "médico": { en: "doctor", es: "médico" },
        "polícia": { en: "police", es: "policía" },
        "perdido": { en: "lost", es: "perdido" },
        "perdida": { en: "lost", es: "perdida" },
        "quanto custa": { en: "how much does it cost", es: "cuánto cuesta" },
        "onde fica": { en: "where is", es: "dónde está" },
        "como chegar": { en: "how to get there", es: "cómo llegar" },
        "não entendo": { en: "I don't understand", es: "no entiendo" },
        "pode repetir": { en: "can you repeat", es: "puede repetir" },
        "fala português": { en: "do you speak portuguese", es: "habla portugués" },
        "fala inglês": { en: "do you speak english", es: "habla inglés" },
        "sim": { en: "yes", es: "sí" },
        "não": { en: "no", es: "no" },
        "talvez": { en: "maybe", es: "tal vez" },
        "espera": { en: "wait", es: "espera" },
        "rápido": { en: "fast", es: "rápido" },
        "devagar": { en: "slow", es: "despacio" },
    };

    // ── ESTADO INTERNO ──────────────────────────────────────────────
    let _recognition   = null;
    let _listening     = false;
    let _targetLang    = 'en';
    let _subscribers   = { transcript: [], translation: [], error: [], status: [] };
    let _widgetEl      = null;

    // ── PUB/SUB ─────────────────────────────────────────────────────
    function on(event, fn) {
        if (_subscribers[event]) _subscribers[event].push(fn);
    }
    function _emit(event, data) {
        (_subscribers[event] || []).forEach(fn => { try { fn(data); } catch(e) {} });
    }

    // ── TRADUÇÃO HÍBRIDA: dicionário + heurísticas ──────────────────
    function _translateText(text, langTo) {
        const lower = text.toLowerCase().trim();

        // 1. Tentativa de match exato
        if (DICT[lower] && DICT[lower][langTo]) {
            return Promise.resolve(DICT[lower][langTo]);
        }

        // 2. Substituição palavra por palavra com dicionário
        let result = lower;
        // Ordena por tamanho decrescente para matches mais longos primeiro
        const phrases = Object.keys(DICT).sort((a, b) => b.length - a.length);
        let matched = false;
        phrases.forEach(pt => {
            if (result.includes(pt) && DICT[pt][langTo]) {
                result = result.replace(new RegExp(pt, 'gi'), DICT[pt][langTo]);
                matched = true;
            }
        });

        if (matched) return Promise.resolve(result);

        // 3. Fallback: tenta MyMemory API (gratuita, sem chave)
        const langMap = { en: 'en-US', es: 'es-ES' };
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=pt-BR|${langMap[langTo] || 'en-US'}`;

        return fetch(url)
            .then(r => r.json())
            .then(data => {
                if (data.responseStatus === 200) {
                    return data.responseData.translatedText;
                }
                return `[${langTo.toUpperCase()}] ${text}`; // fallback visual
            })
            .catch(() => `[${langTo.toUpperCase()}] ${text}`);
    }

    // ── SÍNTESE DE VOZ ──────────────────────────────────────────────
    function speak(text, lang) {
        if (!window.speechSynthesis) { _emit('error', 'speechSynthesis não suportado'); return; }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang  = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang;
        utter.rate  = 0.92;
        utter.pitch = 1.0;

        // Prefere voz nativa se disponível
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith(utter.lang.slice(0,2)) && !v.localService === false)
                       || voices.find(v => v.lang.startsWith(utter.lang.slice(0,2)));
        if (preferred) utter.voice = preferred;

        window.speechSynthesis.speak(utter);
    }

    // ── RECONHECIMENTO DE VOZ ───────────────────────────────────────
    function _initRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            _emit('error', 'Reconhecimento de voz não suportado neste navegador. Use Chrome.');
            return null;
        }

        const rec = new SpeechRec();
        rec.lang          = 'pt-BR';
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.continuous    = false;

        rec.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            _emit('transcript', { text: transcript, final: isFinal });
            _updateWidget('transcript', transcript, isFinal);

            if (isFinal) {
                _updateWidget('status', 'Traduzindo...');
                _translateText(transcript, _targetLang).then(translated => {
                    _emit('translation', { original: transcript, translated, lang: _targetLang });
                    _updateWidget('translation', translated);
                    speak(translated, _targetLang);
                });
            }
        };

        rec.onerror = (e) => {
            _listening = false;
            _emit('error', e.error);
            _updateWidget('status', `Erro: ${e.error}`);
            _updateToggleBtn(false);
        };

        rec.onend = () => {
            _listening = false;
            _updateWidget('status', 'Pronto');
            _updateToggleBtn(false);
        };

        return rec;
    }

    // ── CONTROLE ────────────────────────────────────────────────────
    function startListening() {
        if (_listening) return;
        if (!_recognition) _recognition = _initRecognition();
        if (!_recognition) return;
        try {
            _recognition.start();
            _listening = true;
            _emit('status', 'listening');
            _updateWidget('status', 'Ouvindo...');
            _updateToggleBtn(true);
        } catch(e) {
            _emit('error', e.message);
        }
    }

    function stopListening() {
        if (!_listening || !_recognition) return;
        _recognition.stop();
        _listening = false;
        _updateToggleBtn(false);
    }

    function toggleListening() {
        _listening ? stopListening() : startListening();
    }

    function setTargetLang(lang) {
        _targetLang = lang;
        if (_widgetEl) {
            _widgetEl.querySelectorAll('.babel-lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });
        }
    }

    // ── API PÚBLICA: translate ──────────────────────────────────────
    function translate(text, langTo) {
        return _translateText(text, langTo || _targetLang);
    }

    // ── WIDGET UI ───────────────────────────────────────────────────
    const WIDGET_CSS = `
        .nexia-babel-widget {
            font-family: 'Sora', 'Segoe UI', sans-serif;
            background: #0C1018;
            border: 1px solid #1C2840;
            border-radius: 16px;
            padding: 20px;
            max-width: 440px;
            width: 100%;
            color: #C4D4EE;
            box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,255,0.05) inset;
            position: relative;
            overflow: hidden;
        }
        .nexia-babel-widget::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent);
        }
        .babel-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
        }
        .babel-gem {
            width: 32px; height: 32px;
            background: linear-gradient(135deg, #1a1a2e, #00E5FF);
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
            box-shadow: 0 0 16px rgba(0,229,255,0.3);
        }
        .babel-title {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #00E5FF;
        }
        .babel-subtitle {
            font-size: 10px;
            color: #3F5070;
            letter-spacing: 0.08em;
        }
        .babel-langs {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }
        .babel-lang-lbl {
            font-size: 10px;
            color: #3F5070;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .babel-lang-btn {
            background: #111520;
            border: 1px solid #1C2840;
            color: #7A90B8;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            letter-spacing: 0.05em;
        }
        .babel-lang-btn:hover {
            border-color: #253555;
            color: #C4D4EE;
        }
        .babel-lang-btn.active {
            background: rgba(0,229,255,0.12);
            border-color: rgba(0,229,255,0.4);
            color: #00E5FF;
            box-shadow: 0 0 10px rgba(0,229,255,0.1);
        }
        .babel-display {
            background: #07090D;
            border: 1px solid #1C2840;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 14px;
            min-height: 80px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .babel-display-row {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .babel-display-lbl {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #3F5070;
        }
        .babel-display-text {
            font-size: 14px;
            color: #C4D4EE;
            min-height: 20px;
            transition: all 0.2s ease;
        }
        .babel-display-divider {
            height: 1px;
            background: #1C2840;
            margin: 4px 0;
        }
        .babel-display-translated {
            font-size: 14px;
            color: #00E5FF;
            min-height: 20px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        .babel-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .babel-mic-btn {
            width: 48px; height: 48px;
            border-radius: 50%;
            background: rgba(0,229,255,0.1);
            border: 1.5px solid rgba(0,229,255,0.35);
            color: #00E5FF;
            font-size: 20px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all 0.25s ease;
            flex-shrink: 0;
            position: relative;
        }
        .babel-mic-btn:hover {
            background: rgba(0,229,255,0.18);
            border-color: #00E5FF;
            box-shadow: 0 0 20px rgba(0,229,255,0.25);
        }
        .babel-mic-btn.listening {
            background: rgba(255,61,113,0.15);
            border-color: rgba(255,61,113,0.6);
            color: #FF3D71;
            animation: babelPulse 1.2s ease-in-out infinite;
        }
        @keyframes babelPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,61,113,0.4); }
            50%       { box-shadow: 0 0 0 8px rgba(255,61,113,0); }
        }
        .babel-status {
            font-size: 11px;
            color: #3F5070;
            letter-spacing: 0.05em;
            flex: 1;
        }
        .babel-status.active { color: #00E5FF; }
        .babel-speak-btn {
            background: #111520;
            border: 1px solid #1C2840;
            color: #7A90B8;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            letter-spacing: 0.05em;
        }
        .babel-speak-btn:hover {
            border-color: rgba(0,229,255,0.3);
            color: #00E5FF;
        }
        .babel-footer {
            margin-top: 12px;
            font-size: 9px;
            color: #253555;
            text-align: center;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
    `;

    function _injectCSS() {
        if (document.getElementById('nexia-babel-css')) return;
        const style = document.createElement('style');
        style.id = 'nexia-babel-css';
        style.textContent = WIDGET_CSS;
        document.head.appendChild(style);
    }

    function _buildWidget() {
        const el = document.createElement('div');
        el.className = 'nexia-babel-widget';
        el.innerHTML = `
            <div class="babel-header">
                <div class="babel-gem">🌐</div>
                <div>
                    <div class="babel-title">NEXIA BABEL</div>
                    <div class="babel-subtitle">Tradução Simultânea · PT → EN / ES</div>
                </div>
            </div>

            <div class="babel-langs">
                <span class="babel-lang-lbl">Traduzir para:</span>
                <button class="babel-lang-btn active" data-lang="en">EN</button>
                <button class="babel-lang-btn" data-lang="es">ES</button>
            </div>

            <div class="babel-display">
                <div class="babel-display-row">
                    <div class="babel-display-lbl">PT — Você disse</div>
                    <div class="babel-display-text" id="babel-transcript">—</div>
                </div>
                <div class="babel-display-divider"></div>
                <div class="babel-display-row">
                    <div class="babel-display-lbl" id="babel-lang-label">EN — Tradução</div>
                    <div class="babel-display-translated" id="babel-translated">—</div>
                </div>
            </div>

            <div class="babel-controls">
                <button class="babel-mic-btn" id="babel-mic-btn" title="Falar (PT-BR)">
                    🎤
                </button>
                <div class="babel-status" id="babel-status">Clique no microfone para falar</div>
                <button class="babel-speak-btn" id="babel-speak-btn" title="Repetir tradução">
                    🔊 Repetir
                </button>
            </div>

            <div class="babel-footer">NEXIA OS — Powered by WebSpeech API + MyMemory</div>
        `;
        return el;
    }

    function _updateWidget(type, text, isFinal) {
        if (!_widgetEl) return;
        if (type === 'transcript') {
            const el = _widgetEl.querySelector('#babel-transcript');
            if (el) {
                el.textContent = text || '—';
                el.style.opacity = isFinal ? '1' : '0.6';
            }
        }
        if (type === 'translation') {
            const el = _widgetEl.querySelector('#babel-translated');
            if (el) { el.textContent = text || '—'; el.style.opacity = '1'; }
        }
        if (type === 'status') {
            const el = _widgetEl.querySelector('#babel-status');
            if (el) {
                el.textContent = text;
                el.className = 'babel-status' + (text !== 'Pronto' && text !== 'Clique no microfone para falar' ? ' active' : '');
            }
        }
    }

    function _updateToggleBtn(isListening) {
        if (!_widgetEl) return;
        const btn = _widgetEl.querySelector('#babel-mic-btn');
        if (!btn) return;
        btn.className = 'babel-mic-btn' + (isListening ? ' listening' : '');
        btn.innerHTML = isListening ? '⏹' : '🎤';
        btn.title     = isListening ? 'Parar' : 'Falar (PT-BR)';
    }

    function _bindWidgetEvents() {
        // Mic toggle
        _widgetEl.querySelector('#babel-mic-btn').addEventListener('click', toggleListening);

        // Lang buttons
        _widgetEl.querySelectorAll('.babel-lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTargetLang(btn.dataset.lang);
                const lbl = _widgetEl.querySelector('#babel-lang-label');
                if (lbl) lbl.textContent = `${btn.dataset.lang.toUpperCase()} — Tradução`;
            });
        });

        // Speak button
        _widgetEl.querySelector('#babel-speak-btn').addEventListener('click', () => {
            const translated = _widgetEl.querySelector('#babel-translated')?.textContent;
            if (translated && translated !== '—') speak(translated, _targetLang);
        });
    }

    // ── MOUNT ───────────────────────────────────────────────────────
    function mount(selectorOrEl, options = {}) {
        _injectCSS();
        const container = typeof selectorOrEl === 'string'
            ? document.querySelector(selectorOrEl)
            : selectorOrEl;
        if (!container) { console.error('[NexiaBabel] Container não encontrado:', selectorOrEl); return; }

        if (options.lang) _targetLang = options.lang;

        _widgetEl = _buildWidget();
        container.appendChild(_widgetEl);
        _bindWidgetEvents();

        // Pré-carrega vozes
        window.speechSynthesis?.getVoices();
        window.speechSynthesis?.addEventListener?.('voiceschanged', () => {});

        _recognition = _initRecognition();
        console.log('[NexiaBabel] Widget montado em', container);
        return _widgetEl;
    }

    // ── INIT SEM UI ─────────────────────────────────────────────────
    function init(options = {}) {
        if (options.lang) _targetLang = options.lang;
        _recognition = _initRecognition();
        window.speechSynthesis?.getVoices();
        console.log('[NexiaBabel] Inicializado (headless)');
    }

    // ── EXPORT ──────────────────────────────────────────────────────
    return { mount, init, on, speak, translate, startListening, stopListening, toggleListening, setTargetLang };

})();

// Auto-mount se existir elemento com id="nexia-babel"
document.addEventListener('DOMContentLoaded', () => {
    const auto = document.getElementById('nexia-babel');
    if (auto) NexiaBabel.mount(auto);
});