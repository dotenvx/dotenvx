const fsx = require("../helpers/fsx");
const path = require("path");

const TYPE_ENV_FILE = "envFile";

const Errors = require("../helpers/errors");
const guessPrivateKeyName = require("../helpers/guessPrivateKeyName");
const detectEncoding = require("../helpers/detectEncoding");
const determineEnvs = require("../helpers/determineEnvs");
const { findPrivateKey } = require("../helpers/findPrivateKey");
const decryptPrivateKeys = require("../helpers/decryptPrivateKeys");

class Unlock {
/**
 * Unlock service constructor
 * @param {Array} envs - array of env objects
 * @param {string} envKeysFilepath - path to .env.keys file
 * @param {string} passphrase - passphrase to decrypt private key
 * @param {string} salt - salt to decrypt private key
 */
  constructor(envs = [], envKeysFilepath = null, passphrase = null, salt = null) {
    this.envs = determineEnvs(envs, process.env);
    this.envKeysFilepath = envKeysFilepath;
    this.passphrase = passphrase;
    this.salt = salt;

    this.processedEnvs = [];
    this.changedFilepaths = new Set();
    this.unchangedFilepaths = new Set();
    this.readableFilepaths = new Set();
  }

  run() {
    // example
    // envs [
    //   { type: 'envFile', value: '.env' }
    // ]

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        this._unlockEnvKey(env.value);
      }
    }

    return {
      processedEnvs: this.processedEnvs,
    };
  }

  _unlockEnvKey(envFilepath) {
    const row = {};
    row.type = TYPE_ENV_FILE;

    const filepath = path.resolve(envFilepath);
    row.filepath = filepath;
    row.changed = false;

    try {
      this.readableFilepaths.add(envFilepath);

      const privateKeyName = guessPrivateKeyName(envFilepath);
      const existingPrivateKey = findPrivateKey(
        envFilepath,
        this.envKeysFilepath
      );

      let envKeysFilepath = path.join(path.dirname(filepath), ".env.keys");
      if (this.envKeysFilepath) {
        envKeysFilepath = path.resolve(this.envKeysFilepath);
      }

      if (existingPrivateKey) {
        // .env.keys
        let keysSrc = "";
        if (fsx.existsSync(envKeysFilepath)) {
          keysSrc = fsx.readFileX(envKeysFilepath);
        }

        // encrypt privateKey and replace the line beginning with ${privateKeyName} with the encrypted value
        const decryptedPrivateKey = decryptPrivateKeys(privateKeyName, existingPrivateKey, this.passphrase, this.salt);


        keysSrc = keysSrc.replace(new RegExp(`^${privateKeyName}=.+$`,'m'),`${privateKeyName}=${decryptedPrivateKey}`);

        fsx.writeFileX(envKeysFilepath, keysSrc)

        row.privateKeyAdded = true;
        row.envKeysFilepath =
          this.envKeysFilepath ||
          path.join(path.dirname(envFilepath), path.basename(envKeysFilepath));
        row.privateKeyName = privateKeyName;
        row.envFilepath = envFilepath;
      }
    } catch (e) {
      if (e.code === "ENOENT") {
        row.error = new Errors({ envFilepath, filepath }).missingEnvFile();
      } else {
        row.error = e;
      }
    }

    this.processedEnvs.push(row);
  }

  _detectEncoding(filepath) {
    return detectEncoding(filepath);
  }
}
module.exports = Unlock;
