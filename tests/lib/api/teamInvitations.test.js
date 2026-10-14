const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('teams follows pagination with authentication', async ct => {
  const http = sinon.stub()
  http.onFirstCall().resolves({ statusCode: 200, body: { json: async () => ({ teams: [{ slug: 'one' }], meta: { next_page: 2 } }) } })
  http.onSecondCall().resolves({ statusCode: 200, body: { json: async () => ({ teams: [{ slug: 'two' }], meta: { next_page: null } }) } })
  const GetTeams = proxyquire('../../../src/lib/api/getTeams', { '../helpers/http': { http } })
  ct.same(await new GetTeams('https://example.com', 'token').run(), { teams: [{ slug: 'one' }, { slug: 'two' }] })
  ct.equal(http.secondCall.args[0], 'https://example.com/api/teams?page=2')
  ct.equal(http.firstCall.args[1].headers.Authorization, 'Bearer token')
})

t.test('invitation requests member role without overriding key access', async ct => {
  const http = sinon.stub().resolves({ statusCode: 201, body: { json: async () => ({ invitation: { id: 1 } }) } })
  const Post = proxyquire('../../../src/lib/api/postTeamInvitation', { '../helpers/http': { http } })
  ct.same(await new Post('https://example.com', 'token', 'team/name', 'person@example.com').run(), { invitation: { id: 1 } })
  ct.equal(http.firstCall.args[0], 'https://example.com/api/teams/team%2Fname/invitations')
  const opts = http.firstCall.args[1]
  ct.equal(opts.method, 'POST')
  ct.equal(opts.headers.Authorization, 'Bearer token')
  ct.same(JSON.parse(opts.body), { email: 'person@example.com', role: 'member' })
})

t.test('API errors propagate for listing and inviting', async ct => {
  for (const name of ['getTeams', 'postTeamInvitation']) {
    const http = sinon.stub().resolves({ statusCode: 403, body: { json: async () => ({ error: 'denied' }) } })
    const Api = proxyquire(`../../../src/lib/api/${name}`, {
      '../helpers/http': { http },
      '../helpers/buildApiError': () => new Error('permission denied')
    })
    await ct.rejects(new Api('host', 'token', 'team', 'person@example.com').run(), /permission denied/)
  }
})
