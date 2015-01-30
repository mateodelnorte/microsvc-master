var events = require('events');
var debug = require('debug')('microsvc-master');
var util = require('util');

function Master () {
  this.channel = new events.EventEmitter();
  this.heartbeatFrequency = 1000;
  this.heartbeatAllowedLag = this.heartbeatFrequency + 1;
  this.slaves = {};
  events.EventEmitter.apply(this);
}

util.inherits(Master, events.EventEmitter);

Master.prototype.configure = function configure (fn) {
  fn(this);
};

Master.prototype.initialize = function initialize (options) {
  options = options || {};

  if (options.heartbeatFrequency) {
    this.heartbeatFrequency = options.heartbeatFrequency;
  }

  if (options.heartbeatAllowedLag) {
    this.heartbeatAllowedLag = options.heartbeatAllowedLag;
  }

  this.channel.on('slave.heartbeat', this._slaveHearbeat.bind(this));
  this.channel.on('slave.offline', this._slaveOffline.bind(this));
  this.channel.on('slave.online', this._slaveOnline.bind(this));
  this._startHeartbeat();
  this.emit('online');
};

Master.prototype.stop = function stop () {
  this.channel.removeAllListeners();
  clearInterval(this.heartbeatInterval);
  this.slaves = {};
  this.emit('offline');
};

Master.prototype._checkForPulse = function _checkForPulse (now, slaveId) {
  debug('checking for slave %s pulse', slaveId);
  
  var slave = this.slaves[slaveId];
  
  if ( ! slave) return this.channel.emit('slave.lost', slave);

  var elapsedMs = slave.lastHeartbeat.getTime() - now.getTime();

  if (Math.abs(elapsedMs) > this.heartbeatAllowedLag) {
    this._removeSlave(slave);
    debug('slave lost %j', slave);
    this.emit('slave.lost', slave);
  }
};

Master.prototype._heartbeat = function _heartbeat () {
  var slaveIds = Object.keys(this.slaves);
  debug('heartbeat %j', slaveIds);
  slaveIds.forEach(this._checkForPulse.bind(this, new Date()));
};

Master.prototype._parseHeartbeatPayload = function _parseHeartbeatPayload (payload) {
  return payload;
};

Master.prototype._parseOfflinePayload = function _parseOfflinePayload (payload) {
  return payload;
};

Master.prototype._parseOnlinePayload = function _parseOnlinePayload (payload) {
  return payload;
};

Master.prototype._removeSlave = function _removeSlave (slave) {
  delete this.slaves[slave.id];
  debug('slave offline %j', slave);
};

Master.prototype._slaveHearbeat = function _slaveHearbeat (payload) {
  var slave = this._parseHeartbeatPayload(payload);
  debug('slave heartbeat %j', slave);
  slave.lastHeartbeat = new Date();
  this.slaves[slave.id] = slave;
  this.emit('slave.heartbeat', slave);
};

Master.prototype._slaveOffline = function _slaveOffline (payload) {
  var slave = this._parseOfflinePayload(payload);
  debug('slave offline %j', slave);
  this._removeSlave(slave);
  this.emit('slave.offline', slave);
};

Master.prototype._slaveOnline = function _slaveOnline (payload) {
  var slave = this._parseOnlinePayload(payload);
  debug('slave online %j', slave);
  slave.lastHeartbeat = new Date();
  this.slaves[slave.id] = slave;
  this.emit('slave.online', slave);
};

Master.prototype._startHeartbeat = function _startHeartbeat () {
  this.heartbeatInterval = setInterval(this._heartbeat.bind(this), this.heartbeatFrequency);
};

module.exports = new Master();