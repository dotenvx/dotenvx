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
/*
grep -r 'fs' src/
src/cli/actions/decrypt.js:const fs = require('fs')
src/cli/actions/decrypt.js:          fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
src/cli/actions/encrypt.js:const fs = require('fs')
src/cli/actions/encrypt.js:          fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
src/cli/actions/ext/genexample.js:const fs = require('fs')
src/cli/actions/ext/genexample.js:    fs.writeFileSync(exampleFilepath, envExampleFile, ENCODING)
src/cli/actions/ext/gitignore.js:const fs = require('fs')
src/cli/actions/ext/gitignore.js:    fs.appendFileSync(this.filename, `\n${str}`)
src/cli/actions/ext/gitignore.js:    if (!fs.existsSync(this.filename)) {
src/cli/actions/ext/gitignore.js:        fs.writeFileSync(this.filename, '')
src/cli/actions/ext/gitignore.js:    const lines = fs.readFileSync(this.filename, 'utf8').split(/\r?\n/)
src/cli/actions/ext/prebuild.js:const fs = require('fs')
src/cli/actions/ext/prebuild.js:  if (!fs.existsSync('.dockerignore')) {
src/cli/actions/ext/prebuild.js:  const ig = ignore().add(fs.readFileSync('.dockerignore').toString())
src/cli/actions/ext/prebuild.js:  const files = fs.readdirSync(process.cwd())
src/cli/actions/set.js:const fs = require('fs')
src/cli/actions/set.js:        fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
src/lib/helpers/detectEncoding.js:const fs = require('fs')
src/lib/helpers/detectEncoding.js:  const buffer = fs.readFileSync(filepath)
src/lib/helpers/executeDynamic.js:const fs = require('fs')
src/lib/helpers/executeDynamic.js:      const pro = fs.readFileSync(path.join(__dirname, './../../cli/pro.txt'), 'utf8')
src/lib/helpers/findEnvFiles.js:const fs = require('fs')
src/lib/helpers/findEnvFiles.js:    const files = fs.readdirSync(directory)
src/lib/helpers/findOrCreatePublicKey.js:const fs = require('fs')
src/lib/helpers/findOrCreatePublicKey.js:  let envSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
src/lib/helpers/findOrCreatePublicKey.js:  if (fs.existsSync(envKeysFilepath)) {
src/lib/helpers/findOrCreatePublicKey.js:    keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
src/lib/helpers/installPrecommitHook.js:const fs = require('fs')
src/lib/helpers/installPrecommitHook.js:    return fs.existsSync(this.hookPath)
src/lib/helpers/installPrecommitHook.js:    return fs.readFileSync(this.hookPath, 'utf8')
src/lib/helpers/installPrecommitHook.js:    fs.writeFileSync(this.hookPath, HOOK_SCRIPT)
src/lib/helpers/installPrecommitHook.js:    fs.chmodSync(this.hookPath, '755') // Make the file executable
src/lib/helpers/installPrecommitHook.js:    fs.appendFileSync(this.hookPath, '\n' + HOOK_SCRIPT)
src/lib/helpers/isIgnoringDotenvKeys.js:const fs = require('fs')
src/lib/helpers/isIgnoringDotenvKeys.js:  if (!fs.existsSync('.gitignore')) {
src/lib/helpers/isIgnoringDotenvKeys.js:  const gitignore = fs.readFileSync('.gitignore').toString()
src/lib/helpers/smartDotenvPrivateKey.js:const fs = require('fs')
src/lib/helpers/smartDotenvPrivateKey.js:  if (fs.existsSync(envKeysFilepath)) {
src/lib/helpers/smartDotenvPrivateKey.js:    const keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
src/lib/helpers/smartDotenvPrivateKey.js:  if (!fs.existsSync(envFilepath)) {
src/lib/helpers/smartDotenvPrivateKey.js:  const envSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
src/lib/helpers/smartDotenvPublicKey.js:const fs = require('fs')
src/lib/helpers/smartDotenvPublicKey.js:  if (fs.existsSync(envFilepath)) {
src/lib/helpers/smartDotenvPublicKey.js:    const keysSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
src/lib/services/decrypt.js:const fs = require('fs')
src/lib/services/decrypt.js:        let src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/encrypt.js:const fs = require('fs')
src/lib/services/encrypt.js:        let src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/encrypt.js:        fs.writeFileSync(envKeysFilepath, keysSrc)
src/lib/services/genexample.js:const fs = require('fs')
src/lib/services/genexample.js:      if (!fs.existsSync(filepath)) {
src/lib/services/genexample.js:      let src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/genexample.js:    if (!fs.existsSync(this.exampleFilepath)) {
src/lib/services/genexample.js:      exampleSrc = fs.readFileSync(this.exampleFilepath, ENCODING)
src/lib/services/precommit.js:const fs = require('fs')
src/lib/services/precommit.js:      if (!fs.existsSync('.gitignore')) {
src/lib/services/precommit.js:        gitignore = fs.readFileSync('.gitignore').toString()
src/lib/services/precommit.js:              const src = fs.readFileSync(file).toString()
src/lib/services/run.js:const fs = require('fs')
src/lib/services/run.js:      const src = fs.readFileSync(filepath, { encoding })
src/lib/services/run.js:    if (!fs.existsSync(filepath)) {
src/lib/services/run.js:    const src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/sets.js:const fs = require('fs')
src/lib/services/sets.js:        let src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/sets.js:          fs.writeFileSync(envKeysFilepath, keysSrc)

- No require('fs') renamed fs

grep -r 'fs\.' src/
src/cli/actions/decrypt.js:          fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
src/cli/actions/encrypt.js:          fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
src/cli/actions/ext/genexample.js:    fs.writeFileSync(exampleFilepath, envExampleFile, ENCODING)
src/cli/actions/ext/gitignore.js:    fs.appendFileSync(this.filename, `\n${str}`)
src/cli/actions/ext/gitignore.js:    if (!fs.existsSync(this.filename)) {
src/cli/actions/ext/gitignore.js:        fs.writeFileSync(this.filename, '')
src/cli/actions/ext/gitignore.js:    const lines = fs.readFileSync(this.filename, 'utf8').split(/\r?\n/)
src/cli/actions/ext/prebuild.js:  if (!fs.existsSync('.dockerignore')) {
src/cli/actions/ext/prebuild.js:  const ig = ignore().add(fs.readFileSync('.dockerignore').toString())
src/cli/actions/ext/prebuild.js:  const files = fs.readdirSync(process.cwd())
src/cli/actions/set.js:        fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
src/lib/helpers/detectEncoding.js:  const buffer = fs.readFileSync(filepath)
src/lib/helpers/executeDynamic.js:      const pro = fs.readFileSync(path.join(__dirname, './../../cli/pro.txt'), 'utf8')
src/lib/helpers/findEnvFiles.js:    const files = fs.readdirSync(directory)
src/lib/helpers/findOrCreatePublicKey.js:  let envSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
src/lib/helpers/findOrCreatePublicKey.js:  if (fs.existsSync(envKeysFilepath)) {
src/lib/helpers/findOrCreatePublicKey.js:    keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
src/lib/helpers/installPrecommitHook.js:    return fs.existsSync(this.hookPath)
src/lib/helpers/installPrecommitHook.js:    return fs.readFileSync(this.hookPath, 'utf8')
src/lib/helpers/installPrecommitHook.js:    fs.writeFileSync(this.hookPath, HOOK_SCRIPT)
src/lib/helpers/installPrecommitHook.js:    fs.chmodSync(this.hookPath, '755') // Make the file executable
src/lib/helpers/installPrecommitHook.js:    fs.appendFileSync(this.hookPath, '\n' + HOOK_SCRIPT)
src/lib/helpers/isIgnoringDotenvKeys.js:  if (!fs.existsSync('.gitignore')) {
src/lib/helpers/isIgnoringDotenvKeys.js:  const gitignore = fs.readFileSync('.gitignore').toString()
src/lib/helpers/smartDotenvPrivateKey.js:  if (fs.existsSync(envKeysFilepath)) {
src/lib/helpers/smartDotenvPrivateKey.js:    const keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
src/lib/helpers/smartDotenvPrivateKey.js:  if (!fs.existsSync(envFilepath)) {
src/lib/helpers/smartDotenvPrivateKey.js:  const envSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
src/lib/helpers/smartDotenvPublicKey.js:  if (fs.existsSync(envFilepath)) {
src/lib/helpers/smartDotenvPublicKey.js:    const keysSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
src/lib/services/decrypt.js:        let src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/encrypt.js:        let src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/encrypt.js:        fs.writeFileSync(envKeysFilepath, keysSrc)
src/lib/services/genexample.js:      if (!fs.existsSync(filepath)) {
src/lib/services/genexample.js:      let src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/genexample.js:    if (!fs.existsSync(this.exampleFilepath)) {
src/lib/services/genexample.js:      exampleSrc = fs.readFileSync(this.exampleFilepath, ENCODING)
src/lib/services/precommit.js:      if (!fs.existsSync('.gitignore')) {
src/lib/services/precommit.js:        gitignore = fs.readFileSync('.gitignore').toString()
src/lib/services/precommit.js:              const src = fs.readFileSync(file).toString()
src/lib/services/run.js:      const src = fs.readFileSync(filepath, { encoding })
src/lib/services/run.js:    if (!fs.existsSync(filepath)) {
src/lib/services/run.js:    const src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/sets.js:        let src = fs.readFileSync(filepath, { encoding: ENCODING })
src/lib/services/sets.js:          fs.writeFileSync(envKeysFilepath, keysSrc)

fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
fs.writeFileSync(exampleFilepath, envExampleFile, ENCODING)
fs.appendFileSync(this.filename, `\n${str}`)
if (!fs.existsSync(this.filename)) {
fs.writeFileSync(this.filename, '')
const lines = fs.readFileSync(this.filename, 'utf8').split(/\r?\n/)
if (!fs.existsSync('.dockerignore')) {
const ig = ignore().add(fs.readFileSync('.dockerignore').toString())
const files = fs.readdirSync(process.cwd())
fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)
const buffer = fs.readFileSync(filepath)
const pro = fs.readFileSync(path.join(__dirname, './../../cli/pro.txt'), 'utf8')
const files = fs.readdirSync(directory)
let envSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
if (fs.existsSync(envKeysFilepath)) {
keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
return fs.existsSync(this.hookPath)
return fs.readFileSync(this.hookPath, 'utf8')
fs.writeFileSync(this.hookPath, HOOK_SCRIPT)
fs.chmodSync(this.hookPath, '755') // Make the file executable
fs.appendFileSync(this.hookPath, '\n' + HOOK_SCRIPT)
if (!fs.existsSync('.gitignore')) {
const gitignore = fs.readFileSync('.gitignore').toString()
if (fs.existsSync(envKeysFilepath)) {
const keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
if (!fs.existsSync(envFilepath)) {
const envSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
if (fs.existsSync(envFilepath)) {
const keysSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
let src = fs.readFileSync(filepath, { encoding: ENCODING })
let src = fs.readFileSync(filepath, { encoding: ENCODING })
fs.writeFileSync(envKeysFilepath, keysSrc)
if (!fs.existsSync(filepath)) {
let src = fs.readFileSync(filepath, { encoding: ENCODING })
if (!fs.existsSync(this.exampleFilepath)) {
exampleSrc = fs.readFileSync(this.exampleFilepath, ENCODING)
if (!fs.existsSync('.gitignore')) {
gitignore = fs.readFileSync('.gitignore').toString()
const src = fs.readFileSync(file).toString()
const src = fs.readFileSync(filepath, { encoding })
if (!fs.existsSync(filepath)) {
const src = fs.readFileSync(filepath, { encoding: ENCODING })
let src = fs.readFileSync(filepath, { encoding: ENCODING })
fs.writeFileSync(envKeysFilepath, keysSrc)

fs.writeFileSync
fs.writeFileSync
fs.writeFileSync
fs.appendFileSync
if (!fs.existsSync
fs.writeFileSync
const lines = fs.readFileSync
if (!fs.existsSync
const ig = ignore().add(fs.readFileSync
const files = fs.readdirSync
fs.writeFileSync
const buffer = fs.readFileSync
const pro = fs.readFileSync
const files = fs.readdirSync
let envSrc = fs.readFileSync
if (fs.existsSync
keysSrc = fs.readFileSync
return fs.existsSync
return fs.readFileSync
fs.writeFileSync
fs.chmodSync
fs.appendFileSync
if (!fs.existsSync
const gitignore = fs.readFileSync
if (fs.existsSync
const keysSrc = fs.readFileSync
if (!fs.existsSync
const envSrc = fs.readFileSync
if (fs.existsSync
const keysSrc = fs.readFileSync
let src = fs.readFileSync
let src = fs.readFileSync
fs.writeFileSync
if (!fs.existsSync
let src = fs.readFileSync
if (!fs.existsSync
exampleSrc = fs.readFileSync
if (!fs.existsSync
gitignore = fs.readFileSync
const src = fs.readFileSync
const src = fs.readFileSync
if (!fs.existsSync
const src = fs.readFileSync
let src = fs.readFileSync
fs.writeFileSync

fs.writeFileSync
fs.writeFileSync
fs.writeFileSync
fs.appendFileSync
fs.existsSync
fs.writeFileSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.readdirSync
fs.writeFileSync
fs.readFileSync
fs.readFileSync
fs.readdirSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.writeFileSync
fs.chmodSync
fs.appendFileSync
fs.existsSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.writeFileSync
fs.existsSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.existsSync
fs.readFileSync
fs.readFileSync
fs.writeFileSync

fs.appendFileSync
fs.appendFileSync
fs.chmodSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.existsSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readFileSync
fs.readdirSync
fs.readdirSync
fs.writeFileSync
fs.writeFileSync
fs.writeFileSync
fs.writeFileSync
fs.writeFileSync
fs.writeFileSync
fs.writeFileSync
fs.writeFileSync

fs.appendFileSync
fs.chmodSync
fs.existsSync
fs.readFileSync
fs.readdirSync
fs.writeFileSync

src/cli/actions/decrypt.js
src/cli/actions/decrypt.js
src/cli/actions/encrypt.js
src/cli/actions/encrypt.js
src/cli/actions/ext/genexample.js
src/cli/actions/ext/genexample.js
src/cli/actions/ext/gitignore.js
src/cli/actions/ext/gitignore.js
src/cli/actions/ext/gitignore.js
src/cli/actions/ext/gitignore.js
src/cli/actions/ext/gitignore.js
src/cli/actions/ext/prebuild.js
src/cli/actions/ext/prebuild.js
src/cli/actions/ext/prebuild.js
src/cli/actions/ext/prebuild.js
src/cli/actions/set.js
src/cli/actions/set.js
src/lib/helpers/detectEncoding.js
src/lib/helpers/detectEncoding.js
src/lib/helpers/executeDynamic.js
src/lib/helpers/executeDynamic.js
src/lib/helpers/findEnvFiles.js
src/lib/helpers/findEnvFiles.js
src/lib/helpers/findOrCreatePublicKey.js
src/lib/helpers/findOrCreatePublicKey.js
src/lib/helpers/findOrCreatePublicKey.js
src/lib/helpers/findOrCreatePublicKey.js
src/lib/helpers/installPrecommitHook.js
src/lib/helpers/installPrecommitHook.js
src/lib/helpers/installPrecommitHook.js
src/lib/helpers/installPrecommitHook.js
src/lib/helpers/installPrecommitHook.js
src/lib/helpers/installPrecommitHook.js
src/lib/helpers/isIgnoringDotenvKeys.js
src/lib/helpers/isIgnoringDotenvKeys.js
src/lib/helpers/isIgnoringDotenvKeys.js
src/lib/helpers/smartDotenvPrivateKey.js
src/lib/helpers/smartDotenvPrivateKey.js
src/lib/helpers/smartDotenvPrivateKey.js
src/lib/helpers/smartDotenvPrivateKey.js
src/lib/helpers/smartDotenvPrivateKey.js
src/lib/helpers/smartDotenvPublicKey.js
src/lib/helpers/smartDotenvPublicKey.js
src/lib/helpers/smartDotenvPublicKey.js
src/lib/services/decrypt.js
src/lib/services/decrypt.js
src/lib/services/encrypt.js
src/lib/services/encrypt.js
src/lib/services/encrypt.js
src/lib/services/genexample.js
src/lib/services/genexample.js
src/lib/services/genexample.js
src/lib/services/genexample.js
src/lib/services/genexample.js
src/lib/services/precommit.js
src/lib/services/precommit.js
src/lib/services/precommit.js
src/lib/services/precommit.js
src/lib/services/run.js
src/lib/services/run.js
src/lib/services/run.js
src/lib/services/run.js
src/lib/services/sets.js
src/lib/services/sets.js
src/lib/services/sets.js

src/cli/actions/decrypt.js
src/cli/actions/encrypt.js
src/cli/actions/ext/genexample.js
src/cli/actions/ext/gitignore.js
src/cli/actions/ext/prebuild.js
src/cli/actions/set.js
src/lib/helpers/detectEncoding.js
src/lib/helpers/executeDynamic.js
src/lib/helpers/findEnvFiles.js
src/lib/helpers/findOrCreatePublicKey.js
src/lib/helpers/installPrecommitHook.js
src/lib/helpers/isIgnoringDotenvKeys.js
src/lib/helpers/smartDotenvPrivateKey.js
src/lib/helpers/smartDotenvPublicKey.js
src/lib/services/decrypt.js
src/lib/services/encrypt.js
src/lib/services/genexample.js
src/lib/services/precommit.js
src/lib/services/run.js
src/lib/services/sets.js

*/
