const fs = require('fs')
const path = require('path')
const t = require('tap')

const dotenvx = require('../../src/lib/main')

const src = fs.readFileSync(path.join(__dirname, '../../tests/.env.multiline'), { encoding: 'utf8' })
const parsed = dotenvx.parse(src)

t.type(parsed, Object, 'should return an object')

t.equal(parsed.MULTI_DOUBLE_QUOTED, 'THIS\nIS\nA\nMULTILINE\nSTRING', 'parses multi line values in double quotes')

t.equal(parsed.MULTI_SINGLE_QUOTED, 'THIS\nIS\nA\nMULTILINE\nSTRING', 'parses multi line values in single quotes')

t.equal(parsed.MULTI_BACKTICKED, 'THIS\nIS\nA\n"MULTILINE\'S"\nSTRING', 'parses multi line values in backticks')

const expectedPem =
`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnNl1tL3QjKp3DZWM0T3u
LgGJQwu9WqyzHKZ6WIA5T+7zPjO1L8l3S8k8YzBrfH4mqWOD1GBI8Yjq2L1ac3Y/
bTdfHN8CmQr2iDJC0C6zY8YV93oZB3x0zC/LPbRYpF8f6OqX1lZj5vo2zJZy4fI/
kKcI5jHYc8VJq+KCuRZrvn+3V+KuL9tF9v8ZgjF2PZbU+LsCy5Yqg1M8f5Jp5f6V
u4QuUoobAgMBAAE=
-----END PUBLIC KEY-----`
t.equal(parsed.MULTI_PEM_DOUBLE_QUOTED, expectedPem, 'parses multi line pem key in double quotes')

t.equal(parsed.SPLIT_KEY_VALUE_LINES, 'split line', 'parses split key value lines')

t.equal(parsed.SPLIT_KEY_VALUE_SPACED_LINES, 'split line with spaces', 'parses split key value lines with spaces')