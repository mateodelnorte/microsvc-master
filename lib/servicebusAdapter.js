var debug = require('debug')('microsvc-master:servicebusAdapter');

module.exports = function (master, bus, options) {
  options = options || {};
  options.slaveHeartbeat = options.slaveHeartbeat;
  options.slaveOffline = options.slaveOffline;
  options.slaveOnline = options.slaveOnline;

  if (options.slaveHeartbeat) {
    bus.subscribe(options.slaveHeartbeat, function (slave) {
      debug('slave heartbeat %j', slave);
      master.channel.emit('slave.heartbeat', slave);
    });
  }

  if (options.slaveOffline) {
    bus.subscribe(options.slaveOffline, function (slave) {
      debug('slave offline %j', slave);
      master.channel.emit('slave.offline', slave);
    });
  }

  if (options.slaveOnline) {
    bus.subscribe(options.slaveOnline, function (slave) {
      debug('slave online %j', slave);
      master.channel.emit('slave.online', slave);
    });
  }

};