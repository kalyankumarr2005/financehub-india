/**
 * FinanceHub India — Interactive JavaScript
 * Features: Dark/Light mode, reading progress, TOC highlight,
 * hamburger menu, search, scroll-to-top, share, animations
 */

'use strict';

/* ===== UTILITY: DOM selectors ===== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ===== READING PROGRESS BAR ===== */
function initProgressBar() {
  const bar = $('#progressBar');
  if (!bar) return;

  function update() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const progress = Math.min(100, (window.scrollY / docHeight) * 100);
    bar.style.width = progress + '%';
    bar.setAttribute('aria-valuenow', Math.round(progress));
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ===== READING TIME ESTIMATE ===== */
function initReadingTime() {
  const article = $('#articleBody');
  const display = $('#readingTime');
  if (!article || !display) return;

  const wordCount = (article.innerText || '').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 220));
  display.textContent = `${minutes} min read`;
}

/* ===== DARK / LIGHT MODE TOGGLE ===== */
function initThemeToggle() {
  const toggle = $('#themeToggle');
  const html = document.documentElement;
  if (!toggle) return;

  // Restore saved preference
  const saved = localStorage.getItem('fh-theme') || 'light';
  setTheme(saved, false);

  toggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
  });

  function setTheme(theme, save) {
    html.setAttribute('data-theme', theme);
    document.body.className = theme + '-mode';
    const icon = toggle.querySelector('.theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    if (save) localStorage.setItem('fh-theme', theme);
  }
}

/* ===== HAMBURGER MOBILE MENU ===== */
function initMobileMenu() {
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close on nav link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ===== SEARCH TOGGLE ===== */
function initSearch() {
  const toggle = $('#searchToggle');
  const bar = $('#searchBar');
  const close = $('#searchClose');
  const input = $('#searchInput');
  if (!toggle || !bar) return;

  toggle.addEventListener('click', () => {
    const isOpen = bar.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    bar.setAttribute('aria-hidden', !isOpen);
    if (isOpen && input) input.focus();
  });

  if (close) {
    close.addEventListener('click', () => {
      bar.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      bar.setAttribute('aria-hidden', 'true');
      toggle.focus();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bar.classList.contains('open')) {
      bar.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      bar.setAttribute('aria-hidden', 'true');
    }
  });
}

/* ===== SCROLL TO TOP ===== */
function initScrollTop() {
  const btn = $('#scrollTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ===== TABLE OF CONTENTS — ACTIVE SECTION ===== */
function initTOC() {
  const tocLinks = $$('.toc-link');
  const sections = $$('.article-section');
  if (!tocLinks.length || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tocLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(section => observer.observe(section));
}

/* ===== FADE-IN ON SCROLL ===== */
function initFadeIn() {
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.fade-in').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  $$('.fade-in').forEach(el => observer.observe(el));
}

/* ===== COPY LINK ===== */
function initCopyLink() {
  const btn = $('#copyLink');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!');
    } catch {
      // Fallback for unsupported browsers
      const el = document.createElement('input');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('Link copied!');
    }
  });
}

/* ===== TOAST NOTIFICATION ===== */
function showToast(msg, duration = 2500) {
  const toast = $('#toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('visible');
  toast.setAttribute('aria-hidden', 'false');

  setTimeout(() => {
    toast.classList.remove('visible');
    toast.setAttribute('aria-hidden', 'true');
  }, duration);
}

/* ===== NEWSLETTER FORM HANDLER ===== */
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="email"]');
  if (input && input.value) {
    showToast('✅ Subscribed! Daily market alerts on the way.');
    input.value = '';
  }
}

// Expose to HTML inline handlers
window.handleNewsletterSubmit = handleNewsletterSubmit;

/* ===== STICKY HEADER SHADOW ===== */
function initStickyHeader() {
  const header = $('#siteHeader');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(0,0,0,0.12)'
      : '0 1px 4px rgba(0,0,0,0.06)';
  }, { passive: true });
}

/* ===== LAZY LOAD IMAGES ===== */
function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) {
    $$('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            observer.unobserve(img);
          }
        }
      });
    });
    $$('img[data-src]').forEach(img => observer.observe(img));
  }
}

/* ===== KEYBOARD ACCESSIBILITY: skip to main ===== */
function initSkipLink() {
  // Ensure main content is focusable for skip links
  const main = $('#main-content');
  if (main && !main.hasAttribute('tabindex')) {
    main.setAttribute('tabindex', '-1');
  }
}

/* ===== INIT ALL ===== */
document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initReadingTime();
  initThemeToggle();
  initMobileMenu();
  initSearch();
  initScrollTop();
  initTOC();
  initFadeIn();
  initCopyLink();
  initStickyHeader();
  initLazyImages();
  initSkipLink();
});
