var amqplib = require('amqplib')
  , config = require('config')
  , onExit = require('on-exit')
  , logger = require('winston')
  , amqp = module.exports
  , channel;


/**
 * Connects to RabbitMQ, sets up a channel, and creates (if necessary) and gets reference to an exchange
 * The config.amqp stanza will be used as options when connecting to RabbitMQ
 * @returns {Promise} A promised fulfilled with the new channel
 */
amqp.createChannel = function createChannel() {
  return amqplib.connect(getAmqpConnectionString(), config.amqp)
    .then(function(conn) {
      return conn.createChannel();
    })
    .then(function(ch) {
      channel = ch;
      return channel.assertExchange(config.amqp.exchange, 'direct', {
        durable: true,
        internal: false,
        autoDelete: false
      });
    })
    .then(function() {
      logger.debug('Created exchange', config.amqp.exchange);
      return channel;
    });
};


/**
 * Publishes a message to the exchange
 * @returns {Promise}
 */
amqp.publish = function publish() {
  return channel.publish.apply(channel, arguments);
};


// clean up RabbitMQ connection on exit
onExit(function() {
  if (channel) {
    logger.info('Closing RabbitMQ connection');
    return channel.close();
  }
});



/**
 * Constructs an AMQP connection string
 * @returns {string}
 */
function getAmqpConnectionString() {
  var cfg = config.amqp
    , user = process.env.AMQP_WEBHOOK_USER || cfg.user
    , password = process.env.AMQP_WEBHOOK_PASSWORD || cfg.password
    ;

  return 'amqp://' + user + ':' + password + '@' + cfg.url + ':' + cfg.port;
}
