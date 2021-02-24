const R = require('ramda')
const fxparser = require('fast-xml-parser')
const fs = require('fs')

const raw = fs.readFileSync('./Halo2-FreeForAll.objml', 'utf8')
const transformer = R.pipe(
  fxparser.parse,
  (x) => x.Inputs1.Games.MultiPlayerGame,
  R.map((g) => ({
    players: g.PlayerScores['x:key'],
    scores: g.PlayerScores.Int32,
  })),
  R.map(R.view(R.lensProp('scores')))
)
const data = transformer(raw)

console.log(data)
