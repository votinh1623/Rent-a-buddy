const { spawn } = require('child_process');
const path = require('path');

console.log('Starting development servers...');

// Function to spawn a process with proper working directory
const spawnProcess = (command, args, cwd, name) => {
  console.log(`Starting ${name} in ${cwd}`);
  
  const process = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd: cwd
  });

  process.on('error', (err) => {
    console.error(`Failed to start ${name}:`, err.message);
  });

  return process;
};

// Get absolute paths
const backendPath = path.resolve(__dirname, '../backend');
const frontendPath = path.resolve(__dirname, '../frontend');
const ttsPath = path.resolve(__dirname, '../gpu');

// Start backend
const backend = spawnProcess('npx', ['nodemon', 'src/app.js'], backendPath, 'Backend');

// Start frontend
const frontend = spawnProcess('npm', ['run', 'dev'], frontendPath, 'Frontend');

// Start Edge TTS server
const ttsServer = spawnProcess('python', ['scripts/edge_tts_server.py'], ttsPath, 'TTS Server');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  backend.kill();
  frontend.kill();
  ttsServer.kill();
  process.exit();
});