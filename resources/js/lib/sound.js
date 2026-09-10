/**
 * Audio Chime & Browser Notification Engine
 * Usa Web Audio API nativo (cero dependencias de archivos externos mp3)
 * para emitir un elegante sonido tipo "Apple Glass Chime" cuando salta una alerta.
 */

export function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    // Acorde cristalino (E6 y B6)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(1318.51, now) // E6
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1975.53, now) // B6

    // Envolvente de decaimiento suave
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 1.2)
    osc2.stop(now + 1.2)
  } catch (e) {
    // Ignorar si el navegador bloquea audio antes de interacción
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

export function sendDesktopNotification(title, options = {}) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      ...options,
    })
  }
}
