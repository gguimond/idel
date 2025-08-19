
const run = require('../idel.js')
module.exports.maxDuration = 60;

module.exports.GET = async function GET(request) {
  await run()
  return new Response('OK')
}