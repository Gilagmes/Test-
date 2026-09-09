// Замените эту строку:
// app.use(express.static(path.join(__dirname, '../client')));

// На эту (для Node.js runtime на Render):
app.use(express.static(path.join(__dirname, '../client')));
// Оставьте как есть, но убедитесь что структура такая:
// /
// ├── server/
// │   ├── server.js
// │   └── package.json
// ├── client/
// │   └── index.html
// └── package.json (корневой)
