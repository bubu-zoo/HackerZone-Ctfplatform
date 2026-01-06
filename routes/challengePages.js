// Additional Challenge Pages - Forensics, OSINT, Stego, RE, Binary, Misc
const express = require('express');
const router = express.Router();

// ==================== FORENSICS CHALLENGES ====================

router.get('/forensics/pcap-basics', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>PCAP Analysis</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        .download { background: #00ff88; color: #1a1a2e; padding: 15px 30px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 20px 0; }
        .hint { background: #2d2d44; padding: 20px; border-radius: 10px; margin-top: 20px; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📡 Network Traffic Analysis</h1>
        <p>We captured network traffic from a suspicious server. Can you find the hidden flag?</p>
        
        <p>Download: <a href="/challenge/files/suspicious_traffic.pcap" class="download">suspicious_traffic.pcap</a></p>
        
        <p style="color: #888;">(Since this is a demo, here's what the PCAP would contain:)</p>
        <pre>
Frame 1: TCP SYN to 192.168.1.100:80
Frame 2: TCP SYN-ACK from 192.168.1.100:80
Frame 3: HTTP GET /secret.txt
Frame 4: HTTP Response 200 OK
    Content: "The secret password is: HZ{pcap_4nalys1s_ftw}"
        </pre>
        
        <div class="hint">
            <h3>💡 Tools to use:</h3>
            <ul>
                <li>Wireshark - GUI network analyzer</li>
                <li>tshark - Command line tool</li>
                <li>strings - Extract readable strings</li>
            </ul>
            <p>Flag: <code>HZ{pcap_4nalys1s_ftw}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

router.get('/forensics/memory-dump', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Memory Forensics</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        .hint { background: #2d2d44; padding: 20px; border-radius: 10px; margin: 20px 0; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 Memory Dump Analysis</h1>
        <p>A system was compromised. Analyze the memory dump to find what the attacker accessed.</p>
        
        <p>Simulated memory dump excerpt with the flag hidden:</p>
        <pre>
0x00001000: 4D5A9000 03000000 04000000 FFFF0000  MZ..............
0x00001010: B8000000 00000000 40000000 00000000  ........@.......
0x00001020: 00000000 00000000 00000000 00000000  ................
... (memory contents) ...
0x0004A200: 73656372 6574206B 65793A20           secret key: 
0x0004A210: 485A7B6D 336D3072 795F6630 7233346E  HZ{m3m0ry_f0r34n
0x0004A220: 73316373 5F726F63 6B737D00           s1cs_rocks}.
... (more memory) ...
0x00050000: 00000000 00000000 00000000 00000000  ................
        </pre>
        
        <div class="hint">
            <h3>💡 Memory Forensics Tools:</h3>
            <ul>
                <li>Volatility Framework - Most popular memory analysis tool</li>
                <li>strings - Quick search for readable text</li>
                <li>grep - Search for patterns</li>
            </ul>
            <p>Flag: <code>HZ{m3m0ry_f0r3ns1cs_rocks}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

router.get('/forensics/deleted-file', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>File Recovery</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        .hint { background: #2d2d44; padding: 20px; border-radius: 10px; margin: 20px 0; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗑️ Deleted File Recovery</h1>
        <p>A suspect deleted an important file. Can you recover it from the disk image?</p>
        
        <p>Disk image analysis reveals:</p>
        <pre>
$ fls -r disk.img
r/r 5:    budget.xlsx
r/r 6:    report.docx
d/d 7:    .deleted/
r/r * 8:  secret_flag.txt (deleted)

$ icat disk.img 8
This file was supposed to be deleted!
But here's the flag: HZ{d3l3t3d_but_n0t_g0n3}
        </pre>
        
        <div class="hint">
            <h3>💡 File Recovery Tools:</h3>
            <ul>
                <li>Autopsy - Digital forensics platform</li>
                <li>Sleuth Kit (fls, icat) - Command line tools</li>
                <li>TestDisk/PhotoRec - Recovery utilities</li>
            </ul>
            <p>Flag: <code>HZ{d3l3t3d_but_n0t_g0n3}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

// ==================== STEGANOGRAPHY CHALLENGES ====================

router.get('/stego/basic-stego', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Hidden Image</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .image-container { background: #2d2d44; padding: 30px; border-radius: 10px; margin: 30px auto; max-width: 600px; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; text-align: left; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🖼️ Hidden in Plain Sight</h1>
    <p>This innocent-looking image contains a secret. Can you find it?</p>
    
    <div class="image-container">
        <p>📷 [challenge_image.png would be here]</p>
        <p style="color: #888;">The flag is hidden using basic steganography techniques</p>
    </div>
    
    <p>For this demo challenge, run strings or exiftool on an image!</p>
    
    <pre>
$ strings challenge_image.png | grep HZ
HZ{str1ngs_r3v34ls_s3cr3ts}

$ exiftool challenge_image.png
...
Comment: Flag: HZ{str1ngs_r3v34ls_s3cr3ts}
...
    </pre>
    
    <div class="hint">
        <h3>💡 Steganography Tools:</h3>
        <ul>
            <li><code>strings</code> - Find readable text in binary files</li>
            <li><code>exiftool</code> - Read metadata</li>
            <li><code>binwalk</code> - Analyze embedded files</li>
            <li><code>steghide</code> - Extract hidden data</li>
        </ul>
        <p>Flag: <code>HZ{str1ngs_r3v34ls_s3cr3ts}</code></p>
    </div>
</body>
</html>
    `);
});

router.get('/stego/audio-secrets', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Audio Steganography</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .hint { background: #2d2d44; padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 600px; text-align: left; }
    </style>
</head>
<body>
    <h1>🎵 Hidden in the Sound</h1>
    <p>This audio file contains hidden data. Open it in a spectrogram viewer!</p>
    
    <p style="color: #888;">Audio spectrograms can hide visual messages in frequency data</p>
    
    <div class="hint">
        <h3>💡 How to Solve:</h3>
        <ol>
            <li>Open the audio file in Audacity or Sonic Visualiser</li>
            <li>Switch to spectrogram view</li>
            <li>Look for visual patterns in the frequency data</li>
        </ol>
        <p>The spectrogram would reveal: <code>HZ{sp3ctr0gr4m_s3cr3ts}</code></p>
    </div>
</body>
</html>
    `);
});

router.get('/stego/lsb', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>LSB Steganography</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔬 LSB Steganography</h1>
        <p>Data is hidden in the Least Significant Bits of this image's pixels.</p>
        
        <p>Python script to extract LSB data:</p>
        <pre>
from PIL import Image

def extract_lsb(image_path):
    img = Image.open(image_path)
    pixels = list(img.getdata())
    
    binary = ''
    for pixel in pixels:
        for color in pixel[:3]:  # RGB
            binary += str(color & 1)
    
    # Convert binary to text
    chars = [binary[i:i+8] for i in range(0, len(binary), 8)]
    message = ''.join([chr(int(c, 2)) for c in chars if int(c, 2) != 0])
    
    return message

# Would output: HZ{lsb_st3g4n0gr4phy}
        </pre>
        
        <div class="hint">
            <h3>💡 LSB Explained:</h3>
            <p>Each pixel has RGB values (0-255). Modifying the least significant bit barely changes the color but can encode data.</p>
            <p>Flag: <code>HZ{lsb_st3g4n0gr4phy}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

// ==================== REVERSE ENGINEERING ====================

router.get('/re/baby-crackme', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Baby CrackMe</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Baby CrackMe</h1>
        <p>Find the correct password to get the flag!</p>
        
        <p>Pseudocode from the binary:</p>
        <pre>
int main() {
    char input[50];
    char password[] = "secretpass123";
    
    printf("Enter password: ");
    scanf("%s", input);
    
    if (strcmp(input, password) == 0) {
        printf("Correct! Flag: HZ{r3v3rs3_3ng1n33r1ng}\\n");
    } else {
        printf("Wrong password!\\n");
    }
    
    return 0;
}
        </pre>
        
        <p>Using strings on the binary:</p>
        <pre>
$ strings crackme | grep -i secret
secretpass123
        </pre>
        
        <div class="hint">
            <h3>💡 RE Tools:</h3>
            <ul>
                <li><code>strings</code> - Find readable strings</li>
                <li><code>ltrace/strace</code> - Trace library/system calls</li>
                <li>Ghidra, IDA Free, radare2 - Disassemblers</li>
            </ul>
            <p>Password: <code>secretpass123</code></p>
            <p>Flag: <code>HZ{r3v3rs3_3ng1n33r1ng}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

router.get('/re/obfuscated-python', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Obfuscated Python</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐍 Obfuscated Python</h1>
        <p>Deobfuscate this Python code to find the flag:</p>
        
        <pre>
import base64
exec(base64.b64decode('cHJpbnQoIkhaeyIgKyBjaHIoMTEyKSArIGNocig1MykgKyBjaHIoMTE2KSArICJoIiArIGNocig0OCkgKyAibiIgKyBjaHIoNTMpICsgIl8iICsgY2hyKDExMSkgKyAiYiIgKyAiZnUiICsgY2hyKDUzKSArIGNocig5OSkgKyAiNHQzZH0iKQ=='))
        </pre>
        
        <p>Step 1: Decode the base64:</p>
        <pre>
>>> import base64
>>> base64.b64decode('cHJpbnQoIkhaeyIgKyBjaH...')
b'print("HZ{" + chr(112) + chr(53) + chr(116) + "h" + chr(48) + "n" + chr(53) + "_" + chr(111) + "b" + "fu" + chr(53) + chr(99) + "4t3d}")'
        </pre>
        
        <p>Step 2: Execute or manually decode the chr() calls:</p>
        <pre>
chr(112) = 'p'
chr(53)  = '5'
chr(116) = 't'
chr(48)  = '0'
chr(111) = 'o'
chr(99)  = 'c'

Result: HZ{p5th0n5_obfu5c4t3d}
        </pre>
        
        <div class="hint">
            <p>Flag: <code>HZ{p5th0n5_obfu5c4t3d}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

// ==================== BINARY EXPLOITATION ====================

router.get('/pwn/buffer-overflow', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Buffer Overflow 101</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; }
        .danger { color: #ff6b6b; }
    </style>
</head>
<body>
    <div class="container">
        <h1>💥 Buffer Overflow 101</h1>
        <p>Exploit this vulnerable program to get the flag!</p>
        
        <p>Vulnerable C code:</p>
        <pre>
#include &lt;stdio.h&gt;
#include &lt;string.h&gt;

int authenticated = 0;
char buffer[32];

void login() {
    char input[16];  // <span class="danger">Only 16 bytes!</span>
    
    printf("Enter password: ");
    gets(input);     // <span class="danger">Dangerous function - no bounds checking!</span>
    
    if (strcmp(input, "sup3rs3cr3t") == 0) {
        authenticated = 1;
    }
}

int main() {
    login();
    
    if (authenticated) {
        printf("Flag: HZ{buff3r_0v3rfl0w_101}\\n");
    } else {
        printf("Access denied.\\n");
    }
    return 0;
}
        </pre>
        
        <p>Memory layout:</p>
        <pre>
Stack:
+------------------+
|   return addr    | <- Higher addresses
+------------------+
|   saved ebp      |
+------------------+
|   authenticated  | <- This is AFTER input buffer
+------------------+
|   input[16]      | <- Overflow this!
+------------------+
        </pre>
        
        <div class="hint">
            <h3>💡 Exploitation:</h3>
            <p>Send more than 16 characters to overflow into the <code>authenticated</code> variable!</p>
            <pre>$ python -c 'print("A"*20)' | ./vulnerable</pre>
            <p>Flag: <code>HZ{buff3r_0v3rfl0w_101}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

router.get('/pwn/format-string', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Format String Attack</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 800px; margin: 0 auto; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Format String Vulnerability</h1>
        <p>Exploit the format string vulnerability to leak the flag from memory!</p>
        
        <pre>
#include &lt;stdio.h&gt;

int main() {
    char flag[] = "HZ{f0rm4t_str1ng_l34k}";
    char input[100];
    
    printf("Enter your name: ");
    fgets(input, 100, stdin);
    
    printf("Hello, ");
    printf(input);  // VULNERABLE! No format specifier
    
    return 0;
}
        </pre>
        
        <p>Exploitation:</p>
        <pre>
$ ./vuln
Enter your name: %x %x %x %x %x %x
Hello, 8049560 64 f7fc1000 <span style="color:#00ff88;">485a7b66</span> 30726d34 ...

# 485a7b66 = "HZ{f" in hex (little endian)
        </pre>
        
        <div class="hint">
            <h3>💡 Format String Exploits:</h3>
            <ul>
                <li>%x - Read from stack (hex)</li>
                <li>%s - Read string from pointer on stack</li>
                <li>%n - Write to memory!</li>
            </ul>
            <p>Flag: <code>HZ{f0rm4t_str1ng_l34k}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

// ==================== OSINT CHALLENGES ====================

router.get('/osint/username-hunt', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Username Hunt</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .profile { background: #2d2d44; padding: 30px; border-radius: 10px; margin: 30px auto; max-width: 500px; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; max-width: 500px; margin-left: auto; margin-right: auto; text-align: left; }
    </style>
</head>
<body>
    <h1>🔍 Username Investigation</h1>
    <p>We found a suspicious user with the handle: <strong>h4ck3r_x_2024</strong></p>
    
    <div class="profile">
        <h3>Target Profile</h3>
        <p>Username: h4ck3r_x_2024</p>
        <p>Last seen: HackerZone Forums</p>
        <p>Interests: CTF, Security Research</p>
    </div>
    
    <p>Find their profile across the internet to discover the flag!</p>
    
    <div class="hint">
        <h3>💡 OSINT Tools:</h3>
        <ul>
            <li>Sherlock - Username search across platforms</li>
            <li>WhatsMyName - Username enumeration</li>
            <li>Google dorking: "h4ck3r_x_2024"</li>
        </ul>
        <p>For this demo: Flag: <code>HZ{0s1nt_us3rn4m3_hunt}</code></p>
    </div>
</body>
</html>
    `);
});

router.get('/osint/image-hunt', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Image Geolocation</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .image-box { background: #2d2d44; padding: 30px; border-radius: 10px; margin: 30px auto; max-width: 600px; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; max-width: 600px; margin-left: auto; margin-right: auto; text-align: left; }
        pre { background: #2d2d44; padding: 15px; border-radius: 5px; text-align: left; }
    </style>
</head>
<body>
    <h1>📍 Image Geolocation</h1>
    <p>Find where this photo was taken!</p>
    
    <div class="image-box">
        <p>🖼️ [suspect_photo.jpg]</p>
        <p style="color: #888;">The image contains EXIF GPS data</p>
    </div>
    
    <p>EXIF data from the image:</p>
    <pre>
$ exiftool suspect_photo.jpg
...
GPS Latitude: 37° 47' 36.00" N
GPS Longitude: 122° 25' 12.00" W
GPS Position: 37.793333, -122.42
Date/Time Original: 2024:01:15 14:30:22
Camera Model: iPhone 15 Pro
...
    </pre>
    
    <div class="hint">
        <h3>💡 OSINT Tools for Images:</h3>
        <ul>
            <li>exiftool - Extract EXIF metadata</li>
            <li>Google Maps - Lookup coordinates</li>
            <li>Google Images - Reverse image search</li>
        </ul>
        <p>Location: San Francisco, California</p>
        <p>Flag: <code>HZ{g30l0c4t10n_m4st3r}</code></p>
    </div>
</body>
</html>
    `);
});

// ==================== MISCELLANEOUS ====================

router.get('/misc/robots', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Robot Secrets</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 700px; margin: 0 auto; }
        pre { background: #2d2d44; padding: 20px; border-radius: 10px; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Robot Secrets</h1>
        <p>Every website has secrets they don't want robots to find...</p>
        
        <p>Check this website's robots.txt:</p>
        <pre>
# robots.txt for HackerZone

User-agent: *
Allow: /

# Please don't look here!
Disallow: /super-secret-admin/
Disallow: /backup/
Disallow: /flag-is-here/
# Flag: HZ{r0b0ts_txt_s3cr3ts}
        </pre>
        
        <div class="hint">
            <h3>💡 Web Recon:</h3>
            <ul>
                <li>Always check /robots.txt</li>
                <li>Also try: /sitemap.xml, /.git, /backup, /admin</li>
                <li>Use tools like dirbuster or gobuster</li>
            </ul>
            <p>Flag: <code>HZ{r0b0ts_txt_s3cr3ts}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

router.get('/misc/qr-code', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>QR Code Challenge</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; text-align: center; }
        .qr-box { background: #2d2d44; padding: 30px; border-radius: 10px; margin: 30px auto; max-width: 400px; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; max-width: 500px; margin-left: auto; margin-right: auto; }
    </style>
</head>
<body>
    <h1>📱 QR Code Mystery</h1>
    <p>Scan this QR code to find the flag!</p>
    
    <div class="qr-box">
        <p>🔳 [QR Code Image Here]</p>
        <p style="color: #888; font-size: 12px;">The QR code encodes the flag directly</p>
    </div>
    
    <div class="hint">
        <h3>💡 QR Code Tools:</h3>
        <ul style="text-align: left;">
            <li>Phone camera</li>
            <li>Online QR decoders</li>
            <li>zbarimg command line tool</li>
        </ul>
        <p>Flag: <code>HZ{qr_c0d3_d3c0d3d}</code></p>
    </div>
</body>
</html>
    `);
});

router.get('/misc/encoding-chain', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Encoding Chain</title>
    <style>
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 50px; }
        .container { max-width: 700px; margin: 0 auto; text-align: center; }
        .encoded { background: #2d2d44; padding: 30px; border-radius: 10px; font-family: monospace; font-size: 14px; margin: 30px 0; word-break: break-all; }
        .hint { background: #3d3d54; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: left; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔗 Encoding Chain</h1>
        <p>This message was encoded multiple times. Reverse the chain!</p>
        
        <div class="encoded">
            53474e79625767305832567559323971615735665932686861573439
        </div>
        
        <div class="hint">
            <h3>💡 Decoding Steps:</h3>
            <ol>
                <li>Hex decode → SGVybGh0X2VuY29qaW5fY2hhaW49</li>
                <li>Base64 decode → HZ{mult1_3nc0d1ng_fun}</li>
            </ol>
            <p>Common encodings: Base64, Hex, URL encoding, ROT13</p>
            <p>Tool: CyberChef is great for encoding chains!</p>
            <p>Flag: <code>HZ{mult1_3nc0d1ng_fun}</code></p>
        </div>
    </div>
</body>
</html>
    `);
});

module.exports = router;
