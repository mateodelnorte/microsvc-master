var debug = require('debug')('microsvc-master:localChannel');

module.exports = function (master, options) {
  options = options || {};
  options.slaveHeartbeat = options.slaveHeartbeat || 'slave.heartbeat';
  options.slaveOffline = options.slaveOffline || 'slave.offline';
  options.slaveOnline = options.slaveOnline || 'slave.online';

  function registerSlave (slave) {
    debug('registering slave');
    slave.on(options.slaveHeartbeat, function () {
      debug('slave heartbeat');
      master.channel.emit('slave.heartbeat', slave);
    });
    slave.on(options.slaveOffline, function () {
      debug('slave offline');
      master.channel.emit('slave.offline', slave);
    });
    slave.on(options.slaveOnline, function () {
      debug('slave online');
      master.channel.emit('slave.online', slave);
    });
  }

  return {
    register: function register (slave) {
      registerSlave(slave);
    },
    remove: function remove (slave) {
      slave.removeAllListeners();
    }
  };
};