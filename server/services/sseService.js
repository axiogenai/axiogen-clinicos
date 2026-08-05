// Server-Sent Events manager for real-time queue updates
const clients = new Set();

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

function broadcastQueueUpdate() {
  const data = `data: ${JSON.stringify({ type: 'queue_update', ts: Date.now() })}\n\n`;
  for (const client of clients) {
    try {
      client.write(data);
    } catch (e) {
      clients.delete(client);
    }
  }
}

module.exports = { addClient, removeClient, broadcastQueueUpdate };
