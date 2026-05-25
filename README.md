# 📻 TALKIE — Event Radio System

Walkie-talkie webapp para eventos. Funciona en cualquier móvil con navegador. Sin instalar nada.

## ✅ Funcionalidades

- **Push-to-Talk (PTT)** — mantén pulsado para hablar
- **5 canales** — GENERAL, STAFF, SEGURIDAD, PRODUCCIÓN, EMERGENCIA
- **PWA** — instalable desde el navegador (funciona sin app store)
- **Sonidos de radio** — clicks y pitidos de walkie real
- **Vibración** — feedback táctil al transmitir
- **Wake Lock** — pantalla siempre encendida mientras se usa
- **Atajo teclado** — ESPACIO = PTT desde ordenador
- **Indicador de latencia** — muestra ms de conexión
- **Contador de transmisión** — tiempo exacto de cada TX
- **Notificaciones de canal** — badge en canales con mensajes no leídos

## 🚀 Inicio Rápido (modo demo)

Abre `index.html` en cualquier navegador moderno. Los usuarios demo simulan actividad.

## 🔌 Para activar comunicación real

### 1. Instala dependencias
```bash
npm install
```

### 2. Arranca el servidor
```bash
npm start
# → http://localhost:3000
```

### 3. Conecta el frontend al servidor

En `index.html`, descomenta y modifica `initWebRTCSimulator()`:

```javascript
state.ws = io('wss://tu-servidor.com');

state.ws.on('connect', () => {
  state.ws.emit('join', {
    name: state.user,
    event: state.event,
    channel: state.channel
  });
});

state.ws.on('existing_peers', (peerIds) => {
  peerIds.forEach(peerId => createPeerConnection(peerId, true));
});

state.ws.on('user_joined', (user) => {
  createPeerConnection(user.id, false);
  addLogEntry('SISTEMA', `${user.name} conectado`, user.channel, 'system');
});

state.ws.on('offer', async ({ fromId, sdp }) => {
  const pc = createPeerConnection(fromId, false);
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  state.ws.emit('answer', { targetId: fromId, sdp: answer });
});

// ... más handlers en server.js
```

## ☁️ Deploy en producción

### Railway (recomendado)
```bash
npm install -g railway
railway login
railway init
railway up
```

### Render
1. Sube a GitHub
2. Conecta repo en render.com
3. Build: `npm install`, Start: `npm start`

### Variables de entorno
```
PORT=3000
```

## 📱 Instalar como PWA

1. Abre la URL en Chrome/Safari móvil
2. "Añadir a pantalla de inicio"
3. Funciona como app nativa

## 🔌 Fase 2: Gateway Baofeng

```
Baofeng (cable TRRS) → Raspberry Pi (USB audio) → Este servidor → App
```

Ver arquitectura completa en el documento de diseño.

## 🔒 Seguridad

- Código de evento actúa como sala privada
- En producción: añadir JWT + cifrado E2E
- HTTPS obligatorio para acceso al micrófono

## 📋 Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| PWA | Service Worker + Web App Manifest |
| Audio | WebRTC + Web Audio API + Opus |
| Señalización | Socket.IO over WebSocket |
| Backend | Node.js + Express |
| Deploy | Railway / Render / Fly.io |
