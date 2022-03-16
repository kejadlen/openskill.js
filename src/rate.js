import { sortBy, identity, range } from 'ramda'
import unwind from 'sort-unwind'
import models from './models'

const rate = (teams, options = {}) => {
  const model = models[options.model || 'plackettLuce']

  // if rank provided, use it, otherwise transition scores and use that
  const rank =
    options.rank ??
    options.score?.map((points) => -points) ??
    range(1, teams.length + 1)

  const [orderedTeams, tenet] = unwind(rank, teams)
  const newRatings = model(orderedTeams, {
    ...options,
    rank: sortBy(identity, rank),
  })
  let [reorderedTeams] = unwind(tenet, newRatings)

  // preventSigmaIncrease prevents sigma from ever going up which can happen when using a tau value.
  // this helps prevent ordinal from ever dropping after winning a game which can feel unfair
  if (options.tau && options.preventSigmaIncrease) {
    reorderedTeams = reorderedTeams.map((team, i) =>
      team.map((p, j) => ({
        ...p,
        sigma: Math.min(p.sigma, teams[i][j].sigma),
      }))
    )
  }

  return reorderedTeams
}

export default rate
