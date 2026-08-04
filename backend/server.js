const app = require('./app');
const { PORT } = require('./config/environment');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
