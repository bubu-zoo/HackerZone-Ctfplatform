# HackerZone CTF Platform

A secure, professional Capture The Flag (CTF) platform built with Node.js, Express, and SQLite.

## Features

- 🎯 **Multiple Challenge Categories**: Web Exploitation, Cryptography, Reverse Engineering, Binary Exploitation, Forensics, OSINT, Steganography, and Miscellaneous
- 🏆 **Difficulty Levels**: Easy, Medium, Hard, Expert, and Insane
- 📊 **Real-time Leaderboard**: Track top players and their scores
- 🔒 **Secure Admin Panel**: Protected admin area at `/hackur` with full challenge management
- 🛡️ **OWASP Top 10 Compliant**: Built with security best practices

## Security Features

This platform implements protections against OWASP Top 10 vulnerabilities:

1. **Injection Prevention**: Parameterized queries, input sanitization
2. **Broken Authentication**: bcrypt password hashing, JWT with secure secrets, account lockout
3. **Sensitive Data Exposure**: Secure cookies, HTTPS-ready, no sensitive data in logs
4. **XML External Entities**: Not applicable (no XML processing)
5. **Broken Access Control**: Role-based access, JWT verification, separate admin tokens
6. **Security Misconfiguration**: Helmet.js, security headers, CSP
7. **Cross-Site Scripting (XSS)**: Input sanitization, Content Security Policy
8. **Insecure Deserialization**: Safe JSON parsing only
9. **Using Components with Known Vulnerabilities**: Updated dependencies
10. **Insufficient Logging**: Comprehensive audit logging

## Installation

1. Clone the repository:
```bash
cd HackerZone
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your own admin credentials
```

4. Seed the database with sample challenges:
```bash
node seed.js
```

5. Start the server:
```bash
npm start
```

6. Access the platform:
   - **Main Site**: http://localhost:3000
   - **Admin Panel**: http://localhost:3000/hackur

## Admin Access

The admin panel is located at `/hackur` and requires authentication.

**IMPORTANT**: Admin credentials are stored in the `.env` file and should never be committed to version control!

Set your admin credentials in `.env`:
```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password
```

⚠️ **Security Note**: Change these credentials in production by modifying `config/config.js`

## Admin Capabilities

- ✅ Add new challenges
- ✅ Edit existing challenges
- ✅ Delete challenges
- ✅ Enable/Disable challenges
- ✅ View all users
- ✅ Ban/Unban users
- ✅ View audit logs
- ✅ Dashboard statistics

## Project Structure

```
HackerZone/
├── config/
│   └── config.js           # Configuration settings
├── database/
│   └── db.js               # Database setup and operations
├── middleware/
│   └── security.js         # Security middleware (OWASP)
├── routes/
│   ├── auth.js             # User authentication routes
│   ├── challenges.js       # Challenge API routes
│   ├── leaderboard.js      # Leaderboard routes
│   └── admin.js            # Admin panel routes
├── public/
│   ├── index.html          # Main frontend
│   ├── css/
│   │   └── style.css       # Public styles
│   └── js/
│       └── app.js          # Public JavaScript
├── hackur/                  # Admin panel (protected)
│   ├── index.html          # Admin frontend
│   ├── css/
│   │   └── admin.css       # Admin styles
│   └── js/
│       └── admin.js        # Admin JavaScript
├── server.js               # Main server file
├── seed.js                 # Database seeder
└── package.json            # Dependencies
```

## Challenge Categories

1. **Web Exploitation** - SQL injection, XSS, CSRF, etc.
2. **Cryptography** - Ciphers, hashing, encryption
3. **Reverse Engineering** - Binary analysis, decompilation
4. **Binary Exploitation** - Buffer overflows, ROP chains
5. **Forensics** - File analysis, memory dumps, network captures
6. **OSINT** - Open Source Intelligence gathering
7. **Steganography** - Hidden data in files
8. **Miscellaneous** - Various puzzle types

## API Endpoints

### Public API
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/challenges` - List all challenges (authenticated)
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges/:id/submit` - Submit flag
- `GET /api/leaderboard` - Get leaderboard

### Admin API (requires admin authentication)
- `POST /hackur/api/login` - Admin login
- `POST /hackur/api/logout` - Admin logout
- `GET /hackur/api/dashboard` - Dashboard stats
- `GET /hackur/api/challenges` - List all challenges
- `POST /hackur/api/challenges` - Create challenge
- `PUT /hackur/api/challenges/:id` - Update challenge
- `DELETE /hackur/api/challenges/:id` - Delete challenge
- `POST /hackur/api/challenges/:id/enable` - Enable challenge
- `POST /hackur/api/challenges/:id/disable` - Disable challenge
- `GET /hackur/api/users` - List all users
- `POST /hackur/api/users/:id/ban` - Ban user
- `POST /hackur/api/users/:id/unban` - Unban user
- `GET /hackur/api/logs` - Get audit logs

## Flag Format

All flags follow the format: `HZ{flag_content_here}`

## Rate Limiting

- General: 100 requests per 15 minutes
- Authentication: 10 attempts per 15 minutes
- Admin Panel: 20 requests per 15 minutes
- Flag Submission: 10 per minute

## Production Deployment

For production deployment:

1. Set environment variables:
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-very-long-secure-random-string
JWT_ADMIN_SECRET=another-very-long-secure-random-string
COOKIE_SECRET=yet-another-secure-random-string
```

2. Use HTTPS (required for secure cookies)
3. Change admin credentials
4. Set up proper database backups
5. Configure a reverse proxy (nginx/Apache)

## License

MIT License - Feel free to use for your own CTF events!

## Contributing

Contributions are welcome! Please ensure all code follows security best practices.

---

**Happy Hacking! 🚀**
