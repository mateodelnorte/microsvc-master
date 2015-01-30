var events = require('events');
var localAdapter = require('../lib/localAdapter');
var master = require('../index');

require('should');

var slaver;

describe('microsvc-master', function () {

  describe('on startup', function () {
    beforeEach(function () {
      master.configure(function (master) {
        slaver = localAdapter(master);
      });
    });
    afterEach(function () {
      master.stop();
    });
    it('should initialize and wait for slaves', function (done) {
      master.once('online', function () {
        done();
      });
      master.initialize();
    });
  });

  describe('at runtime', function () {

    beforeEach(function () {
      master.configure(function (master) {
        slaver = localAdapter(master);
      });
      master.initialize();
    });
    
    afterEach(function () {
      master.stop();
    });
    
    it('should add slave to list of slaves when notified slave online', function () {
      var slave = new events.EventEmitter();
      slave.initialize = function () {
        this.id = 1;
        this.emit('slave.online', this);
      };
      slaver.register(slave);
      slave.initialize();
      master.slaves[slave.id].should.equal(slave);
      slaver.remove(slave);
    });
    
    it('should notify slave.lost and remove slave if no heartbeat registered from slave in next heartbeat', function (done) {
      var slave = new events.EventEmitter();
      slave.heartbeat = function () {
        this.emit('slave.heartbeat', this);
      };
      slave.initialize = function () {
        this.id = 1;
        this.emit('slave.online', this);
      };
      slaver.register(slave);
      slave.initialize();
      slave.heartbeat();
      master.on('slave.lost', function (slave) {
        slave.should.have.property('id', slave.id);
        master.slaves.should.not.have.property(slave.id);
        slaver.remove(slave);
        done();
      });
    });
    
    it('should remove slave if notified slave.offline', function (done) {
      var slave = new events.EventEmitter();
      slave.offline = function () {
        this.emit('slave.offline', this);
      };
      slave.initialize = function () {
        this.id = 1;
        this.emit('slave.online', this);
      };
      slaver.register(slave);
      slave.initialize();
      master.on('slave.offline', function (slave) {
        slave.should.have.property('id', slave.id);
        master.slaves.should.not.have.property(slave.id);
        slaver.remove(slave);
        done();
      });
      slave.offline();
    });

  });
});