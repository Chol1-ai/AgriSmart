const app = require('./app');
const { PORT } = require('./config/environment');

if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  console.log('Server not started (module required or test environment)');
}
