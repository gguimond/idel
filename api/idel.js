
const run = require('../idel.js')

module.exports.GET = async function GET(request) {
  await run()
  return 'toto'
}