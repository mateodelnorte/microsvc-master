var debug = require('debug')('microsvc-master:servicebusAdapter');

module.exports = function (master, bus, options) {
  options = options || {};
  options.slaveHeartbeat = options.slaveHeartbeat || 'slave.heartbeat';
  options.slaveOffline = options.slaveOffline || 'slave.offline';
  options.slaveOnline = options.slaveOnline || 'slave.online';

  bus.subscribe(options.slaveHeartbeat, function (slave) {
    debug('slave heartbeat %j', slave);
    master.channel.emit('slave.heartbeat', slave);
  });

  bus.subscribe(options.slaveOffline, function (slave) {
    debug('slave offline %j', slave);
    master.channel.emit('slave.offline', slave);
  });

  bus.subscribe(options.slaveOnline, function (slave) {
    debug('slave online %j', slave);
    master.channel.emit('slave.online', slave);
  });

};