/* Helpers */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

/* Menu hamburger */
(() => {
  const burger = $('.hamburger');
  const menu = $('.nav-menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    menu.classList.toggle('active');
  });

  $$('.nav-link', menu).forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      menu.classList.remove('active');
    });
  });
})();

/* Scroll fluide sur ancres internes */
(() => {
  const anchors = $$('a[href^="#"]');
  anchors.forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length <= 1) return;
      const target = $(id);
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 60, behavior: 'smooth' });
      }
    });
  });
})();

/* Animation d’apparition des sections */
(() => {
  const sections = $$('.section');
  if (!sections.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  sections.forEach(sec => io.observe(sec));
})();

/* Mise à jour du lien actif dans la nav (robuste) */
(() => {
  const links = $$('.nav-link[href^="#"]');
  const targets = links
    .map(l => l.getAttribute('href'))
    .filter(Boolean)
    .map(href => $(href))
    .filter(Boolean);

  if (!links.length || !targets.length) return;

  const idToLink = new Map(links.map(l => [l.getAttribute('href'), l]));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const id = '#' + e.target.id;
      const link = idToLink.get(id);
      if (!link) return;
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { root: null, rootMargin: '-45% 0px -50% 0px', threshold: 0.01 });

  targets.forEach(t => io.observe(t));
})();

/* Effet machine à écrire (optionnel, sécurisé) */
(() => {
  const heroTitle = $('.hero-title');
  if (!heroTitle) return;

  const text = heroTitle.textContent;
  heroTitle.textContent = '';
  let i = 0;
  const speed = 35;

  const tick = () => {
    if (i < text.length) {
      heroTitle.textContent += text.charAt(i++);
      setTimeout(tick, speed);
    }
  };
  window.addEventListener('load', tick, { once: true });
})();

/* Formulaire contact (POST -> /api/contact) */
(() => {
  const form = document.getElementById('contact-form') || document.querySelector('.contact-form');
  if (!form) return;
  const statusEl = document.getElementById('contact-status');

  function setStatus(msg, ok=true) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = ok ? '#1ea672' : '#ff7e5f';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const subject = document.getElementById('subject')?.value.trim() || 'Contact';
    const message = document.getElementById('message')?.value.trim();
    const honeypot = document.getElementById('company')?.value.trim();

    if (honeypot) return; // bot

    if (!name || !email || !message) {
      setStatus('Veuillez remplir tous les champs requis.', false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('Adresse email invalide.', false);
      return;
    }

    setStatus('Envoi en cours...', true);

    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok) {
        const msg = (data && data.error) ? data.error : `Erreur serveur (${resp.status})`;
        throw new Error(msg);
      }

      setStatus('Message envoyé. Un accusé de réception a été envoyé par email.');
      form.reset();
    } catch (err) {
      setStatus(err.message || 'Échec de l’envoi. Réessayez plus tard.', false);
    }
  });
})();


/* Lightbox simple pour la galerie CESAM */
(() => {
  const imgs = $$('.gallery .zoomable, .gallery img');
  if (!imgs.length) return;

  function openLightbox(src, alt='') {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.85);
      display:flex;align-items:center;justify-content:center;z-index:9999;cursor:zoom-out`;
    const img = document.createElement('img');
    img.src = src; img.alt = alt;
    img.style.cssText = 'max-width:92vw;max-height:92vh;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.45)';
    overlay.appendChild(img);
    overlay.addEventListener('click', () => overlay.remove());
    document.addEventListener('keydown', function esc(e){
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });
    document.body.appendChild(overlay);
  }

  imgs.forEach(i => i.addEventListener('click', () => openLightbox(i.src, i.alt || '')));
})();

/* FAQ IA -> /ask */
(() => {
  // Aligne les IDs avec ton HTML actuel
  const form = $('#faq-form') || $('#ai-faq-form');
  const input = $('#faq-question') || $('#ai-question');
  const output = $('#faq-answer') || $('#ai-answer');
  const submitBtn = $('#faq-submit') || $('#ai-submit');

  if (!form || !input || !output) return;

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Envoi...' : 'Envoyer';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = (input.value || '').trim();
    if (!question) return;

    setLoading(true);
    output.innerHTML = '<p><em>Le bot réfléchit…</em></p>';

    try {
      const resp = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      // Tente de parser le JSON; sinon, message brut
      let data = null;
      try { data = await resp.json(); } catch { /* ignore */ }

      if (!resp.ok) {
        const msg = (data && data.error) ? data.error : `Erreur serveur (${resp.status})`;
        throw new Error(msg);
      }

      output.innerHTML = `<p>${(data && data.answer) ? data.answer : ''}</p>`;
    } catch (err) {
      output.innerHTML = `<p style="color:#ff7e5f;">${err.message || 'Erreur inconnue'}</p>`;
    } finally {
      setLoading(false);
      input.value = '';
      input.focus();
    }
  });
})();
