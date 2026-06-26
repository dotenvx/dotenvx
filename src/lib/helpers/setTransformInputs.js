const path = require('path')

const fsx = require('./fsx')
const { determine } = require('./envResolution')
const keynames = require('../conventions/keynames')
const { keyValues, keyValuesSync } = require('./keyResolution')
const {
  provision,
  provisionSync,
  provisionWithPrivateKey
} = require('./cryptography')
const detectEncoding = require('./detectEncoding')
const detectEncodingSync = require('./detectEncodingSync')
const Errors = require('./errors')

const TYPE_ENV_FILE = 'envFile'

function initialEnvSrc (envSrc, key, value) {
  if (key && envSrc.trim().length === 0) {
    return {
      envSrc: `${key}="${value}"\n`,
      seededWithInitialKey: true
    }
  }

  return {
    envSrc,
    seededWithInitialKey: false
  }
}

function missingEnvFileError (envFilepath, filepath) {
  return new Errors({ envFilepath, filepath }).missingEnvFile()
}

function prepareSetEnvFileSync ({ key, value, envFilepath, encrypt, envKeysFilepath, noArmor, noCreate, command }) {
  const filepath = path.resolve(envFilepath)
  const row = {
    key: key || null,
    value: value || null,
    type: TYPE_ENV_FILE,
    filepath,
    envFilepath,
    changed: false
  }

  try {
    if (!fsx.existsSync(filepath)) {
      if (noCreate) {
        detectEncodingSync(filepath)
      } else {
        fsx.writeFileXSync(filepath, '')
      }
    }

    const encoding = detectEncodingSync(filepath)
    const seeded = initialEnvSrc(fsx.readFileXSync(filepath, { encoding }), row.key, value)
    row.envSrc = seeded.envSrc
    row.seededWithInitialKey = seeded.seededWithInitialKey

    if (encrypt) {
      const { publicKeyName, privateKeyName } = keynames(filepath)
      const { publicKeyValue, privateKeyValue } = keyValuesSync(filepath, {
        keysFilepath: envKeysFilepath,
        noArmor,
        command
      })

      row.publicKeyName = publicKeyName
      row.privateKeyName = privateKeyName

      if (!privateKeyValue && !publicKeyValue) {
        const prov = provisionSync({
          envSrc: row.envSrc,
          envFilepath,
          keysFilepath: envKeysFilepath,
          noArmor,
          command
        })
        row.envSrc = prov.envSrc
        row.publicKeyValue = prov.publicKey
        row.privateKeyValue = prov.privateKey
        row.envKeysFilepath = prov.envKeysFilepath
        row.localPrivateKeyAdded = prov.localPrivateKeyAdded
        row.remotePrivateKeyAdded = prov.remotePrivateKeyAdded
      } else if (privateKeyValue) {
        const prov = provisionWithPrivateKey({ envSrc: row.envSrc, envFilepath, keysFilepath: envKeysFilepath, privateKeyValue, publicKeyValue, publicKeyName })
        row.envSrc = prov.envSrc
        row.publicKeyValue = prov.publicKey
        row.privateKeyValue = prov.privateKey
      } else if (publicKeyValue) {
        row.publicKeyValue = publicKeyValue
      }
    }
  } catch (error) {
    row.error = error.code === 'ENOENT' ? missingEnvFileError(envFilepath, filepath) : error
  }

  return row
}

async function prepareSetEnvFile ({ key, value, envFilepath, encrypt, envKeysFilepath, noArmor, noCreate, command }) {
  const filepath = path.resolve(envFilepath)
  const row = {
    key: key || null,
    value: value || null,
    type: TYPE_ENV_FILE,
    filepath,
    envFilepath,
    changed: false
  }

  try {
    if (!(await fsx.exists(filepath))) {
      if (noCreate) {
        await detectEncoding(filepath)
      } else {
        await fsx.writeFileX(filepath, '')
      }
    }

    const encoding = await detectEncoding(filepath)
    const seeded = initialEnvSrc(await fsx.readFileX(filepath, { encoding }), row.key, value)
    row.envSrc = seeded.envSrc
    row.seededWithInitialKey = seeded.seededWithInitialKey

    if (encrypt) {
      const { publicKeyName, privateKeyName } = keynames(filepath)
      const { publicKeyValue, privateKeyValue } = await keyValues(filepath, {
        keysFilepath: envKeysFilepath,
        noArmor,
        command
      })

      row.publicKeyName = publicKeyName
      row.privateKeyName = privateKeyName

      if (!privateKeyValue && !publicKeyValue) {
        const prov = await provision({
          envSrc: row.envSrc,
          envFilepath,
          keysFilepath: envKeysFilepath,
          noArmor,
          command
        })
        row.envSrc = prov.envSrc
        row.publicKeyValue = prov.publicKey
        row.privateKeyValue = prov.privateKey
        row.envKeysFilepath = prov.envKeysFilepath
        row.localPrivateKeyAdded = prov.localPrivateKeyAdded
        row.remotePrivateKeyAdded = prov.remotePrivateKeyAdded
      } else if (privateKeyValue) {
        const prov = provisionWithPrivateKey({ envSrc: row.envSrc, envFilepath, keysFilepath: envKeysFilepath, privateKeyValue, publicKeyValue, publicKeyName })
        row.envSrc = prov.envSrc
        row.publicKeyValue = prov.publicKey
        row.privateKeyValue = prov.privateKey
      } else if (publicKeyValue) {
        row.publicKeyValue = publicKeyValue
      }
    }
  } catch (error) {
    row.error = error.code === 'ENOENT' ? missingEnvFileError(envFilepath, filepath) : error
  }

  return row
}

function buildSetTransformInputsSync ({ key, value, envs = [], encrypt = true, envKeysFilepath = null, noArmor = false, noCreate = false, command } = {}) {
  const rows = []

  for (const env of determine(envs, process.env)) {
    if (env.type === TYPE_ENV_FILE) {
      rows.push(prepareSetEnvFileSync({ key, value, envFilepath: env.value, encrypt, envKeysFilepath, noArmor, noCreate, command }))
    }
  }

  return rows
}

async function buildSetTransformInputs ({ key, value, envs = [], encrypt = true, envKeysFilepath = null, noArmor = false, noCreate = false, command } = {}) {
  const rows = []

  for (const env of determine(envs, process.env)) {
    if (env.type === TYPE_ENV_FILE) {
      rows.push(await prepareSetEnvFile({ key, value, envFilepath: env.value, encrypt, envKeysFilepath, noArmor, noCreate, command }))
    }
  }

  return rows
}

module.exports = buildSetTransformInputs
module.exports.sync = buildSetTransformInputsSync
