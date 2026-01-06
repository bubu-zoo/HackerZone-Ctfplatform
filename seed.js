// HackerZone - Sample Challenges Seeder
// Run this script to populate the database with sample challenges

// Load environment variables
require('dotenv').config();

const { db, challengeOps, initializeDatabase } = require('./database/db');

const sampleChallenges = [
    // Web Exploitation
    {
        title: "Baby SQL",
        description: "This login form seems vulnerable to SQL injection. Can you bypass the authentication?\n\nHint: What happens when you add some special characters?",
        category: "Web Exploitation",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{sql_1nj3ct10n_b4s1cs}",
        hint: "Try entering ' OR '1'='1 in the password field",
        attachment_url: "/challenge/web/baby-sql",
        is_enabled: 1
    },
    {
        title: "Cookie Monster",
        description: "The admin has a special cookie that grants access to the flag. Can you figure out how to manipulate it?\n\nOpen the challenge and check your browser cookies!",
        category: "Web Exploitation",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{c00k13s_4r3_d3l1c10us}",
        hint: "Check your browser's developer tools (F12) for cookies",
        attachment_url: "/challenge/web/cookie-monster",
        is_enabled: 1
    },
    {
        title: "XSS Playground",
        description: "This search feature reflects user input without proper sanitization. Can you execute JavaScript and trigger an alert?",
        category: "Web Exploitation",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{xss_cr0ss_s1t3_scr1pt1ng}",
        hint: "Try injecting <script> tags or event handlers like onerror",
        attachment_url: "/challenge/web/xss-playground",
        is_enabled: 1
    },
    {
        title: "Path Traversal",
        description: "The file download feature seems to allow more than it should. Can you read files outside the intended directory?",
        category: "Web Exploitation",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{d1r3ct0ry_tr4v3rs4l_ftw}",
        hint: "Try using ../ to navigate outside the allowed directory",
        attachment_url: "/challenge/web/path-traversal",
        is_enabled: 1
    },
    {
        title: "JWT Madness",
        description: "This API uses JWT for authentication. The algorithm verification seems... flexible. Can you forge a token to become admin?",
        category: "Web Exploitation",
        difficulty: "Hard",
        points: 300,
        flag: "HZ{jwt_4lg0r1thm_c0nfus10n}",
        hint: "What happens if you change the algorithm to 'none' in the header?",
        attachment_url: "/challenge/web/jwt-madness",
        is_enabled: 1
    },

    // Cryptography
    {
        title: "Caesar's Secret",
        description: "Julius Caesar sent a secret message to his generals. Can you decode his cipher?\n\nEncrypted: KC{fdhvdu_flskhu_lv_hdvb}",
        category: "Cryptography",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{caesar_cipher_is_easy}",
        hint: "The shift is 3 (ROT3)",
        attachment_url: "/challenge/crypto/caesar",
        is_enabled: 1
    },
    {
        title: "Base64 Basics",
        description: "This message was encoded (not encrypted). Can you decode it?\n\nSFp7YjRzZTY0X2QzYzBkMW5nX2lzX2Z1bn0=",
        category: "Cryptography",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{b4se64_d3c0d1ng_is_fun}",
        hint: "Base64 is an encoding scheme. Use online tools or command line!",
        attachment_url: "/challenge/crypto/base64",
        is_enabled: 1
    },
    {
        title: "XOR Challenge",
        description: "The message was XOR encrypted with a single-byte key. Can you brute force all 256 possible keys?",
        category: "Cryptography",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{x0r_1s_r3v3rs1bl3}",
        hint: "Single byte = only 256 possible keys. Try them all!",
        attachment_url: "/challenge/crypto/xor",
        is_enabled: 1
    },
    {
        title: "RSA Rookie",
        description: "You intercepted RSA parameters with small primes. Can you factor n and decrypt?\n\nn=3233, e=17, c=2201",
        category: "Cryptography",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{sm4ll_pr1m3s_4r3_w34k}",
        hint: "Factor 3233 into two primes, then calculate φ(n) and d",
        attachment_url: "/challenge/crypto/rsa",
        is_enabled: 1
    },
    {
        title: "Hash Cracker",
        description: "Can you crack this MD5 hash?\n\n5f4dcc3b5aa765d61d8327deb882cf99\n\nFlag format: HZ{the_password}",
        category: "Cryptography",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{password}",
        hint: "It's a very common password. Try rainbow tables or online lookups",
        attachment_url: "/challenge/crypto/hash",
        is_enabled: 1
    },

    // Reverse Engineering
    {
        title: "Baby CrackMe",
        description: "This simple crackme compares your input to a hardcoded password. Find the password to get the flag!",
        category: "Reverse Engineering",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{r3v3rs3_3ng1n33r1ng}",
        hint: "Use the 'strings' command or look in a disassembler",
        attachment_url: "/challenge/re/baby-crackme",
        is_enabled: 1
    },
    {
        title: "Simple Keygen",
        description: "This program asks for a serial key. Reverse engineer the validation algorithm to generate a valid key!",
        category: "Reverse Engineering",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{k3yg3n_r3v3rs1ng}",
        hint: "Use Ghidra or IDA to decompile and analyze the validation function",
        attachment_url: "/challenge/re/baby-crackme",
        is_enabled: 1
    },
    {
        title: "Obfuscated Python",
        description: "This Python script has been obfuscated with base64 and chr() calls. Deobfuscate it to find the flag!",
        category: "Reverse Engineering",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{p5th0n5_obfu5c4t3d}",
        hint: "Base64 decode first, then evaluate chr() calls manually or in Python",
        attachment_url: "/challenge/re/obfuscated-python",
        is_enabled: 1
    },
    {
        title: "Android APK",
        description: "Reverse engineer this Android app and find the hardcoded API key. The flag is the API key.",
        category: "Reverse Engineering",
        difficulty: "Hard",
        points: 300,
        flag: "HZ{4ndr01d_4pk_r3v3rs3}",
        hint: "Use jadx or apktool to decompile, then search for API_KEY",
        attachment_url: "/challenge/re/baby-crackme",
        is_enabled: 1
    },

    // Binary Exploitation
    {
        title: "Buffer Overflow 101",
        description: "This program has a classic buffer overflow vulnerability. Overflow the buffer to modify the 'authenticated' variable!",
        category: "Binary Exploitation",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{buff3r_0v3rfl0w_101}",
        hint: "Input more characters than the buffer can hold (16 bytes)",
        attachment_url: "/challenge/pwn/buffer-overflow",
        is_enabled: 1
    },
    {
        title: "Format String",
        description: "This program uses printf unsafely. Leak the flag from memory using format specifiers!",
        category: "Binary Exploitation",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{f0rm4t_str1ng_l34k}",
        hint: "Use %x to read values from the stack",
        attachment_url: "/challenge/pwn/format-string",
        is_enabled: 1
    },
    {
        title: "ROP Chain",
        description: "NX is enabled, but you can still exploit this binary using Return Oriented Programming techniques!",
        category: "Binary Exploitation",
        difficulty: "Hard",
        points: 300,
        flag: "HZ{r0p_ch41n_m4st3r}",
        hint: "Use ROPgadget to find useful gadgets in the binary",
        attachment_url: "/challenge/pwn/buffer-overflow",
        is_enabled: 1
    },
    {
        title: "Heap Exploitation",
        description: "This program has a use-after-free vulnerability. Exploit it to achieve code execution!",
        category: "Binary Exploitation",
        difficulty: "Expert",
        points: 400,
        flag: "HZ{h34p_3xpl01t4t10n}",
        hint: "Understand tcache and fastbin mechanics in glibc",
        attachment_url: "/challenge/pwn/buffer-overflow",
        is_enabled: 1
    },

    // Forensics
    {
        title: "Hidden in Plain Sight",
        description: "There's a secret hidden in this image. Can you find it using basic forensics tools?",
        category: "Forensics",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{str1ngs_r3v34ls_s3cr3ts}",
        hint: "Use strings or exiftool on the image",
        attachment_url: "/challenge/stego/basic-stego",
        is_enabled: 1
    },
    {
        title: "Deleted Files",
        description: "Someone deleted important files from this disk image. Can you recover them?",
        category: "Forensics",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{d3l3t3d_but_n0t_g0n3}",
        hint: "Use Sleuth Kit (fls, icat) or Autopsy",
        attachment_url: "/challenge/forensics/deleted-file",
        is_enabled: 1
    },
    {
        title: "Memory Dump",
        description: "Analyze this memory dump and find the secret key that was stored in memory.",
        category: "Forensics",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{m3m0ry_f0r3ns1cs_rocks}",
        hint: "Use Volatility or strings to search the memory dump",
        attachment_url: "/challenge/forensics/memory-dump",
        is_enabled: 1
    },
    {
        title: "Network Capture",
        description: "Analyze this PCAP file and find the transmitted credentials or flag.",
        category: "Forensics",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{pcap_4nalys1s_ftw}",
        hint: "Use Wireshark, look for HTTP requests or follow TCP streams",
        attachment_url: "/challenge/forensics/pcap-basics",
        is_enabled: 1
    },
    {
        title: "Log Analysis",
        description: "These server logs contain evidence of an attack. Analyze them to find the flag!",
        category: "Forensics",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{l0g_4n4lys1s_d3t3ct1v3}",
        hint: "Look for unusual patterns or encoded data in the logs",
        attachment_url: "/challenge/forensics/pcap-basics",
        is_enabled: 1
    },

    // OSINT
    {
        title: "Find the Location",
        description: "This photo contains GPS coordinates in its metadata. Where was it taken? Find the city name.",
        category: "OSINT",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{g30l0c4t10n_m4st3r}",
        hint: "Use exiftool to extract GPS coordinates, then search on Google Maps",
        attachment_url: "/challenge/osint/image-hunt",
        is_enabled: 1
    },
    {
        title: "Social Media Hunt",
        description: "Find all accounts belonging to the username: h4ck3r_x_2024",
        category: "OSINT",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{0s1nt_us3rn4m3_hunt}",
        hint: "Use Sherlock or similar username search tools",
        attachment_url: "/challenge/osint/username-hunt",
        is_enabled: 1
    },
    {
        title: "Company Recon",
        description: "Research ExampleCorp and find their internal email format. Look for employee information.",
        category: "OSINT",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{c0rp0r4t3_1nt3l}",
        hint: "Check LinkedIn, company website, and email verification tools",
        attachment_url: "/challenge/osint/username-hunt",
        is_enabled: 1
    },
    {
        title: "Domain Investigation",
        description: "Find all subdomains of hackerzone-ctf.com and look for the hidden one with the flag.",
        category: "OSINT",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{subd0m41n_3num3r4t10n}",
        hint: "Use tools like subfinder, amass, or online services",
        attachment_url: "/challenge/osint/username-hunt",
        is_enabled: 1
    },

    // Miscellaneous
    {
        title: "Robots.txt Secrets",
        description: "Every website has secrets they don't want robots to find. Check the usual places!",
        category: "Miscellaneous",
        difficulty: "Easy",
        points: 50,
        flag: "HZ{r0b0ts_txt_s3cr3ts}",
        hint: "Check /robots.txt on websites",
        attachment_url: "/challenge/misc/robots",
        is_enabled: 1
    },
    {
        title: "QR Code",
        description: "Scan this QR code to find the flag!",
        category: "Miscellaneous",
        difficulty: "Easy",
        points: 50,
        flag: "HZ{qr_c0d3_d3c0d3d}",
        hint: "Use any QR code scanner",
        attachment_url: "/challenge/misc/qr-code",
        is_enabled: 1
    },
    {
        title: "Encoding Chain",
        description: "This message was encoded multiple times. Reverse the chain to find the flag!\n\n53474e79625767305832567559323971615735665932686861573439",
        category: "Miscellaneous",
        difficulty: "Medium",
        points: 150,
        flag: "HZ{mult1_3nc0d1ng_fun}",
        hint: "Hex -> Base64 -> Flag. Try CyberChef!",
        attachment_url: "/challenge/misc/encoding-chain",
        is_enabled: 1
    },
    {
        title: "Welcome!",
        description: "Welcome to HackerZone! Here's your first flag for joining:\n\nHZ{w3lc0m3_t0_h4ck3rz0n3}",
        category: "Miscellaneous",
        difficulty: "Easy",
        points: 25,
        flag: "HZ{w3lc0m3_t0_h4ck3rz0n3}",
        hint: "Just copy and paste!",
        is_enabled: 1
    },

    // Steganography
    {
        title: "Basic Stego",
        description: "Something is hidden in the metadata of this image. Find it using basic forensics tools!",
        category: "Steganography",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{str1ngs_r3v34ls_s3cr3ts}",
        hint: "Use strings or exiftool",
        attachment_url: "/challenge/stego/basic-stego",
        is_enabled: 1
    },
    {
        title: "Hidden Archive",
        description: "There's more to this JPEG than meets the eye. Can you extract the hidden data appended to the file?",
        category: "Steganography",
        difficulty: "Easy",
        points: 100,
        flag: "HZ{h1dd3n_z1p_f1l3}",
        hint: "Check if there's data appended after the JPEG end marker (binwalk)",
        attachment_url: "/challenge/stego/basic-stego",
        is_enabled: 1
    },
    {
        title: "Audio Secrets",
        description: "This audio file contains hidden data. Open it in a spectrogram viewer to see the secret!",
        category: "Steganography",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{sp3ctr0gr4m_s3cr3ts}",
        hint: "Use Audacity or Sonic Visualiser, switch to spectrogram view",
        attachment_url: "/challenge/stego/audio-secrets",
        is_enabled: 1
    },
    {
        title: "LSB Extraction",
        description: "Data is hidden in the Least Significant Bits of this image's pixel values.",
        category: "Steganography",
        difficulty: "Medium",
        points: 200,
        flag: "HZ{lsb_st3g4n0gr4phy}",
        hint: "Extract the LSB of each pixel's RGB values using zsteg or Python",
        attachment_url: "/challenge/stego/lsb",
        is_enabled: 1
    },
    {
        title: "Multi-Layer Stego",
        description: "Multiple steganography techniques were used on this file. Uncover all layers to find the flag!",
        category: "Steganography",
        difficulty: "Hard",
        points: 300,
        flag: "HZ{mult1_l4y3r_st3g0}",
        hint: "Check metadata first, then LSB, then look for embedded files",
        attachment_url: "/challenge/stego/lsb",
        is_enabled: 1
    }
];

function seedChallenges() {
    console.log('[SEEDER] Starting to seed challenges...\n');

    // Initialize database first
    initializeDatabase();

    // Clear existing challenges to re-seed with new URLs
    try {
        db.prepare('DELETE FROM challenges').run();
        db.prepare('DELETE FROM solves').run();
        db.prepare('DELETE FROM submissions').run();
        console.log('[SEEDER] Cleared existing challenges for fresh seeding.\n');
    } catch (err) {
        console.log('[SEEDER] No existing data to clear.\n');
    }

    let successCount = 0;
    let errorCount = 0;

    for (const challenge of sampleChallenges) {
        try {
            challengeOps.create(challenge);
            console.log(`[✓] Created: ${challenge.title} (${challenge.category})`);
            successCount++;
        } catch (error) {
            console.error(`[✗] Failed: ${challenge.title} - ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n[SEEDER] Seeding complete!');
    console.log(`[SEEDER] Successfully created: ${successCount} challenges`);
    if (errorCount > 0) {
        console.log(`[SEEDER] Failed: ${errorCount} challenges`);
    }

    // Show summary by category
    console.log('\n[SEEDER] Challenges by category:');
    const categories = db.prepare(`
        SELECT category, COUNT(*) as count, SUM(points) as total_points 
        FROM challenges 
        GROUP BY category 
        ORDER BY category
    `).all();

    categories.forEach(cat => {
        console.log(`  - ${cat.category}: ${cat.count} challenges (${cat.total_points} pts)`);
    });

    console.log('\n[SEEDER] Done! Start the server with: npm start\n');
}

// Run the seeder
seedChallenges();
