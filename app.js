function initApp() {
  
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz5n5-RrzdaNefnWm7l-kUMR2mP9VpkECkamka0yagbAZUOJPDva6yboNIJus8Gklft/exec";
  
  // ==========================================================================
  // 1. Floating Gold Dust Particle Engine
  // ==========================================================================
  const canvas = document.getElementById('canvas-particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      let particles = [];
      const particleCount = 45;
      
      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      
      class Particle {
        constructor() {
          this.reset();
          this.y = Math.random() * canvas.height;
        }
        
        reset() {
          this.x = Math.random() * canvas.width;
          this.y = -15;
          this.size = Math.random() * 3.5 + 1.2;
          this.speedY = Math.random() * 0.45 + 0.2;
          this.speedX = Math.random() * 0.3 - 0.15;
          this.opacity = Math.random() * 0.6 + 0.2;
          this.wobble = Math.random() * Math.PI * 2;
          this.wobbleSpeed = Math.random() * 0.02 + 0.005;
          this.rotation = Math.random() * Math.PI * 2;
          this.rotSpeed = (Math.random() - 0.5) * 0.025;
          
          const rnd = Math.random();
          if (rnd < 0.4) this.type = 'gold';
          else if (rnd < 0.75) this.type = 'pearl';
          else this.type = 'petal';
        }
        
        update() {
          this.y += this.speedY;
          this.wobble += this.wobbleSpeed;
          this.x += this.speedX + Math.sin(this.wobble) * 0.3;
          this.rotation += this.rotSpeed;
          
          if (this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) {
            this.reset();
          }
        }
        
        draw() {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation);

          if (this.type === 'petal') {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 1.5, this.size * 0.75, Math.PI / 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(253, 244, 235, ${this.opacity * 0.75})`;
            ctx.shadowBlur = this.size * 1.5;
            ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
            ctx.fill();
          } else if (this.type === 'pearl') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.7})`;
            ctx.shadowBlur = this.size * 1.5;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
            ctx.shadowBlur = this.size * 1.5;
            ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
            ctx.fill();
          }

          ctx.restore();
        }
      }
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
      
      function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 0;
        particles.forEach(p => {
          p.update();
          p.draw();
        });
        requestAnimationFrame(animateParticles);
      }
      
      animateParticles();
    }
  }

  // ==========================================================================
  // 2. DOM Elements & State
  // ==========================================================================
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const envelope = document.getElementById('envelope');
  const waxSealBtn = document.getElementById('wax-seal-btn');
  const mainContent = document.getElementById('main-content');
  
  const musicToggle = document.getElementById('music-toggle');
  const musicIcon = document.getElementById('music-icon');
  const bgMusic = document.getElementById('bg-music');
  
  const openMapBtn = document.getElementById('open-map-btn');
  const mapModal = document.getElementById('map-modal');
  const mapCloseBtn = document.getElementById('map-close-btn');
  
  const rsvpModal = document.getElementById('rsvp-modal');
  const rsvpCloseBtn = document.getElementById('rsvp-close-btn');

  const messagesModal = document.getElementById('messages-modal');
  const messagesCloseBtn = document.getElementById('messages-close-btn');
  const deckMessagesBtn = document.getElementById('deck-messages-btn');
  const openMessagesWallBtn = document.getElementById('open-messages-wall-btn');
  
  const deckRsvpBtn = document.getElementById('deck-rsvp-btn');
  const deckMapBtn = document.getElementById('deck-map-btn');
  const deckEnterBtn = document.getElementById('deck-enter-btn');
  
  let isPlaying = false;
  let activeGuest = null;
  let publicMap = null;
  let fetchedEvents = [];
  let nextEventTargetDate = null;

  // Robust Date Parser supporting ISO & French date badges
  function parseEventDate(evt) {
    if (!evt) return new Date();
    
    if (evt.datetime) {
      const parsedISO = new Date(evt.datetime);
      if (!isNaN(parsedISO.getTime())) {
        return parsedISO;
      }
    }

    const dateStr = (evt.dateBadge || '').toLowerCase();
    const timeStr = (evt.time || '19h00').toLowerCase();

    const monthsMap = {
      janvier: 0, janv: 0,
      février: 1, fevrier: 1, fevr: 1,
      mars: 2,
      avril: 3, avr: 3,
      mai: 4,
      juin: 5,
      juillet: 6, juil: 6,
      août: 7, aout: 7,
      septembre: 8, sept: 8,
      octobre: 9, oct: 9,
      novembre: 10, nov: 10,
      décembre: 11, decembre: 11, dec: 11
    };

    const dayMatch = dateStr.match(/\b(\d{1,2})\b/);
    const yearMatch = dateStr.match(/\b(20\d{2})\b/);

    let monthIndex = 6;
    for (const [mName, mIdx] of Object.entries(monthsMap)) {
      if (dateStr.includes(mName)) {
        monthIndex = mIdx;
        break;
      }
    }

    const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;

    let hours = 19;
    let minutes = 0;
    const timeMatch = timeStr.match(/(\d{1,2})[h:]?(\d{2})?/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      if (timeMatch[2]) minutes = parseInt(timeMatch[2], 10);
    }

    return new Date(year, monthIndex, day, hours, minutes, 0);
  }

  // ==========================================================================
  // 3. Serpentine Dotted-Path Story Roadmap Engine
  // ==========================================================================
  function fetchAndRenderEvents() {
    fetch('/api/events')
      .then(res => res.json())
      .then(events => {
        fetchedEvents = events || [];
        renderSerpentineRoadmap(fetchedEvents);
        renderVenuesGrid(fetchedEvents);
        initOrUpdatePublicMap();
      })
      .catch(err => {
        console.error("Error loading events:", err);
      });
  }

  function renderSerpentineRoadmap(events) {
    const flowContainer = document.getElementById('serpentine-roadmap-flow');
    if (!flowContainer) return;

    if (!events || events.length === 0) {
      flowContainer.innerHTML = '<p style="text-align:center; padding:2rem; color:#777;">Aucun événement n\'a encore été programmé.</p>';
      return;
    }

    const now = new Date();
    const sorted = [...events].sort((a, b) => parseEventDate(a) - parseEventDate(b));

    let nextEventIndex = sorted.findIndex(e => parseEventDate(e) >= now);
    if (nextEventIndex === -1 && sorted.length > 0) {
      nextEventIndex = sorted.length - 1;
    }

    const nextEvent = sorted[nextEventIndex];
    if (nextEvent) {
      nextEventTargetDate = parseEventDate(nextEvent).getTime();
      const bannerTitle = document.getElementById('upcoming-event-name-only');
      if (bannerTitle) {
        bannerTitle.textContent = `PROCHAIN ÉVÉNEMENT : ${nextEvent.title.toUpperCase()}`;
      }
    }

    flowContainer.innerHTML = '';

    sorted.forEach((evt, idx) => {
      const evtDate = parseEventDate(evt);
      const isPast = evtDate < now && idx < nextEventIndex;
      const isNext = idx === nextEventIndex;

      let statusBadge = '';
      let statusClass = '';
      let doodleIcon = evt.icon || 'favorite';

      if (isPast) {
        statusClass = 'flow-past';
        statusBadge = '<span class="polaroid-status-badge status-checked-badge"><span class="material-symbols-outlined">check_circle</span> Terminé</span>';
      } else if (isNext) {
        statusClass = 'flow-next';
        statusBadge = '<span class="polaroid-status-badge status-next-badge"><span class="material-symbols-outlined pulse-heart">star</span> Prochain Événement</span>';
      } else {
        statusClass = 'flow-future';
        statusBadge = '<span class="polaroid-status-badge status-future-badge"><span class="material-symbols-outlined">radio_button_unchecked</span> À venir</span>';
      }

      const isEven = idx % 2 === 0;
      const cardDiv = document.createElement('div');
      cardDiv.className = `serpentine-item ${isEven ? 'flow-left' : 'flow-right'} ${statusClass}`;

      cardDiv.innerHTML = `
        <div class="polaroid-frame-wrapper" id="polaroid-wrapper-${evt.id}">
          <div class="polaroid-tape-top"></div>
          <div class="polaroid-frame clickable-polaroid" onclick="togglePolaroidDetails('${evt.id}')">
            <div class="polaroid-top-meta">
              <span class="doodle-icon material-symbols-outlined">${doodleIcon}</span>
              ${statusBadge}
            </div>
            
            <h3 class="polaroid-handwriting-title">${escapeHtml(evt.title)}</h3>
            
            <div class="click-more-hint">
              <span>Voir les détails</span>
              <span class="material-symbols-outlined expand-chevron-icon" id="chevron-${evt.id}">expand_more</span>
            </div>

            <div class="polaroid-expandable-details hidden" id="details-${evt.id}">
              <div class="polaroid-details-divider"></div>
              <p class="polaroid-date-tag">${escapeHtml(evt.dateBadge)} à ${escapeHtml(evt.time)}</p>
              <p class="polaroid-location">
                <span class="material-symbols-outlined">location_on</span> ${escapeHtml(evt.locationName)}
              </p>
              ${evt.address ? `<p class="polaroid-address-sub">${escapeHtml(evt.address)}</p>` : ''}
              ${evt.description ? `<p class="polaroid-description">"${escapeHtml(evt.description)}"</p>` : ''}
              <div class="polaroid-footer-action">
                <a href="${evt.googleMapsUrl || '#'}" target="_blank" rel="noopener" class="btn-luxury btn-gold-outline btn-xs" onclick="event.stopPropagation();">
                  <span class="material-symbols-outlined">navigation</span> Carte & Itinéraire
                </a>
              </div>
            </div>
          </div>
        </div>
        ${idx < sorted.length - 1 ? `
          <div class="dashed-arrow-connector ${isEven ? 'connector-to-right' : 'connector-to-left'}">
            <svg class="dotted-arrow-svg" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
              <path d="${isEven ? 'M 10 10 Q 50 45 90 40' : 'M 90 10 Q 50 45 10 40'}" fill="none" stroke="#c6a77b" stroke-width="2.5" stroke-dasharray="6 6" />
              <polygon points="${isEven ? '86,35 96,40 88,45' : '14,35 4,40 12,45'}" fill="#c6a77b" />
            </svg>
          </div>
        ` : `
          <div class="timeline-end-heart">
            <span class="handwritten-end-text">Pour Toujours...</span>
            <span class="material-symbols-outlined text-gold">favorite</span>
          </div>
        `}
      `;

      flowContainer.appendChild(cardDiv);
    });

    updateRoadmapCountdown();
  }

  window.togglePolaroidDetails = function(evtId) {
    const detailsEl = document.getElementById(`details-${evtId}`);
    const chevronEl = document.getElementById(`chevron-${evtId}`);
    
    if (detailsEl) {
      const isHidden = detailsEl.classList.contains('hidden');
      if (isHidden) {
        detailsEl.classList.remove('hidden');
        if (chevronEl) chevronEl.style.transform = 'rotate(180deg)';
      } else {
        detailsEl.classList.add('hidden');
        if (chevronEl) chevronEl.style.transform = 'rotate(0deg)';
      }
    }
  };

  function renderVenuesGrid(events) {
    const grids = [document.getElementById('map-venues-grid'), document.getElementById('inline-venues-grid')];
    grids.forEach(grid => {
      if (!grid) return;
      grid.innerHTML = '';
      events.forEach(evt => {
        const card = document.createElement('div');
        card.className = 'map-venue-card';
        card.innerHTML = `
          <div class="venue-card-header">
            <span class="night-badge ${evt.isGold ? 'gold-badge' : ''}">${escapeHtml(evt.dateBadge)} - ${escapeHtml(evt.time)}</span>
            <h4>${escapeHtml(evt.title)}</h4>
          </div>
          <p class="venue-address">
            <span class="material-symbols-outlined">location_on</span> ${escapeHtml(evt.locationName)} ${evt.address ? `(${escapeHtml(evt.address)})` : ''}
          </p>
          <a href="${evt.googleMapsUrl || '#'}" target="_blank" rel="noopener" class="btn-luxury btn-gold modal-map-btn">
            <span class="material-symbols-outlined">navigation</span> Ouvre Google Maps
          </a>
        `;
        grid.appendChild(card);
      });
    });
  }

  let inlineMap = null;

  function initOrUpdatePublicMap() {
    if (typeof L === 'undefined') return;

    // 1. Modal Map
    const mapContainer = document.getElementById('public-map');
    if (mapContainer) {
      if (!publicMap) {
        publicMap = L.map('public-map').setView([34.747, 10.760], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap', subdomains: 'abcd', maxZoom: 19
        }).addTo(publicMap);
      } else {
        publicMap.invalidateSize();
      }
    }

    // 2. Inline Embedded Map
    const inlineContainer = document.getElementById('inline-map');
    if (inlineContainer) {
      if (!inlineMap) {
        inlineMap = L.map('inline-map').setView([34.747, 10.760], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap', subdomains: 'abcd', maxZoom: 19
        }).addTo(inlineMap);
      } else {
        inlineMap.invalidateSize();
      }
    }

    const goldIcon = L.divIcon({
      className: 'custom-gold-marker',
      html: `<div style="background-color: #d4af37; border: 2px solid #ffffff; width: 26px; height: 26px; border-radius: 50%; box-shadow: 0 0 12px rgba(212,175,55,0.8); display: flex; align-items: center; justify-content: center;"><span class="material-symbols-outlined" style="font-size: 15px; color: #fff;">favorite</span></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    [publicMap, inlineMap].forEach(m => {
      if (!m) return;
      m.eachLayer(layer => { if (layer instanceof L.Marker) m.removeLayer(layer); });

      const bounds = [];
      fetchedEvents.forEach(evt => {
        if (evt.lat && evt.lng) {
          const marker = L.marker([evt.lat, evt.lng], { icon: goldIcon }).addTo(m);
          marker.bindPopup(`
            <div style="font-family: 'Montserrat', sans-serif; text-align: center;">
              <strong style="color: #997c55; font-size: 0.9rem;">${escapeHtml(evt.title)}</strong><br/>
              <span style="font-size: 0.75rem; color: #444;">${escapeHtml(evt.locationName)}</span><br/>
              <small style="color: #888;">${escapeHtml(evt.dateBadge)} à ${escapeHtml(evt.time)}</small>
            </div>
          `);
          bounds.push([evt.lat, evt.lng]);
        }
      });

      if (bounds.length > 0) m.fitBounds(bounds, { padding: [30, 30] });
    });
  }

  fetchAndRenderEvents();

  // ==========================================================================
  // 4. Countdown Ticker Engine
  // ==========================================================================
  function updateRoadmapCountdown() {
    if (!nextEventTargetDate || isNaN(nextEventTargetDate)) {
      // Fallback default target date
      nextEventTargetDate = new Date('2026-11-25T20:00:00').getTime();
    }

    const now = new Date().getTime();
    const diff = nextEventTargetDate - now;

    const daysEl = document.getElementById('rm-days');
    const hoursEl = document.getElementById('rm-hours');
    const minsEl = document.getElementById('rm-minutes');
    const secsEl = document.getElementById('rm-seconds');

    if (!daysEl) return;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = days.toString().padStart(2, '0');
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minsEl.textContent = minutes.toString().padStart(2, '0');
    secsEl.textContent = seconds.toString().padStart(2, '0');
  }

  setInterval(updateRoadmapCountdown, 1000);

  // ==========================================================================
  // 5. Messages d'Amour Engine
  // ==========================================================================
  function fetchAndRenderMessages() {
    fetch('/api/messages')
      .then(res => res.json())
      .then(messages => {
        const wall = document.getElementById('messages-wall-list');
        if (!wall) return;

        if (!messages || messages.length === 0) {
          wall.innerHTML = '<p style="text-align:center; font-size:0.8rem; color:#888; font-style:italic;">Soyez le premier à laisser un mot doux ! ❤️</p>';
          return;
        }

        wall.innerHTML = '';
        messages.forEach(msg => {
          const card = document.createElement('div');
          card.className = 'love-note-card';
          const formattedDate = new Date(msg.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short'
          });

          card.innerHTML = `
            <div class="love-note-header">
              <span class="love-note-author">${escapeHtml(msg.name)}</span>
              <span class="love-note-date">${formattedDate}</span>
            </div>
            <p class="love-note-text">"${escapeHtml(msg.message)}"</p>
          `;
          wall.appendChild(card);
        });
      })
      .catch(err => console.error("Error loading messages:", err));
  }

  const cuteMessageForm = document.getElementById('cute-message-form');
  if (cuteMessageForm) {
    cuteMessageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('msg-sender-name').value.trim();
      const text = document.getElementById('msg-content-text').value.trim();
      const alertBox = document.getElementById('msg-success-alert');

      if (!name || !text) return;

      const submitBtn = document.getElementById('msg-submit-btn');
      if (submitBtn) submitBtn.disabled = true;

      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message: text })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          cuteMessageForm.reset();
          if (alertBox) {
            alertBox.textContent = 'Votre mot doux a bien été transmis à Yessin & Fatma avec amour ! ❤️';
            alertBox.classList.remove('hidden');
            setTimeout(() => alertBox.classList.add('hidden'), 4000);
          }
          fetchAndRenderMessages();
        }
      })
      .catch(err => {
        alert("Une erreur est survenue lors de l'envoi du message.");
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  if (deckMessagesBtn) {
    deckMessagesBtn.addEventListener('click', () => {
      openModal(messagesModal);
      fetchAndRenderMessages();
    });
  }

  if (openMessagesWallBtn) {
    openMessagesWallBtn.addEventListener('click', () => {
      openModal(messagesModal);
      fetchAndRenderMessages();
    });
  }

  if (messagesCloseBtn) {
    messagesCloseBtn.addEventListener('click', () => closeModal(messagesModal));
  }

  // ==========================================================================
  // 6. Envelope Animation & Site Reveal
  // ==========================================================================
  if (waxSealBtn) {
    waxSealBtn.addEventListener('click', () => {
      if (envelope) envelope.classList.add('open');
      playMusic();
      
      const envNavArrow = document.getElementById('envelope-nav-arrow');
      if (envNavArrow) {
        setTimeout(() => {
          envNavArrow.classList.add('visible');
        }, 1500);
      }
    });
  }

  function enterSite() {
    if (envelopeWrapper) {
      envelopeWrapper.style.opacity = '0';
      envelopeWrapper.style.pointerEvents = 'none';
    }
    if (mainContent) mainContent.classList.add('visible');
    
    const backBtn = document.getElementById('floating-back-btn-container');
    if (backBtn) backBtn.classList.add('visible');
    
    const envNavArrow = document.getElementById('envelope-nav-arrow');
    if (envNavArrow) envNavArrow.classList.remove('visible');

    setTimeout(() => {
      triggerScrollReveals();
      const roadmapEl = document.getElementById('roadmap-section');
      if (roadmapEl) {
        roadmapEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
    
    setTimeout(() => {
      if (envelopeWrapper) envelopeWrapper.style.display = 'none';
    }, 1000);
  }

  function showEnvelope() {
    if (envelopeWrapper) envelopeWrapper.style.display = 'flex';
    
    const backBtn = document.getElementById('floating-back-btn-container');
    if (backBtn) backBtn.classList.remove('visible');

    const envNavArrow = document.getElementById('envelope-nav-arrow');
    if (envNavArrow) {
      setTimeout(() => {
        envNavArrow.classList.add('visible');
      }, 1000);
    }

    setTimeout(() => {
      if (envelopeWrapper) {
        envelopeWrapper.style.opacity = '1';
        envelopeWrapper.style.pointerEvents = 'auto';
      }
      if (mainContent) mainContent.classList.remove('visible');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  if (deckEnterBtn) deckEnterBtn.addEventListener('click', enterSite);
  
  if (deckMapBtn) {
    deckMapBtn.addEventListener('click', () => {
      openModal(mapModal);
      setTimeout(initOrUpdatePublicMap, 300);
    });
  }

  if (deckRsvpBtn) {
    deckRsvpBtn.addEventListener('click', () => {
      if (activeGuest) {
        selectGuest(activeGuest);
        openModal(rsvpModal);
      } else {
        resetRsvpForm();
        openModal(rsvpModal);
      }
    });
  }

  const scrollToDetailsBtn = document.getElementById('scroll-to-details-btn');
  if (scrollToDetailsBtn) scrollToDetailsBtn.addEventListener('click', enterSite);

  const backToEnvelopeBtn = document.getElementById('back-to-envelope-btn');
  if (backToEnvelopeBtn) backToEnvelopeBtn.addEventListener('click', showEnvelope);

  function checkUrlForGuest() {
    const params = new URLSearchParams(window.location.search);
    const guestQuery = params.get('guest') || params.get('g');
    
    if (guestQuery) {
      fetch(`/api/guests/search?name=${encodeURIComponent(guestQuery)}`)
        .then(res => res.json())
        .then(matches => {
          if (matches && matches.length > 0) {
            const guest = matches[0];
            activeGuest = guest;
            
            const rsvpTitle = document.getElementById('deck-rsvp-title');
            const rsvpSubtitle = document.getElementById('deck-rsvp-subtitle');
            
            if (rsvpTitle) {
              rsvpTitle.textContent = guest.name;
              rsvpTitle.style.fontSize = '0.65rem';
            }
            if (rsvpSubtitle) {
              rsvpSubtitle.textContent = `Accès : ${guest.maxGuests} pers.`;
            }
            if (deckRsvpBtn) {
              deckRsvpBtn.textContent = guest.status !== 'pending' ? 'Modif. Réponse' : 'Répondre';
            }
          }
        })
        .catch(err => console.error("Error auto-loading guest:", err));
    }
  }

  checkUrlForGuest();

  // ==========================================================================
  // 7. Background Music Loop Controller
  // ==========================================================================
  let ytPlayer = null;
  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('youtube-player', {
      height: '1',
      width: '1',
      videoId: 'aatr_2MstrI',
      playerVars: {
        'autoplay': 0,
        'controls': 0,
        'loop': 1,
        'playlist': 'aatr_2MstrI'
      },
      events: {
        'onStateChange': function(event) {
          if (event.data === YT.PlayerState.PLAYING) {
            isPlaying = true;
            musicIcon.textContent = 'pause';
            musicToggle.classList.add('audio-playing');
          } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            isPlaying = false;
            musicIcon.textContent = 'music_note';
            musicToggle.classList.remove('audio-playing');
          }
        }
      }
    });
  };

  function playMusic() {
    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      ytPlayer.playVideo();
      isPlaying = true;
      musicIcon.textContent = 'pause';
      musicToggle.classList.add('audio-playing');
    } else if (bgMusic) {
      bgMusic.play()
        .then(() => {
          isPlaying = true;
          musicIcon.textContent = 'pause';
          musicToggle.classList.add('audio-playing');
        })
        .catch(err => console.log("Autoplay music blocked: ", err));
    }
  }
  
  function toggleMusic() {
    if (isPlaying) {
      if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        ytPlayer.pauseVideo();
      } else if (bgMusic) {
        bgMusic.pause();
      }
      isPlaying = false;
      musicIcon.textContent = 'music_note';
      musicToggle.classList.remove('audio-playing');
    } else {
      playMusic();
    }
  }
  
  musicToggle.addEventListener('click', toggleMusic);

  // ==========================================================================
  // 8. Modals Overlay Controller
  // ==========================================================================
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  if (openMapBtn) {
    openMapBtn.addEventListener('click', () => {
      openModal(mapModal);
      setTimeout(initOrUpdatePublicMap, 300);
    });
  }
  
  if (mapCloseBtn) mapCloseBtn.addEventListener('click', () => closeModal(mapModal));
  if (rsvpCloseBtn) rsvpCloseBtn.addEventListener('click', () => closeModal(rsvpModal));
  
  [mapModal, rsvpModal, messagesModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });
  
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(mapModal);
      closeModal(rsvpModal);
      closeModal(messagesModal);
    }
  });

  // ==========================================================================
  // 9. RSVP Flow
  // ==========================================================================
  const searchStage = document.getElementById('rsvp-stage-search');
  const confirmStage = document.getElementById('rsvp-stage-confirm');
  const successStage = document.getElementById('rsvp-stage-success');
  
  const searchInput = document.getElementById('guest-search-input');
  const searchBtn = document.getElementById('guest-search-btn');
  const searchErrorBox = document.getElementById('search-error-msg');
  
  const searchResultsDiv = document.getElementById('search-results');
  const resultsContainer = document.getElementById('results-container');
  
  const confirmForm = document.getElementById('rsvp-confirm-form');
  const seatsLimitText = document.getElementById('rsvp-seats-limit-text');
  const confirmedCountSelect = document.getElementById('rsvp-confirmed-count');
  const rsvpStatusRadios = document.getElementsByName('rsvp-status');
  const confirmedGuestsGroup = document.getElementById('confirmed-guests-group');
  
  function resetRsvpForm() {
    activeGuest = null;
    if (searchInput) searchInput.value = '';
    if (searchErrorBox) searchErrorBox.classList.add('hidden');
    if (searchResultsDiv) searchResultsDiv.classList.add('hidden');
    if (resultsContainer) resultsContainer.innerHTML = '';
    
    if (confirmForm) confirmForm.reset();
    
    if (searchStage) searchStage.classList.remove('hidden');
    if (confirmStage) confirmStage.classList.add('hidden');
    if (successStage) successStage.classList.add('hidden');
  }
  
  rsvpStatusRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'confirmed') {
        if (confirmedGuestsGroup) confirmedGuestsGroup.classList.remove('hidden');
      } else {
        if (confirmedGuestsGroup) confirmedGuestsGroup.classList.add('hidden');
      }
    });
  });
  
  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }
  
  function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      showSearchError("Veuillez saisir votre nom pour rechercher.");
      return;
    }
    
    searchBtn.disabled = true;
    searchBtn.textContent = 'Recherche...';
    if (searchErrorBox) searchErrorBox.classList.add('hidden');
    if (searchResultsDiv) searchResultsDiv.classList.add('hidden');
    if (resultsContainer) resultsContainer.innerHTML = '';
    
    fetch(`/api/guests/search?name=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(matches => {
        if (!matches || matches.length === 0) {
          showSearchError("Désolé, nous n'avons trouvé aucun invité correspondant à ce nom.");
          return;
        }
        
        if (searchResultsDiv) searchResultsDiv.classList.remove('hidden');
        matches.forEach(guest => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-guest-result';
          btn.innerHTML = `${escapeHtml(guest.name)} <span class="material-symbols-outlined">arrow_forward_ios</span>`;
          btn.addEventListener('click', () => selectGuest(guest));
          if (resultsContainer) resultsContainer.appendChild(btn);
        });
      })
      .catch(err => {
        showSearchError("Erreur de connexion lors de la recherche.");
      })
      .finally(() => {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Rechercher';
      });
  }
  
  function showSearchError(msg) {
    if (searchErrorBox) {
      searchErrorBox.textContent = msg;
      searchErrorBox.classList.remove('hidden');
    }
  }
  
  function selectGuest(guest) {
    activeGuest = guest;
    
    if (searchStage) searchStage.classList.add('hidden');
    if (confirmStage) confirmStage.classList.remove('hidden');
    
    const displayEl = document.getElementById('rsvp-guest-title-display');
    if (displayEl) displayEl.textContent = `Invitation pour ${guest.name}`;
    
    if (seatsLimitText) seatsLimitText.textContent = `Votre invitation comprend un maximum de ${guest.maxGuests} personne(s).`;
    
    if (confirmedCountSelect) {
      confirmedCountSelect.innerHTML = '';
      for (let i = 1; i <= guest.maxGuests; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i} personne(s)`;
        if (i === (guest.confirmedGuests || guest.maxGuests)) opt.selected = true;
        confirmedCountSelect.appendChild(opt);
      }
    }
    
    if (guest.status !== 'pending') {
      const isAttending = guest.status === 'confirmed';
      const statusInput = document.querySelector(`input[name="rsvp-status"][value="${guest.status}"]`);
      if (statusInput) statusInput.checked = true;
      
      if (isAttending) {
        if (confirmedGuestsGroup) confirmedGuestsGroup.classList.remove('hidden');
      } else {
        if (confirmedGuestsGroup) confirmedGuestsGroup.classList.add('hidden');
      }
      
      document.getElementById('rsvp-email').value = guest.email || '';
      document.getElementById('rsvp-dietary').value = guest.dietary || '';
      document.getElementById('rsvp-message').value = guest.message || '';
    } else {
      const statusInput = document.querySelector('input[name="rsvp-status"][value="confirmed"]');
      if (statusInput) statusInput.checked = true;
      if (confirmedGuestsGroup) confirmedGuestsGroup.classList.remove('hidden');
      
      document.getElementById('rsvp-email').value = '';
      document.getElementById('rsvp-dietary').value = '';
      document.getElementById('rsvp-message').value = '';
    }
  }
  
  if (confirmForm) {
    confirmForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeGuest) return;
      
      const submitBtn = confirmForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi...';
      }
      
      const rsvpStatus = document.querySelector('input[name="rsvp-status"]:checked').value;
      const confirmedCount = rsvpStatus === 'confirmed' ? parseInt(confirmedCountSelect.value) : 0;
      
      const payload = {
        guestId: activeGuest.id,
        status: rsvpStatus,
        confirmedGuests: confirmedCount,
        email: document.getElementById('rsvp-email').value.trim(),
        dietary: document.getElementById('rsvp-dietary').value.trim(),
        message: document.getElementById('rsvp-message').value.trim()
      };
      
      fetch('/api/guests/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (confirmStage) confirmStage.classList.add('hidden');
        if (successStage) successStage.classList.remove('hidden');
        
        const updatedGuest = data.guest;
        activeGuest = updatedGuest;
        
        if (deckRsvpBtn) deckRsvpBtn.textContent = 'Modif. Réponse';
        
        const successThankYou = document.getElementById('rsvp-success-thank-you');
        if (successThankYou) successThankYou.textContent = `Merci ${updatedGuest.name} ! Votre réponse a bien été prise en compte.`;
        
        const badge = document.getElementById('summary-status-badge');
        if (badge) {
          if (updatedGuest.status === 'confirmed') {
            badge.textContent = 'Présent';
            badge.style.color = 'var(--gold-dark)';
            const summaryLine = document.getElementById('summary-guests-line');
            const summaryCount = document.getElementById('summary-guests-count');
            if (summaryLine) summaryLine.classList.remove('hidden');
            if (summaryCount) summaryCount.textContent = updatedGuest.confirmedGuests;
          } else {
            badge.textContent = 'Absent';
            badge.style.color = '#ef4444';
            const summaryLine = document.getElementById('summary-guests-line');
            if (summaryLine) summaryLine.classList.add('hidden');
          }
        }
      })
      .catch(err => {
        alert("Une erreur est survenue lors de la confirmation.");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirmer';
        }
      });
    });
  }
  
  const successDoneBtn = document.getElementById('success-done-btn');
  if (successDoneBtn) {
    successDoneBtn.addEventListener('click', () => closeModal(rsvpModal));
  }

  // ==========================================================================
  // 10. WEBGENCY TIMELESS GRACE INTERACTIVE ENVELOPE & SCRATCH CARD LOGIC
  // ==========================================================================

  // Fullscreen Envelope Overlay & Opening Video Player Sync
  const weiOverlay = document.getElementById('weiOverlay');
  const weiVideoWrap = document.getElementById('weiVideoWrap');
  const weiVideo = document.getElementById('weiVideo');
  const weiAudio = document.getElementById('weiAudio');
  const weiAudioBtn = document.getElementById('weiAudioBtn');
  const weiIconPause = document.getElementById('weiIconPause');
  const weiIconPlay = document.getElementById('weiIconPlay');

  let audioPlaying = false;

  window.playWeiAudio = function() {
    if (weiAudio) {
      weiAudio.volume = 1;
      const p = weiAudio.play();
      if (p && p.then) {
        p.then(() => {
          audioPlaying = true;
          if (weiAudioBtn) {
            weiAudioBtn.style.visibility = 'visible';
            weiAudioBtn.style.opacity = '1';
          }
          if (weiIconPause) weiIconPause.style.display = 'block';
          if (weiIconPlay) weiIconPlay.style.display = 'none';
        }).catch(err => console.log("Audio play blocked:", err));
      }
    }
  };

  window.pauseWeiAudio = function() {
    if (weiAudio) {
      weiAudio.pause();
      audioPlaying = false;
      if (weiIconPause) weiIconPause.style.display = 'none';
      if (weiIconPlay) weiIconPlay.style.display = 'block';
    }
  };

  window.toggleWeiAudio = function(forcePlay) {
    if (forcePlay === true || !audioPlaying) {
      window.playWeiAudio();
    } else {
      window.pauseWeiAudio();
    }
  };

  if (weiAudioBtn) {
    weiAudioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (audioPlaying) {
        window.pauseWeiAudio();
      } else {
        window.playWeiAudio();
      }
    });
  }

  let hasOpened = false;

  window.openTimelessInvitation = function() {
    if (hasOpened) return;
    hasOpened = true;

    // Start background music
    window.playWeiAudio();

    // 1. Instantly display video wrap on top
    if (weiVideoWrap && weiVideo) {
      weiVideoWrap.style.display = 'flex';
      weiVideoWrap.classList.remove('wei-video-out');
      weiVideoWrap.classList.add('wei-video-in');

      try {
        weiVideo.currentTime = 0;
        const playPromise = weiVideo.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(err => console.log("Envelope video play failed:", err));
        }
      } catch (err) {
        console.log("Video trigger error:", err);
      }

      // Hide overlay underneath
      if (weiOverlay) {
        weiOverlay.style.opacity = '0';
        weiOverlay.style.pointerEvents = 'none';
        setTimeout(() => {
          weiOverlay.style.display = 'none';
          weiOverlay.style.visibility = 'hidden';
        }, 400);
      }

      let videoFading = false;
      function finishVideo() {
        if (videoFading) return;
        videoFading = true;
        
        weiVideoWrap.classList.remove('wei-video-in');
        weiVideoWrap.classList.add('wei-video-out');
        setTimeout(() => {
          weiVideoWrap.style.display = 'none';
          triggerScrollReveals();
        }, 800);
      }

      weiVideo.addEventListener('timeupdate', function() {
        if (weiVideo.duration && weiVideo.duration > 1 && weiVideo.currentTime >= weiVideo.duration - 0.6) {
          finishVideo();
        }
      });

      weiVideo.onended = finishVideo;
      setTimeout(finishVideo, 2800); // Fallback timeout
    } else {
      if (weiOverlay) {
        weiOverlay.style.display = 'none';
      }
      triggerScrollReveals();
    }
  };

  if (weiOverlay) {
    weiOverlay.addEventListener('click', window.openTimelessInvitation);
    weiOverlay.addEventListener('touchstart', window.openTimelessInvitation, { passive: true });
  }

  // HTML5 3-Card Scratch Reveal Engine
  function setupScratchCard(canvasId, textLabel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    function initFoil() {
      ctx.fillStyle = '#CFAB66';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 200; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const radius = Math.random() * 1.5;
        ctx.fillStyle = Math.random() > 0.5 ? '#FAF8F5' : '#806B43';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#806B43';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(3, 3, w - 6, h - 6);

      ctx.font = "bold 9px 'Cinzel', serif";
      ctx.fillStyle = '#382E25';
      ctx.textAlign = 'center';
      ctx.fillText(textLabel || '✦ GRATTEZ ✦', w / 2, h / 2 + 3);
    }

    initFoil();

    let isScratching = false;
    function scratch(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    canvas.addEventListener('mousedown', (e) => { isScratching = true; const c = getCoords(e); scratch(c.x, c.y); });
    canvas.addEventListener('mousemove', (e) => { if (isScratching) { const c = getCoords(e); scratch(c.x, c.y); } });
    window.addEventListener('mouseup', () => { isScratching = false; });

  }

  // Live Countdown Timer Engine (11 JUILLET 2026)
  const targetWeddingDate = new Date('2026-07-11T18:00:00').getTime();

  function updateTimelessCountdown() {
    const now = new Date().getTime();
    const diff = targetWeddingDate - now;

    const tDays = document.getElementById('timer-days');
    const tHours = document.getElementById('timer-hours');
    const tMins = document.getElementById('timer-minutes');
    const tSecs = document.getElementById('timer-seconds');

    if (!tDays) return;

    if (diff <= 0) {
      tDays.textContent = '00';
      tHours.textContent = '00';
      tMins.textContent = '00';
      tSecs.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    tDays.textContent = days.toString().padStart(2, '0');
    tHours.textContent = hours.toString().padStart(2, '0');
    tMins.textContent = minutes.toString().padStart(2, '0');
    tSecs.textContent = seconds.toString().padStart(2, '0');
  }

  setInterval(updateTimelessCountdown, 1000);
  updateTimelessCountdown();

  // Open RSVP Modal Button
  const openRsvpBtn = document.getElementById('open-rsvp-btn');
  if (openRsvpBtn) {
    openRsvpBtn.addEventListener('click', () => {
      if (typeof resetRsvpForm === 'function') resetRsvpForm();
      openModal(rsvpModal);
    });
  }

  // Scroll Observer
  const cardObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });
  
  function triggerScrollReveals() {
    const revealCards = document.querySelectorAll('.reveal-card');
    revealCards.forEach(card => {
      cardObserver.observe(card);
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        card.classList.add('revealed');
      }
    });
  }

  function loadDynamicTimeline() {
    const container = document.getElementById('wedding-timeline-container');
    if (!container) return;

    fetch('/api/timeline')
      .then(res => res.json())
      .then(items => {
        if (!Array.isArray(items) || items.length === 0) return;
        
        container.innerHTML = items.map((item, index) => {
          const isEven = index % 2 === 0;
          const iconSpan = `<span class="material-symbols-outlined" style="font-size: 2rem; color: #CFAB66;">${escapeHtml(item.icon || 'schedule')}</span>`;
          const textBlock = `
            <span style="font-family: 'Cinzel', serif; font-size: 0.88rem; font-weight: 700; color: #806B43; display: block;">${escapeHtml(item.time)}</span>
            <span style="font-family: 'Rufina', serif; font-size: 1rem; color: #382E25; font-weight: 600;">${escapeHtml(item.title)}</span>
            ${item.description ? `<span style="font-family: 'Montserrat', sans-serif; font-size: 0.72rem; color: #777; display: block; margin-top: 2px;">${escapeHtml(item.description)}</span>` : ''}
          `;

          if (isEven) {
            return `
              <div class="timeline-row-item">
                <div style="flex: 1; text-align: right; padding-right: 1.5rem;">
                  ${iconSpan}
                </div>
                <div class="timeline-node-marker"></div>
                <div style="flex: 1; text-align: left; padding-left: 1.5rem;">
                  ${textBlock}
                </div>
              </div>
            `;
          } else {
            return `
              <div class="timeline-row-item">
                <div style="flex: 1; text-align: right; padding-right: 1.5rem;">
                  ${textBlock}
                </div>
                <div class="timeline-node-marker"></div>
                <div style="flex: 1; text-align: left; padding-left: 1.5rem;">
                  ${iconSpan}
                </div>
              </div>
            `;
          }
        }).join('');
      })
      .catch(err => console.error("Error loading timeline:", err));
  }

  loadDynamicTimeline();

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

