const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

function setup (ct, teams = [{ slug: 'acme', current_user_role: 'owner' }]) {
  const select = sinon.stub().resolves('acme')
  const input = sinon.stub().resolves(' person@example.com ')
  const post = sinon.stub().resolves({ invitation: { id: 1 } })
  const get = sinon.stub().resolves({ teams })
  const ArmorInvite = proxyquire('../../../src/lib/services/armorInvite', {
    '../helpers/prompts': { select, input },
    '../api/getTeams': class { async run () { return get() } },
    '../api/postTeamInvitation': class {
      constructor (...args) { this.args = args }
      async run () { return post(...this.args) }
    }
  })
  const descriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true })
  ct.teardown(() => {
    if (descriptor) Object.defineProperty(process.stdin, 'isTTY', descriptor)
    else delete process.stdin.isTTY
  })
  return { ArmorInvite, select, input, post, get }
}

t.test('prompts for team then email, filters member-only teams, sends trimmed email', async ct => {
  const { ArmorInvite, select, input, post } = setup(ct, [
    { slug: 'acme', current_user_role: 'owner' },
    { slug: 'restricted', current_user_role: 'member' }
  ])
  const result = await new ArmorInvite('https://example.com', 'token').run()
  ct.same(select.firstCall.args[0].choices, [{ name: 'acme', value: 'acme' }])
  ct.ok(select.calledBefore(input))
  ct.same(post.firstCall.args, ['https://example.com', 'token', 'acme', 'person@example.com'])
  ct.equal(result.invitation.id, 1)
})

t.test('explicit options skip prompts and team lookup', async ct => {
  const { ArmorInvite, select, input, post, get } = setup(ct)
  await new ArmorInvite('https://example.com', 'token', 'acme', 'person@example.com').run()
  ct.notOk(select.called || input.called || get.called)
  ct.equal(post.callCount, 1)
})

t.test('no eligible teams, invalid email, cancellation, and API errors do not report success', async ct => {
  const { ArmorInvite, select, post, get } = setup(ct, [])
  await ct.rejects(new ArmorInvite('host', 'token').run(), /no teams available/)
  await ct.rejects(new ArmorInvite('host', 'token', 'acme', 'invalid').run(), /valid email/)
  get.resolves({ teams: [{ slug: 'acme', current_user_role: 'admin' }] })
  select.rejects(new Error('prompt cancelled'))
  await ct.rejects(new ArmorInvite('host', 'token').run(), /prompt cancelled/)
  ct.notOk(post.called)
  post.rejects(new Error('permission denied'))
  await ct.rejects(new ArmorInvite('host', 'token', 'acme', 'person@example.com').run(), /permission denied/)
})

t.test('noninteractive use requires both options', async ct => {
  const { ArmorInvite, post } = setup(ct)
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: false })
  await ct.rejects(new ArmorInvite('host', 'token').run(), /--team and --email/)
  ct.notOk(post.called)
  await new ArmorInvite('host', 'token', 'acme', 'person@example.com').run()
  ct.equal(post.callCount, 1)
})
