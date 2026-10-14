const prompts = require('../helpers/prompts')
const GetTeams = require('../api/getTeams')
const PostTeamInvitation = require('../api/postTeamInvitation')

class ArmorInvite {
  constructor (hostname, token, team, email) {
    this.hostname = hostname
    this.token = token
    this.team = team
    this.email = email
  }

  async run () {
    let team = this.team
    let email = this.email
    const context = { input: process.stdin, output: process.stderr }
    if ((!team || !email) && !process.stdin.isTTY) {
      throw new Error('provide --team and --email when running non-interactively')
    }
    if (!team) {
      const { teams } = await new GetTeams(this.hostname, this.token).run()
      const choices = teams
        .filter(team => ['owner', 'admin'].includes(team.current_user_role))
        .map(team => ({ name: team.slug, value: team.slug }))
      if (!choices.length) throw new Error('no teams available to invite members to (requires owner or admin role)')
      team = await prompts.select({ message: 'Select team', prefix: '⛨', choices }, context)
    }
    if (!email) email = await prompts.input({ message: 'Email address' }, context)
    email = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('enter a valid email address')
    const json = await new PostTeamInvitation(this.hostname, this.token, team, email).run()
    return { ...json, team, email }
  }
}

module.exports = ArmorInvite
