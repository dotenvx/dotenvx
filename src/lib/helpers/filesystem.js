const fs = require('fs')

const filesystem = {
    appendFileSync: fs.appendFileSync,
    chmodSync: fs.chmodSync,
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync,
    readdirSync: fs.readdirSync,
    writeFileSync: fs.writeFileSync,
};

module.exports = filesystem;
