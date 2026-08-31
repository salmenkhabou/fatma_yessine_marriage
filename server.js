const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8085;

const GUESTS_FILE = path.join(__dirname, 'guests.json');
const RSVP_FILE = path.join(__dirname, 'rsvps.json');
const SONGS_FILE = path.join(__dirname, 'songs.json');
const EVENTS_FILE = path.join(__dirname, 'events.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const TIMELINE_FILE = path.join(__dirname, 'timeline.json');

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};
const ADMIN_TOKEN = 'yf-admin-token-secret-2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

function ensureFileExists(filePath, defaultValue = '[]') {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultValue, 'utf8');
  }
}

ensureFileExists(GUESTS_FILE, '[]');
ensureFileExists(RSVP_FILE, '[]');
ensureFileExists(SONGS_FILE, '[]');
ensureFileExists(EVENTS_FILE, '[]');
ensureFileExists(MESSAGES_FILE, '[]');
ensureFileExists(TIMELINE_FILE, '[]');

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;
  
  if (token === ADMIN_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: 'Non autorisé. Veuillez vous connecter.' });
}

// --------------------------------------------------------------------------
// 1. Admin Authentication Route
// --------------------------------------------------------------------------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    return res.json({ success: true, token: ADMIN_TOKEN, message: 'Connexion réussie.' });
  }
  return res.status(401).json({ success: false, error: 'Identifiants incorrects (Nom d\'utilisateur ou mot de passe invalide).' });
});

app.get('/api/admin/check-auth', requireAdmin, (req, res) => {
  return res.json({ authenticated: true });
});

// --------------------------------------------------------------------------
// 2. Cute Messages d'Amour Endpoints (Public & Admin)
// --------------------------------------------------------------------------
// Get public cute messages
app.get('/api/messages', (req, res) => {
  try {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
    const sorted = messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(sorted);
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Post cute message (Public)
app.post('/api/messages', (req, res) => {
  try {
    const { name, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: 'Votre nom et votre mot doux sont requis.' });
    }

    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
    const newMsg = {
      id: 'msg-' + Date.now(),
      name: name.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    messages.push(newMsg);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');

    return res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    console.error('Error posting message:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete message (Admin)
app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
    messages = messages.filter(m => m.id !== id);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
    return res.json({ success: true, message: 'Message supprimé.' });
  } catch (err) {
    console.error('Error deleting message:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --------------------------------------------------------------------------
// 3. Events Endpoints
// --------------------------------------------------------------------------
app.get('/api/events', (req, res) => {
  try {
    const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8') || '[]');
    return res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({ error: 'Failed to read events' });
  }
});

app.post('/api/admin/events', requireAdmin, (req, res) => {
  try {
    const { title, dateBadge, time, datetime, locationName, address, lat, lng, googleMapsUrl, description, isGold } = req.body;
    if (!title || !locationName) {
      return res.status(400).json({ error: 'Le titre et le nom du lieu sont requis.' });
    }

    const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8') || '[]');
    const newEvent = {
      id: 'evt-' + Date.now(),
      title,
      dateBadge: dateBadge || 'Date à venir',
      time: time || '19h00',
      datetime: datetime || new Date().toISOString(),
      locationName,
      address: address || '',
      lat: parseFloat(lat) || 34.7400,
      lng: parseFloat(lng) || 10.7600,
      googleMapsUrl: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName + ' ' + address)}`,
      description: description || '',
      isGold: Boolean(isGold)
    };

    events.push(newEvent);
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');

    return res.status(201).json({ success: true, event: newEvent });
  } catch (err) {
    console.error('Error adding event:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { title, dateBadge, time, datetime, locationName, address, lat, lng, googleMapsUrl, description, isGold } = req.body;

    const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8') || '[]');
    const idx = events.findIndex(e => e.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Événement non trouvé.' });
    }

    events[idx] = {
      ...events[idx],
      title: title !== undefined ? title : events[idx].title,
      dateBadge: dateBadge !== undefined ? dateBadge : events[idx].dateBadge,
      time: time !== undefined ? time : events[idx].time,
      datetime: datetime !== undefined ? datetime : events[idx].datetime,
      locationName: locationName !== undefined ? locationName : events[idx].locationName,
      address: address !== undefined ? address : events[idx].address,
      lat: lat !== undefined ? parseFloat(lat) : events[idx].lat,
      lng: lng !== undefined ? parseFloat(lng) : events[idx].lng,
      googleMapsUrl: googleMapsUrl !== undefined ? googleMapsUrl : events[idx].googleMapsUrl,
      description: description !== undefined ? description : events[idx].description,
      isGold: isGold !== undefined ? Boolean(isGold) : events[idx].isGold
    };

    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
    return res.json({ success: true, event: events[idx] });
  } catch (err) {
    console.error('Error updating event:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8') || '[]');
    events = events.filter(e => e.id !== id);
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
    return res.json({ success: true, message: 'Événement supprimé.' });
  } catch (err) {
    console.error('Error deleting event:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --------------------------------------------------------------------------
// 4. Guest & Family Endpoints
// --------------------------------------------------------------------------
app.get('/api/guests/search', (req, res) => {
  try {
    const query = (req.query.name || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ error: 'Query name required.' });
    }

    const guests = JSON.parse(fs.readFileSync(GUESTS_FILE, 'utf8') || '[]');
    const matches = guests.filter(g => g.name.toLowerCase().includes(query));
    return res.json(matches);
  } catch (error) {
    console.error('Error searching guests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/guests/confirm', (req, res) => {
  try {
    const { guestId, status, confirmedGuests, email, dietary, message } = req.body;

    if (!guestId || !status) {
      return res.status(400).json({ error: 'Guest ID and status required.' });
    }

    const guests = JSON.parse(fs.readFileSync(GUESTS_FILE, 'utf8') || '[]');
    const guestIndex = guests.findIndex(g => g.id === guestId);

    if (guestIndex === -1) {
      return res.status(404).json({ error: 'Guest not found.' });
    }

    const currentGuest = guests[guestIndex];
    const confirmedCount = parseInt(confirmedGuests) || 0;

    if (status === 'confirmed' && confirmedCount > currentGuest.maxGuests) {
      return res.status(400).json({ error: `Cannot confirm more than ${currentGuest.maxGuests} guests.` });
    }

    const updatedGuest = {
      ...currentGuest,
      status: status === 'confirmed' ? 'confirmed' : 'declined',
      confirmedGuests: status === 'confirmed' ? confirmedCount : 0,
      email: email || currentGuest.email || '',
      dietary: dietary || currentGuest.dietary || '',
      message: message || currentGuest.message || '',
      updatedAt: new Date().toISOString()
    };

    guests[guestIndex] = updatedGuest;
    fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');

    // Also copy to messages if message is non-empty
    if (message && message.trim()) {
      const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
      messages.push({
        id: 'msg-' + Date.now(),
        name: currentGuest.name,
        message: message.trim(),
        createdAt: new Date().toISOString()
      });
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
    }

    return res.status(200).json({ success: true, guest: updatedGuest });
  } catch (error) {
    console.error('Error confirming RSVP:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/rsvps', requireAdmin, (req, res) => {
  try {
    const guests = JSON.parse(fs.readFileSync(GUESTS_FILE, 'utf8') || '[]');
    
    const summary = guests.reduce((acc, g) => {
      acc.totalGuests += (g.maxGuests || 1);
      if (g.status === 'confirmed') {
        acc.confirmedAttending += (g.confirmedGuests || 0);
        acc.repliedCount += 1;
      } else if (g.status === 'declined') {
        acc.declinedCount += 1;
        acc.repliedCount += 1;
      }
      return acc;
    }, { totalGuests: 0, confirmedAttending: 0, repliedCount: 0, declinedCount: 0 });

    summary.totalInvitations = guests.length;

    return res.json({ summary, guests });
  } catch (error) {
    console.error('Error in admin summary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/guests', requireAdmin, (req, res) => {
  try {
    const { name, maxGuests, status, confirmedGuests, email, dietary, message } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Le nom de l\'invité ou de la famille est requis.' });
    }

    const guests = JSON.parse(fs.readFileSync(GUESTS_FILE, 'utf8') || '[]');
    const max = parseInt(maxGuests) || 1;
    const initialStatus = status || 'pending';
    const conf = initialStatus === 'confirmed' ? (parseInt(confirmedGuests) || max) : 0;

    const newGuest = {
      id: 'g-' + Date.now(),
      name: name.trim(),
      maxGuests: max,
      confirmedGuests: conf,
      status: initialStatus,
      email: email || '',
      dietary: dietary || '',
      message: message || '',
      updatedAt: new Date().toISOString()
    };

    guests.push(newGuest);
    fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');

    return res.status(201).json({ success: true, guest: newGuest });
  } catch (err) {
    console.error('Error adding guest:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/guests/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, maxGuests, status, confirmedGuests, email, dietary, message } = req.body;

    const guests = JSON.parse(fs.readFileSync(GUESTS_FILE, 'utf8') || '[]');
    const idx = guests.findIndex(g => g.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Invité non trouvé.' });
    }

    const max = maxGuests !== undefined ? parseInt(maxGuests) : guests[idx].maxGuests;
    const newStatus = status !== undefined ? status : guests[idx].status;
    let conf = confirmedGuests !== undefined ? parseInt(confirmedGuests) : guests[idx].confirmedGuests;
    
    if (newStatus === 'confirmed' && conf === 0) {
      conf = max;
    } else if (newStatus === 'declined') {
      conf = 0;
    }

    guests[idx] = {
      ...guests[idx],
      name: name !== undefined ? name.trim() : guests[idx].name,
      maxGuests: max,
      status: newStatus,
      confirmedGuests: conf,
      email: email !== undefined ? email : guests[idx].email,
      dietary: dietary !== undefined ? dietary : guests[idx].dietary,
      message: message !== undefined ? message : guests[idx].message,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');
    return res.json({ success: true, guest: guests[idx] });
  } catch (err) {
    console.error('Error updating guest selection:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/guests/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let guests = JSON.parse(fs.readFileSync(GUESTS_FILE, 'utf8') || '[]');
    guests = guests.filter(g => g.id !== id);
    fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');
    return res.json({ success: true, message: 'Invité supprimé.' });
  } catch (err) {
    console.error('Error deleting guest:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --------------------------------------------------------------------------
// 5. Song Suggestions Endpoints
// --------------------------------------------------------------------------
app.post('/api/song', (req, res) => {
  try {
    const { name, title, artist } = req.body;
    if (!name || !title) {
      return res.status(400).json({ error: 'Name and song title required.' });
    }

    const songs = JSON.parse(fs.readFileSync(SONGS_FILE, 'utf8') || '[]');
    const newSong = {
      id: Date.now().toString(),
      name,
      title,
      artist: artist || 'Unknown Artist',
      submittedAt: new Date().toISOString()
    };
    songs.push(newSong);
    fs.writeFileSync(SONGS_FILE, JSON.stringify(songs, null, 2), 'utf8');

    return res.status(201).json({ success: true, message: 'Song suggestion saved.' });
  } catch (error) {
    console.error('Error handling song suggestion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/songs', requireAdmin, (req, res) => {
  try {
    const songs = JSON.parse(fs.readFileSync(SONGS_FILE, 'utf8') || '[]');
    return res.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --------------------------------------------------------------------------
// 6. Wedding Timeline Endpoints (Public & Admin)
// --------------------------------------------------------------------------
app.get('/api/timeline', (req, res) => {
  try {
    const timeline = JSON.parse(fs.readFileSync(TIMELINE_FILE, 'utf8') || '[]');
    return res.json(timeline);
  } catch (err) {
    console.error('Error fetching timeline:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/timeline', requireAdmin, (req, res) => {
  try {
    const { time, title, icon, description } = req.body;
    if (!time || !title) {
      return res.status(400).json({ error: 'L\'heure et le titre sont requis.' });
    }
    const timeline = JSON.parse(fs.readFileSync(TIMELINE_FILE, 'utf8') || '[]');
    const newItem = {
      id: 'tl-' + Date.now(),
      time: time.trim(),
      title: title.trim(),
      icon: (icon || 'schedule').trim(),
      description: (description || '').trim()
    };
    timeline.push(newItem);
    fs.writeFileSync(TIMELINE_FILE, JSON.stringify(timeline, null, 2), 'utf8');
    return res.status(201).json({ success: true, item: newItem, timeline });
  } catch (err) {
    console.error('Error adding timeline item:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/timeline/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { time, title, icon, description } = req.body;
    let timeline = JSON.parse(fs.readFileSync(TIMELINE_FILE, 'utf8') || '[]');
    const idx = timeline.findIndex(item => item.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Événement non trouvé.' });
    }
    if (time !== undefined) timeline[idx].time = time.trim();
    if (title !== undefined) timeline[idx].title = title.trim();
    if (icon !== undefined) timeline[idx].icon = icon.trim();
    if (description !== undefined) timeline[idx].description = description.trim();

    fs.writeFileSync(TIMELINE_FILE, JSON.stringify(timeline, null, 2), 'utf8');
    return res.json({ success: true, item: timeline[idx], timeline });
  } catch (err) {
    console.error('Error updating timeline item:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/timeline/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let timeline = JSON.parse(fs.readFileSync(TIMELINE_FILE, 'utf8') || '[]');
    timeline = timeline.filter(item => item.id !== id);
    fs.writeFileSync(TIMELINE_FILE, JSON.stringify(timeline, null, 2), 'utf8');
    return res.json({ success: true, timeline });
  } catch (err) {
    console.error('Error deleting timeline item:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/timeline/reorder', requireAdmin, (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'L\'ordre doit être un tableau d\'IDs.' });
    }
    let timeline = JSON.parse(fs.readFileSync(TIMELINE_FILE, 'utf8') || '[]');
    const itemMap = new Map(timeline.map(item => [item.id, item]));
    const reordered = [];
    order.forEach(id => {
      if (itemMap.has(id)) {
        reordered.push(itemMap.get(id));
        itemMap.delete(id);
      }
    });
    itemMap.forEach(item => reordered.push(item));
    fs.writeFileSync(TIMELINE_FILE, JSON.stringify(reordered, null, 2), 'utf8');
    return res.json({ success: true, timeline: reordered });
  } catch (err) {
    console.error('Error reordering timeline:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server Emna Siala (Yessin & Fatma) running on http://localhost:${PORT}`);
});
