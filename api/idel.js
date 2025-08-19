
const run = require('../idel.js')
module.exports.maxDuration = 60;

module.exports.GET = async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }
  await run()
  return new Response('OK')
}