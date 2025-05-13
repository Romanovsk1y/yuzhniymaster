const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5500;

// Middlewares
app.use(cors());
app.use(express.static('uploads')); // Статичная папка для изображений
app.use(express.static(__dirname)); // Отдача html и css
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'pages')));

// Настройка Multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Загрузка файла
app.post('/upload', upload.single('image'), (req, res) => {
  res.json({ filename: req.file.filename });
});

// Получение списка изображений
app.get('/images', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Не удалось получить изображения' });
    }
    res.json(files);
  });
});

// РЕГИСТРАЦИЯ
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send('<h3>Заполните все поля</h3>');
  }

  const USERS_FILE = path.join(__dirname, 'users.json');
  let users = [];

  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  }

  if (users.find(u => u.email === email)) {
    return res.send('<h3>Пользователь с таким email уже существует</h3>');
  }

  users.push({ username, email, password });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  res.send('<h3>Регистрация успешна! <a href="/pages/login.html">Войти</a></h3>');
});

// АВТОРИЗАЦИЯ
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('<h3>Введите имя пользователя и пароль</h3>');
  }

  const USERS_FILE = path.join(__dirname, 'users.json');
  if (!fs.existsSync(USERS_FILE)) {
    return res.status(400).send('<h3>Нет зарегистрированных пользователей</h3>');
  }

  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(400).send('<h3>Неверное имя пользователя или пароль</h3>');
  }

  res.redirect('/pages/dashboard.html');
});

// ЗАПУСК СЕРВЕРА
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});