var config = require('config')
  , amqp = require('./lib/amqp')
  , logger = require('winston')
  , express = require('express')
  , app = express();

logger.level = config.logging.level;
app.use(require('body-parser').json());


// dummy route to verify app is up
app.get('/', function(req,res) {
  res.send({msg: 'IT\'S ALIIIIIVE!'});
});


// accepts a message and publishes it to the exchange
app.post('/', function(req, res) {
  var message
    , published;

  message = new Buffer(JSON.stringify({
    batch: req.body,
    batchId: req.header('X-MessageSystems-Batch-Id')
  }), 'UTF-8');

  try {
    // publish returns true for success, false if the write buffer is full, and throws on error
    published = amqp.publish(config.amqp.exchange, 'sparkpost', message);
    if (published) {
      return res.send();
    } else {
      logger.warn('message not published due to full buffer');
      return res.status(500).send({message: 'Buffer is full'});
    }
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send({message: err.message});
  }
});



// Connect to Rabbit and start Express server
amqp.createChannel()
  .then(function() {
    createServer(app);
  })
  .catch(function(err) {
    logger.error(err);
    process.exit(1);
  });



/**
 * Creates the Express server supporting either HTTP or HTTPS depending on config
 * @param app The Express app
 */
function createServer(app) {
  var server;
  if (config.protocol === 'https') {
    server = require('https').createServer(config.httpsOptions, app);
  } else {
    server = require('http').createServer(app);
  }
  server.listen(config.port);

  logger.info('Webhook consumer listening at %s://%s:%s', config.protocol, server.address().address, server.address().port);
}
