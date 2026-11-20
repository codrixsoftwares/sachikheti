import { calculateLiveMetrics } from '../routes/metrics.js';

/**
 * Emit an event and broadcast freshly computed live metrics to all connected clients.
 */
export async function broadcastRealtimeUpdate(io, eventName, payload) {
  if (!io) return;

  // 1. Emit primary resource event
  io.emit(eventName, payload);

  // 2. Compute and emit fresh overview metrics
  try {
    const liveMetrics = await calculateLiveMetrics();
    io.emit('metrics:updated', liveMetrics);
  } catch (err) {
    console.error('Failed to broadcast updated metrics:', err);
  }
}
