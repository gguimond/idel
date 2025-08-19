
const run = require('../idel.js')

module.exports.GET = async function GET(request) {
  return new Response(await run())
}