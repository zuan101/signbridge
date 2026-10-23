import http from 'node:http';
import { handleApiRequest, getAIStatus } from './aiBackend.mjs';

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) {
    await handleApiRequest(req, res);
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'SignBridge AI Server Running', port: PORT }));
  }
});

server.listen(PORT, () => {
  const status = getAIStatus();
  console.log(`\n=================================================`);
  console.log(`🤖 SignBridge AI Backend Server listening on http://localhost:${PORT}`);
  console.log(`Status: ${status.configured ? `Active (${status.provider} - ${status.model})` : 'Offline (No API key found)'}`);
  console.log(`=================================================\n`);
});
