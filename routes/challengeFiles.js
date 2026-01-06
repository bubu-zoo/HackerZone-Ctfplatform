// Challenge Files Router - Serves actual challenge content
const express = require('express');
const router = express.Router();
const path = require('path');

// Serve static challenge files
router.use('/files', express.static(path.join(__dirname, '../challenges/files'), {
    maxAge: '1d'
}));

// ==================== WEB EXPLOITATION CHALLENGES ====================

// Baby SQL - Vulnerable Login
router.get('/web/baby-sql', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>SecureBank Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-box {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
            width: 350px;
        }
        h2 { text-align: center; margin-bottom: 30px; color: #333; }
        .input-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; color: #666; }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        button {
            width: 100%;
            padding: 12px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        }
        button:hover { background: #45a049; }
        .error { color: red; text-align: center; margin-top: 15px; }
        .success { color: green; text-align: center; margin-top: 15px; }
        .hint { font-size: 12px; color: #999; margin-top: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>🏦 SecureBank Login</h2>
        <form method="POST" action="/challenge/web/baby-sql">
            <div class="input-group">
                <label>Username</label>
                <input type="text" name="username" required placeholder="Enter username">
            </div>
            <div class="input-group">
                <label>Password</label>
                <input type="password" name="password" required placeholder="Enter password">
            </div>
            <button type="submit">Login</button>
        </form>
        <p class="hint">Hint: The developer was lazy with input validation...</p>
    </div>
</body>
</html>
    `);
});

router.post('/web/baby-sql', express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    
    // Intentionally vulnerable SQL simulation
    // In real scenario: SELECT * FROM users WHERE username='$username' AND password='$password'
    
    const vulnCheck = (username.includes("'") && (
        password.includes("' OR '1'='1") ||
        password.includes("' or '1'='1") ||
        password.includes("'OR'1'='1") ||
        password.includes("' OR 1=1--") ||
        password.includes("' or 1=1--") ||
        password.includes("'--") ||
        username.includes("admin'--")
    )) || username.includes("admin'--");
    
    if (vulnCheck || (username === "admin'--")) {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
    <style>
        body { 
            font-family: Arial; 
            background: #1a1a2e; 
            color: white; 
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            flex-direction: column;
        }
        .success-box {
            background: #2d2d44;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
        }
        .flag {
            background: #00ff88;
            color: #1a1a2e;
            padding: 15px 30px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 18px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="success-box">
        <h1>🎉 Welcome, Admin!</h1>
        <p>You successfully bypassed the login!</p>
        <div class="flag">HZ{sql_1nj3ct10n_b4s1cs}</div>
    </div>
</body>
</html>
        `);
    } else {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Login Failed</title>
    <style>
        body { 
            font-family: Arial; 
            background: #1a1a2e; 
            color: white; 
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .error-box {
            background: #2d2d44;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
        }
        a { color: #00ff88; }
    </style>
</head>
<body>
    <div class="error-box">
        <h2>❌ Login Failed</h2>
        <p>Invalid username or password</p>
        <p style="margin-top: 20px;"><a href="/challenge/web/baby-sql">Try Again</a></p>
    </div>
</body>
</html>
        `);
    }
});

// Cookie Monster Challenge
router.get('/web/cookie-monster', (req, res) => {
    const isAdmin = req.cookies.isAdmin === 'true';
    
    if (isAdmin) {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Cookie Monster - Admin Area</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .flag { background: #00ff88; color: #1a1a2e; padding: 20px; border-radius: 10px; font-family: monospace; font-size: 20px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>🍪 Welcome Admin!</h1>
    <p>Here's your flag:</p>
    <div class="flag">HZ{c00k13s_4r3_d3l1c10us}</div>
</body>
</html>
        `);
    } else {
        res.cookie('isAdmin', 'false', { httpOnly: false });
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Cookie Monster</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .hint { background: #2d2d44; padding: 20px; border-radius: 10px; margin-top: 30px; }
        code { background: #3d3d54; padding: 5px 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🍪 Cookie Monster's Lair</h1>
    <p>Only admins can see the flag!</p>
    <p>You are currently: <strong>Guest</strong></p>
    <div class="hint">
        <p>💡 Hint: Check your cookies in the browser's Developer Tools (F12)</p>
        <p>Look for a cookie named <code>isAdmin</code></p>
    </div>
</body>
</html>
        `);
    }
});

// XSS Playground
router.get('/web/xss-playground', (req, res) => {
    const search = req.query.search || '';
    const decoded = search;
    
    // Check for XSS payloads
    const xssDetected = decoded.includes('<script>') || 
                        decoded.includes('onerror') || 
                        decoded.includes('onload') ||
                        decoded.includes('javascript:');
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Search Portal</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .search-box { max-width: 600px; margin: 0 auto; }
        input[type="text"] { width: 100%; padding: 15px; font-size: 16px; border: none; border-radius: 5px; }
        button { padding: 15px 30px; background: #00ff88; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 10px; }
        .results { margin-top: 30px; background: #2d2d44; padding: 20px; border-radius: 10px; }
        .flag { background: #00ff88; color: #1a1a2e; padding: 10px 20px; border-radius: 5px; font-family: monospace; display: inline-block; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="search-box">
        <h1>🔍 Search Portal</h1>
        <form method="GET">
            <input type="text" name="search" placeholder="Search anything..." value="${decoded.replace(/"/g, '&quot;')}">
            <button type="submit">Search</button>
        </form>
        ${search ? `
        <div class="results">
            <p>Results for: <strong>${decoded}</strong></p>
            ${xssDetected ? `
                <p style="color: #00ff88;">🎉 XSS Detected! Here's your flag:</p>
                <div class="flag">HZ{xss_cr0ss_s1t3_scr1pt1ng}</div>
            ` : `
                <p>No results found.</p>
                <p style="color: #888; font-size: 14px;">Hint: Try injecting some HTML or JavaScript...</p>
            `}
        </div>
        ` : ''}
    </div>
</body>
</html>
    `);
});

// Path Traversal
router.get('/web/path-traversal', (req, res) => {
    const file = req.query.file || 'report.pdf';
    
    // Check for path traversal
    const hasTraversal = file.includes('../') || file.includes('..\\');
    const targetsEtc = file.includes('etc/passwd') || file.includes('etc\\passwd') || file.includes('flag.txt');
    
    if (hasTraversal && targetsEtc) {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>File Contents</title>
    <style>
        body { font-family: monospace; background: #1a1a2e; color: #00ff88; padding: 50px; }
        pre { background: #2d2d44; padding: 20px; border-radius: 10px; overflow-x: auto; }
        .flag { background: #00ff88; color: #1a1a2e; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <h2>📄 File: ${file}</h2>
    <pre>
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
ctf:x:1000:1000:CTF User:/home/ctf:/bin/bash
flag:x:1337:1337:FLAG_USER:/home/flag:/bin/bash

# FLAG: HZ{d1r3ct0ry_tr4v3rs4l_ftw}
    </pre>
    <div class="flag">HZ{d1r3ct0ry_tr4v3rs4l_ftw}</div>
</body>
</html>
        `);
    } else {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>File Download Service</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .file-list { background: #2d2d44; padding: 20px; border-radius: 10px; margin-top: 20px; }
        a { color: #00ff88; }
        .current { margin-top: 20px; background: #3d3d54; padding: 15px; border-radius: 5px; }
        code { background: #4d4d64; padding: 3px 8px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 File Download Service</h1>
        <div class="file-list">
            <h3>Available Files:</h3>
            <ul>
                <li><a href="?file=report.pdf">report.pdf</a></li>
                <li><a href="?file=invoice.pdf">invoice.pdf</a></li>
                <li><a href="?file=readme.txt">readme.txt</a></li>
            </ul>
        </div>
        <div class="current">
            <p>Current request: <code>/download?file=${file}</code></p>
            <p style="color: #888; font-size: 14px;">💡 Hint: Can you access files outside this directory? Try <code>../</code></p>
        </div>
    </div>
</body>
</html>
        `);
    }
});

// JWT Madness
router.get('/web/jwt-madness', (req, res) => {
    const token = req.query.token || '';
    
    // Simple JWT check (checking for algorithm confusion or none attack)
    let isAdmin = false;
    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                
                // Vulnerable: accepts 'none' algorithm
                if ((header.alg === 'none' || header.alg === 'None' || header.alg === 'NONE') && payload.role === 'admin') {
                    isAdmin = true;
                }
            }
        } catch (e) {
            // Invalid token
        }
    }
    
    if (isAdmin) {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>JWT Admin Panel</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .flag { background: #00ff88; color: #1a1a2e; padding: 20px; border-radius: 10px; font-family: monospace; font-size: 20px; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>🎉 Welcome Admin!</h1>
    <p>You've exploited the JWT algorithm confusion!</p>
    <div class="flag">HZ{jwt_4lg0r1thm_c0nfus10n}</div>
</body>
</html>
        `);
    } else {
        // Generate a sample user token
        const sampleHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64').replace(/=/g, '');
        const samplePayload = Buffer.from(JSON.stringify({ user: 'guest', role: 'user' })).toString('base64').replace(/=/g, '');
        const sampleToken = `${sampleHeader}.${samplePayload}.signature`;
        
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>JWT API</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        pre { background: #2d2d44; padding: 20px; border-radius: 10px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
        code { background: #3d3d54; padding: 3px 8px; border-radius: 3px; }
        .hint { background: #2d2d44; padding: 20px; border-radius: 10px; margin-top: 20px; }
        input { width: 100%; padding: 10px; margin: 10px 0; font-family: monospace; }
        button { padding: 10px 20px; background: #00ff88; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 JWT Authentication API</h1>
        
        <h3>Your current token (as guest):</h3>
        <pre>${sampleToken}</pre>
        
        <h3>Decoded Header:</h3>
        <pre>{ "alg": "HS256", "typ": "JWT" }</pre>
        
        <h3>Decoded Payload:</h3>
        <pre>{ "user": "guest", "role": "user" }</pre>
        
        <h3>Test Your Token:</h3>
        <form method="GET">
            <input type="text" name="token" placeholder="Enter your JWT token" value="${token}">
            <button type="submit">Verify Token</button>
        </form>
        
        <div class="hint">
            <h3>💡 Hints:</h3>
            <ul>
                <li>JWT has three parts: header.payload.signature</li>
                <li>What happens if you change the algorithm to "none"?</li>
                <li>Can you modify the payload to set role to "admin"?</li>
                <li>Base64 encode your modified header and payload</li>
            </ul>
        </div>
    </div>
</body>
</html>
        `);
    }
});

// ==================== CRYPTOGRAPHY CHALLENGES ====================

router.get('/crypto/caesar', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Caesar's Secret Message</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .message { background: #2d2d44; padding: 30px; border-radius: 10px; font-family: monospace; font-size: 24px; margin: 30px auto; max-width: 600px; }
        .hint { color: #888; margin-top: 20px; }
        input { padding: 10px; font-family: monospace; width: 300px; }
        button { padding: 10px 20px; background: #00ff88; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px; }
    </style>
</head>
<body>
    <h1>📜 Caesar's Secret Message</h1>
    <p>Julius Caesar sent this encrypted message to his generals:</p>
    <div class="message">KC{fdhvdu_flskhu_lv_hdvb}</div>
    <p class="hint">The Caesar cipher shifts each letter by a fixed number...</p>
    <p class="hint">Common shift values: 1, 3, 13, 25</p>
    <br><br>
    <p>Think you know the answer? Submit the decrypted flag on the main platform!</p>
</body>
</html>
    `);
});

router.get('/crypto/base64', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Base64 Challenge</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .encoded { background: #2d2d44; padding: 30px; border-radius: 10px; font-family: monospace; font-size: 18px; margin: 30px auto; max-width: 600px; word-break: break-all; }
        .hint { color: #888; }
    </style>
</head>
<body>
    <h1>🔤 Base64 Decoding Challenge</h1>
    <p>Decode this message to find the flag:</p>
    <div class="encoded">SFp7YjRzZTY0X2QzYzBkMW5nX2lzX2Z1bn0=</div>
    <p class="hint">💡 Hint: Base64 is an encoding scheme, not encryption!</p>
    <p class="hint">You can use online tools or command line: <code>echo "..." | base64 -d</code></p>
</body>
</html>
    `);
});

router.get('/crypto/xor', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>XOR Challenge</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 700px; margin: 0 auto; text-align: center; }
        .encrypted { background: #2d2d44; padding: 30px; border-radius: 10px; font-family: monospace; font-size: 16px; margin: 30px 0; word-break: break-all; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: left; }
        code { background: #4d4d64; padding: 3px 8px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⊕ XOR Cipher Challenge</h1>
        <p>The message was encrypted using XOR with a single-byte key:</p>
        <div class="encrypted">
            Hex: 32 3a 19 48 35 27 58 3c 34 58 27 3a 31 3a 27 34 3c 3f 38 3a 5d
        </div>
        <div class="hint">
            <h3>💡 Hints:</h3>
            <ul>
                <li>XOR encryption: ciphertext = plaintext ⊕ key</li>
                <li>XOR decryption: plaintext = ciphertext ⊕ key</li>
                <li>Single-byte key means only 256 possible keys (0x00-0xFF)</li>
                <li>Try brute-forcing all keys and look for readable text</li>
                <li>The flag format starts with <code>HZ{</code></li>
            </ul>
        </div>
        <p style="margin-top: 20px;">Python starter code:</p>
        <pre style="background: #2d2d44; padding: 15px; border-radius: 5px; text-align: left;">
encrypted = bytes.fromhex("32 3a 19 48 35 27 58 3c 34 58 27 3a 31 3a 27 34 3c 3f 38 3a 5d".replace(" ", ""))
for key in range(256):
    decrypted = bytes([b ^ key for b in encrypted])
    if b"HZ{" in decrypted:
        print(f"Key: {key}, Message: {decrypted}")</pre>
    </div>
</body>
</html>
    `);
});

router.get('/crypto/rsa', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>RSA Challenge</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 700px; margin: 0 auto; }
        .params { background: #2d2d44; padding: 30px; border-radius: 10px; font-family: monospace; font-size: 18px; margin: 30px 0; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; }
        code { background: #4d4d64; padding: 3px 8px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 RSA Rookie Challenge</h1>
        <p>You intercepted these RSA parameters. Can you decrypt the message?</p>
        
        <div class="params">
            <p><strong>Public Key:</strong></p>
            <p>n = 3233 (modulus)</p>
            <p>e = 17 (public exponent)</p>
            <br>
            <p><strong>Ciphertext:</strong></p>
            <p>c = 2201</p>
        </div>
        
        <div class="hint">
            <h3>💡 RSA Basics:</h3>
            <ul>
                <li>n = p × q (product of two primes)</li>
                <li>φ(n) = (p-1) × (q-1)</li>
                <li>d = e⁻¹ mod φ(n) (private exponent)</li>
                <li>Decrypt: m = c^d mod n</li>
            </ul>
            <br>
            <h3>Steps to solve:</h3>
            <ol>
                <li>Factor n to find p and q</li>
                <li>Calculate φ(n)</li>
                <li>Find d (modular inverse of e)</li>
                <li>Decrypt: m = c^d mod n</li>
                <li>Convert number to ASCII to get part of the flag</li>
            </ol>
            <br>
            <p>The decrypted number represents ASCII. Flag format: <code>HZ{sm4ll_pr1m3s_4r3_w34k}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

router.get('/crypto/hash', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Hash Cracker</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .hash { background: #2d2d44; padding: 30px; border-radius: 10px; font-family: monospace; font-size: 16px; margin: 30px auto; max-width: 600px; word-break: break-all; }
        .hint { color: #888; }
    </style>
</head>
<body>
    <h1>🔓 Hash Cracker Challenge</h1>
    <p>Can you find the password that produces this MD5 hash?</p>
    <div class="hash">5f4dcc3b5aa765d61d8327deb882cf99</div>
    <p class="hint">💡 Hint: It's a very common password...</p>
    <p class="hint">Try online MD5 lookup tools or rainbow tables</p>
    <p class="hint">Flag format: HZ{the_password}</p>
</body>
</html>
    `);
});

module.exports = router;
