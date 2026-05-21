/**
 * ═══════════════════════════════════════════════════════════════════
 * NEXIA OS — COMMS ENGINE v2.0
 * Tawk.to (Chat/PABX) + EmailJS (E-mail real)
 * E-Signature: dispara e-mail real quando documento é assinado
 * ═══════════════════════════════════════════════════════════════════
 */

const NEXIA_COMMS = (() => {

  const CONFIG = {
    tawkto: { scriptUrl: 'https://embed.tawk.to/69aaefb1ddd7fc1c34851b48/1jj1rgjuc' },
    emailjs: {
      publicKey:  'N0G12DzCaqfDNl',
      serviceId:  'service_gmail',
      templateId: 'template_f5mhqqa',
      // Template para E-Signature:
      signatureTemplateId: 'template_esign_notif'
    }
  };

  let _emailjsReady = false;

  /* ── TAWK.TO ──────────────────────────────────────────────────── */
  function initTawkto() {
    if (window.Tawk_API) { _log('Tawk.to já ativo', 'warn'); return; }
    window.Tawk_API  = window.Tawk_API  || {};
    window.Tawk_LoadStart = new Date();
    var s = document.createElement('script');
    s.async = true;
    s.src   = CONFIG.tawkto.scriptUrl;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);
    _log('Tawk.to carregando…', 'info');
  }

  /* ── EMAILJS ──────────────────────────────────────────────────── */
  function initEmailJS(cb) {
    if (typeof emailjs !== 'undefined') {
      emailjs.init(CONFIG.emailjs.publicKey);
      _emailjsReady = true;
      _log('EmailJS já presente', 'ok');
      if (cb) cb();
      return;
    }
    var s  = document.createElement('script');
    s.src  = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = function() {
      emailjs.init(CONFIG.emailjs.publicKey);
      _emailjsReady = true;
      _log('EmailJS carregado', 'ok');
      if (cb) cb();
    };
    s.onerror = function() { _log('Falha ao carregar EmailJS', 'err'); };
    document.head.appendChild(s);
  }

  /**
   * sendEmail(to, subject, message, extraParams)
   * Dispara e-mail real via EmailJS.
   * Retorna Promise<boolean>.
   */
  async function sendEmail(to, subject, message, extraParams) {
    if (!_emailjsReady) {
      return new Promise((resolve) => {
        initEmailJS(() => sendEmail(to, subject, message, extraParams).then(resolve));
      });
    }
    try {
      await emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, {
        to_email: to,
        subject:  subject,
        message:  message,
        ...extraParams
      });
      _log(`E-mail enviado → ${to}`, 'ok');
      return true;
    } catch (e) {
      _log(`Falha no e-mail: ${e.text || e.message}`, 'err');
      return false;
    }
  }

  /**
   * notifyESignature({ signerEmail, signerName, docTitle, docUrl, requesterName, tenantId })
   * Chamado pelo módulo E-Signature quando um documento é criado/assinado.
   * Dispara e-mail real para o signatário.
   */
  async function notifyESignature({ signerEmail, signerName, docTitle, docUrl, requesterName, tenantId, action }) {
    if (!_emailjsReady) {
      await new Promise(r => initEmailJS(r));
    }

    const isRequest = action !== 'signed';
    const subject   = isRequest
      ? `📝 Assinatura Solicitada: ${docTitle}`
      : `✅ Documento Assinado: ${docTitle}`;
    const message   = isRequest
      ? `Olá ${signerName || 'prezado(a)'},\n\n${requesterName || 'NEXIA OS'} solicita sua assinatura no documento "${docTitle}".\n\nAcesse o link abaixo para assinar:\n${docUrl}\n\n— NEXIA OS · E-Signature`
      : `Olá ${signerName || 'prezado(a)'},\n\nO documento "${docTitle}" foi assinado com sucesso.\n\nID do documento: ${docUrl}\n\n— NEXIA OS · E-Signature`;

    try {
      const templateId = CONFIG.emailjs.signatureTemplateId || CONFIG.emailjs.templateId;
      await emailjs.send(CONFIG.emailjs.serviceId, templateId, {
        to_email:       signerEmail,
        to_name:        signerName    || 'Signatário',
        from_name:      requesterName || 'NEXIA OS',
        subject,
        message,
        doc_title:      docTitle,
        doc_url:        docUrl        || '#',
        tenant_id:      tenantId      || '',
        action_label:   isRequest ? 'Assinar Documento' : 'Ver Documento Assinado',
      });
      _log(`E-Sign notificação → ${signerEmail} (${action})`, 'ok');
      // Registra no Firestore (audit trail)
      _recordAudit(tenantId, signerEmail, docTitle, action);
      return true;
    } catch (e) {
      _log(`Falha E-Sign e-mail: ${e.text || e.message}`, 'err');
      return false;
    }
  }

  async function _recordAudit(tenantId, signerEmail, docTitle, action) {
    if (!tenantId || typeof firebase === 'undefined' || !firebase.apps.length) return;
    try {
      await firebase.firestore()
        .collection('tenants').doc(tenantId)
        .collection('esign_audit').add({
          signerEmail,
          docTitle,
          action,
          ts: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (e) {}
  }

  function _log(msg, type = 'info') {
    const c = { info: '#00E5FF', ok: '#00E87A', warn: '#FFB020', err: '#FF3D71' };
    if (typeof NEXIA !== 'undefined' && NEXIA.log) {
      NEXIA.log(`[Comms] ${msg}`, type);
    } else {
      console.log(`%c[Comms] ${msg}`, `color:${c[type] || c.info};font-weight:bold`);
    }
  }

  function init() {
    initEmailJS();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTawkto);
    } else {
      initTawkto();
    }
    _log('COMMS ENGINE v2.0 online', 'ok');
  }

  return { init, sendEmail, notifyESignature, initEmailJS, initTawkto };
})();

// Auto-init
NEXIA_COMMS.init();

// ── NexiaComms alias (matches new API used by admins) ──────────────
window.NexiaComms = {
  onContractSigned: async function(contract) {
    return NEXIA_COMMS.notifyESignature({
      signerEmail:   contract.signerEmail || 'noreply@nexia.os',
      signerName:    contract.signerName,
      docTitle:      contract.contractType + ' — ' + contract.contractId,
      docUrl:        '#',
      requesterName: contract.signedBy,
      tenantId:      contract.tenantId || 'VP_AGENCIA_01',
      action:        'signed',
    });
  },
  sendEmail: NEXIA_COMMS.sendEmail.bind(NEXIA_COMMS),
};
