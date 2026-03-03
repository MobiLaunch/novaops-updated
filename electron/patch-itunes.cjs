const fs = require('fs');
const path = require('path');

const exePath = path.resolve('itunes-files', 'itunesFlashDll', 'iTunesFlash.exe');
const backupPath = path.resolve('itunes-files', 'itunesFlashDll', 'iTunesFlash.exe.bak');

if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(exePath, backupPath);
}

const buffer = fs.readFileSync(backupPath); // read from clean backup

const badString = "\\cache\\iTunesFlash_";
const newString = ".\\logs\\iTunesFlash_"; // same length!

const badBuffer = Buffer.from(badString, 'ascii');
const newBuffer = Buffer.from(newString, 'ascii');

let count = 0;
for (let i = 0; i < buffer.length - badBuffer.length; i++) {
    let match = true;
    for (let j = 0; j < badBuffer.length; j++) {
        if (buffer[i + j] !== badBuffer[j]) {
            match = false;
            break;
        }
    }

    if (match) {
        console.log(`Found string at offset 0x${i.toString(16)}! Patching...`);
        newBuffer.copy(buffer, i);
        count++;
    }
}

if (count > 0) {
    fs.writeFileSync(exePath, buffer);
    console.log(`Patched ${count} occurrences successfully!`);
} else {
    console.log('String not found in binary.');
}
