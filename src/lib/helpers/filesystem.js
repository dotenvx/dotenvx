const fs = require('fs')

const lax = function (callback) {
    return function relax() {
        try {
            //const result
            //    = fs.existsSync(arguments[0])
            //    ? callback(...arguments)
            //    : null;
            const result = callback(...arguments);

            return result;
        } catch (error) {
            if ('ENOENT' === error.code) {
                return;
            }
            throw error;
        }
    };
};
const filesystem = {
    appendFileLaxSync: lax(fs.appendFileSync),
    appendFileSync: fs.appendFileSync,
    chmodLaxSync: lax(fs.chmodSync),
    chmodSync: fs.chmodSync,
    existsLaxSync: lax(fs.existsSync),
    existsSync: fs.existsSync,
    readFileLaxSync: lax(fs.readFileSync),
    readFileSync: fs.readFileSync,
    readdirLaxSync: lax(fs.readdirSync),
    readdirSync: fs.readdirSync,
    writeFileLaxSync: lax(fs.writeFileSync),
    writeFileSync: fs.writeFileSync,
};

module.exports = filesystem;
