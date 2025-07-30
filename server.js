const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/dashboard', authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// OAuth login route
app.get('/auth/login', (req, res) => {
  const state = generateRandomString(16);
  req.session.oauthState = state;
  
  const params = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    response_type: 'code',
    state: state,
    scope: 'openid email profile'
  });
  
  res.redirect(`${process.env.AUTH_SERVICE_URL}/authorize?${params}`);
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect('/login?error=' + error);
  }
  
  // Validate state
  if (state !== req.session.oauthState) {
    return res.redirect('/login?error=invalid_state');
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(`${process.env.AUTH_SERVICE_URL}/auth/token`, {
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      setCookies: true,
      cookieDomain: 'localhost'
    });
    
    const { access_token, refresh_token, user } = tokenResponse.data;
    
    // Store tokens in session in server side not in client cookies
    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;
    req.session.user = user;
    
    // Also set cookies
    res.cookie('accessToken', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    
    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.redirect('/login?error=token_exchange_failed');
  }
});

// Direct login (without OAuth flow)
app.post('/api/login', async (req, res) => {
  try {
    const response = await axios.post(`${process.env.AUTH_SERVICE_URL}/login`, {
      email: req.body.email,
      password: req.body.password,
      // setCookies: true
    });
    
    const { accessToken, refreshToken, user } = response.data;
    
    req.session.accessToken = accessToken;
    req.session.refreshToken = refreshToken;
    req.session.user = user;
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Login failed' 
    });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const response = await axios.post(`${process.env.AUTH_SERVICE_URL}/register`, req.body);
    res.json({ success: true, message: response.data.message });
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message); 
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Registration failed' 
    });
  }
});

// Get user info
app.get('/api/user', authenticateUser, (req, res) => {
  res.json({ user: req.session.user });
});

// In-memory storage for todos (in production, use a database)
let todos = [];
let todoIdCounter = 1;

// ToDo API endpoints
app.get('/api/todos', authenticateUser, (req, res) => {
  const userTodos = todos.filter(todo => todo.userId === req.session.user.id);
  res.json({ todos: userTodos });
});

app.post('/api/todos', authenticateUser, (req, res) => {
  const { title, description } = req.body;
  
  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  
  const newTodo = {
    id: todoIdCounter++,
    title: title.trim(),
    description: description ? description.trim() : '',
    completed: false,
    userId: req.session.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  todos.push(newTodo);
  res.json({ success: true, todo: newTodo });
});

app.put('/api/todos/:id', authenticateUser, (req, res) => {
  const todoId = parseInt(req.params.id);
  const { title, description, completed } = req.body;
  
  const todoIndex = todos.findIndex(todo => 
    todo.id === todoId && todo.userId === req.session.user.id
  );
  
  if (todoIndex === -1) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }
  
  if (title !== undefined) todos[todoIndex].title = title.trim();
  if (description !== undefined) todos[todoIndex].description = description.trim();
  if (completed !== undefined) todos[todoIndex].completed = completed;
  todos[todoIndex].updatedAt = new Date().toISOString();
  
  res.json({ success: true, todo: todos[todoIndex] });
});

app.delete('/api/todos/:id', authenticateUser, (req, res) => {
  const todoId = parseInt(req.params.id);
  const todoIndex = todos.findIndex(todo => 
    todo.id === todoId && todo.userId === req.session.user.id
  );
  
  if (todoIndex === -1) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }
  
  todos.splice(todoIndex, 1);
  res.json({ success: true, message: 'Todo deleted successfully' });
});

// Logout
app.post('/api/logout', async (req, res) => {
  try {
    if (req.session.accessToken) {
      await axios.post(`${process.env.AUTH_SERVICE_URL}/logout`, {}, {
        headers: { Authorization: `Bearer ${req.session.accessToken}` }
      });
    }
    
    req.session.destroy();
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true }); // Logout anyway
  }
});

// Middleware to authenticate user
async function authenticateUser(req, res, next) {
  const token = req.session.accessToken || req.cookies.accessToken;
  
  if (!token) {
    return res.redirect('/login');
  }
  
  try {
    // Validate token with auth service
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/introspect`,
      new URLSearchParams({
        token: token,
        token_type_hint: 'access_token'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );
    
    if (response.data.active) {
      req.user = response.data;
      next();
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Token validation error:', error.message);
    res.redirect('/login');
  }
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Client app running on http://localhost:${PORT}`);
});