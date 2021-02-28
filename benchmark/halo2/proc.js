const R = require('ramda')
const parser = require('fast-xml-parser')
const fs = require('fs')
// const { rate, rating } = require('openskill')

const TrueSkill = require('ts-trueskill')

const winProbability = require('../../dist/win-probability').default
// const winProbability = ([[winner], [loser]]) => {
//   if (winner.mu === loser.mu) {
//     return 0.5
//   } else if (winner.mu > loser.mu) {
//     return 0.99
//   } else if (winner.mu < loser.mu) {
//     return 0.01
//   }
// }

const parserOptions = {
  ignoreAttributes: false,
}

const raw = fs.readFileSync('./Halo2-HeadToHead.objml', 'utf8')
// const raw = fs.readFileSync('./h2h.objml', 'utf8')
const transformer = R.pipe(
  (data) => parser.parse(data, parserOptions),
  (x) => x.Inputs1.Games.TwoPlayerGame,
  R.map((g) => ({
    players: [g['@_Player1'], g['@_Player2']],
    score: [
      Number.parseInt(g['@_Player1Score'], 10) || 0,
      Number.parseInt(g['@_Player2Score'], 10) || 0,
    ],
  }))
  // R.map(R.view(R.lensProp('players')))
)
// console.log(transformer(raw))

const data = transformer(raw)

const getPlayers = (oldRatings) =>
  R.map((player) => [oldRatings[player] || new TrueSkill.Rating()])
const saveRatings = R.reduce(
  (accum, [key, [val]]) => ({
    [key]: val,
    ...accum,
  }),
  {}
)

let errorsCalc = 0
let total = 0

const processor = R.addIndex(R.reduce)((oldRatings, match, index) => {
  let { players, score } = match
  const playerRatings = getPlayers(oldRatings)(players)

  const teams =
    score[0] < score[1]
      ? [playerRatings[0], playerRatings[1]]
      : [playerRatings[1], playerRatings[0]]
  players =
    score[0] < score[1] ? [players[0], players[1]] : [players[1], players[0]]

  const prob = TrueSkill.winProbability(...teams)
  if (
    !(
      oldRatings[players[0]] === undefined &&
      oldRatings[players[1]] === undefined
    )
  ) {
    // don't count close games

    if (prob < 0.5) {
      errorsCalc++
    }

    console.log(
      teams.map((t) => t.map((p) => p.mu)),
      { prob }
    )
    total++
  }

  const rawRatings = TrueSkill.rate(teams)

  const newRatings = saveRatings(R.zip(players, rawRatings))
  return {
    ...newRatings,
    ...oldRatings,
  }
}, {})

const output = processor(data)
// console.log(output)
console.log({
  errorsCalc,
  total,
  errorRate: errorsCalc / total,
})
