module.exports = function(spawn, io) {
var glob = require('glob');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Processes = function() {
  this.children = [];
  this.instances = {};
  this.db = false;
  EventEmitter.call(this);
};

util.inherits(Processes, EventEmitter);

Processes.prototype.removeChild = function(child) {
  this.children.splice(this.children.indexOf(child), 1);
};

Processes.prototype.setDatabase = function(db) {
  this.db = db;
};

Processes.prototype.getBlenderFiles = function(project, callback) {
  var path = global.config.projects_dir + '/' + project.name + '/data/**/*.blend';
  glob(path, function(err, files) {
    if (err) { console.log(err) }
    callback(files);
  });
};

Processes.prototype.getRegionConfigs = function(callback) {
  var path = global.dirname + '/config/regions/**/*.conf';
  glob(path, function(err, files) {
    if (err) { console.log(err) }
    var regions = [];
    for (var i = 0; i < files.length; i++) {
      var parts = files[i].split('/');
      regions.push(parts[parts.length - 1]);
    }
    callback(regions);
  });
};



Processes.prototype.completeJob = function(client, opts, callback) {
  var path = global.dirname + '/scripts/brenda/job-complete.sh';
  var args = [opts.project.name, opts.job.job_name];
  var child = spawn(path, args);
  this.children.push(child);
  child.stdout.on('data', function(data) {
    client.emit('stdout', data.toString());
  });
  child.on('exit', function(code) {
    this.removeChild(child);
    global.dbHandler.setDone(opts.job.job_id, function() {
      callback();
    });
  }.bind(this));
};

Processes.prototype.submitJob = function(opts) {
  var args = [];
  if (opts.jobtype == 'animation') {
    if (opts.subframe) {
      args = [opts.project.name, opts.jobname, 'subframe', '-s', opts.start, '-e', opts.end, '-X', opts.tilesX, '-Y', opts.tilesY];
    } else {
      args = [opts.project.name, opts.jobname, 'animation', '-s', opts.start, '-e', opts.end];
    }
  } else if (opts.jobtype == 'bake') {
    args = [opts.project.name, opts.jobname, 'bake', '-e', opts.numobjects];
  }
  var child = spawn(global.config.spawn_jobs, args); 
  this.children.push(child);
  child.stdout.on('data', function(data) {
    // emit stdout to the client who started this request
    opts.client.emit('stdout', data.toString());
  });
  child.on('exit', function(code) {
    this.checkJobCount();
    this.removeChild(child);
    opts.exitcode = code;
    this.emit('processExited', opts);
  }.bind(this));
};

Processes.prototype.spawnInstance = function(client, instargs) {
  var args = ['-N', instargs.instancecount.num, '-i', instargs.instancetype, '-p', instargs.instanceprice];
  if (instargs.availabilityzone && instargs.availabilityzone.length > 0) {
    args = args.concat(['-z', instargs.availabilityzone]);
  }
  if (instargs.region && instargs.region.length > 0) {
    var regionConf = global.dirname + '/config/regions/' + instargs.region;
    args = args.concat(['-c', regionConf]);
  }
  if (instargs.dryrun) {
    args = args.concat(['-d']);
  }
  args.push('spot');

  var child = spawn(global.config.brenda_run, args);
  this.children.push(child);
  child.stdout.on('data', function(data) {
    client.emit('stdout', data.toString());
  });
  child.stderr.on('data', function(data) {
    client.emit('stdout', data.toString());
  });
  child.on('exit', function(code) {
    this.removeChild(child);
  }.bind(this));
};

Processes.prototype.buildJobFile = function(client, jobname) {
  var args = [global.config.jobdata_dir + jobname];
  var child = spawn(global.config.build_jobfile, args);
  this.children.push(child);
  child.stdout.on('data', function(data) {
    io.sockets.connected[client].emit('stdout', data.toString());
  });
  child.on('exit', function(code) {
    this.removeChild(child);
  }.bind(this));
};

Processes.prototype.checkInstancePrice = function(client, instargs) {
  var args = ['-i', instargs.instancetype];
  if (instargs.region && instargs.region.length > 0) {
    var regionConf = global.dirname + '/config/regions/' + instargs.region;
    args = args.concat(['-c', regionConf]);
  }  
  args.push('price');
  var child = spawn('brenda-run', args);
  this.children.push(child);
  child.stdout.on('data', function(data) {
    var lines = data.toString().split('\n');
    if (lines.length > 2) {
      var prices = {};
      for (var i=1; i < lines.length; i++) {
        var parts = lines[i].split(" ");
        if (parts.length > 0) {
          prices[parts[0]] = parts[2];
        }
      }
      client.emit('priceupdate', prices);
    }
    else {
      client.emit('priceupdate', 'No price info');
    }
  });
  child.on('exit', function(code) {
    this.removeChild(child);
  }.bind(this));
};
Processes.prototype.checkInstanceCounts = function() {
  if (!this.db) return;

  this.getRegionConfigs(function(files) {
    var regions = [];
    for (var i = 0; i < files.length; i++) {
      var parts = files[i].split('/');
      var regionconf = parts[parts.length - 1];
      this.checkInstanceCountForRegion(regionconf.substr(0, regionconf.indexOf('.')));
    }
    // Write the current instance counts into influxdb every 10 seconds
    setInterval(function() { this.db.writePoint('instances', this.instances); }.bind(this), 10000);
  }.bind(this));
};
Processes.prototype.checkInstanceCountForRegion = function(region) {
  if (!this.db) return;
  var args = []; //'-i', instargs.instancetype];
  if (region && region.length > 0) {
    var regionConf = global.dirname + '/config/regions/' + region + '.conf';
    args = args.concat(['-c', regionConf]);
  }
  args.push('instances');
  var child = spawn('brenda-tool', args);
  this.children.push(child);

  var instancecount = 0;
  //this.instances[region] = 0;
  child.stdout.on('data', function(data) {
    var lines = data.toString().trim().split('\n');
    instancecount = lines.length;
  }.bind(this));
  child.on('exit', function(code) {
    this.instances[region] = instancecount;
    var influxcfg = global.config.influxdb;
    var refreshtime = (influxcfg && influxcfg.refresh && influxcfg.refresh.instances ? influxcfg.refresh.instances : 30000);
    setTimeout(this.checkInstanceCountForRegion.bind(this, region), refreshtime);
    this.removeChild(child);
  }.bind(this));
};
Processes.prototype.checkJobCount = function() {
  if (!this.db) return;
  var args = ['status'];
  //console.log('Check job count');
  var child = spawn('brenda-work', args);
  this.children.push(child);

  var jobcount = 0;
  //this.instances[region] = 0;
  child.stdout.on('data', function(data) {
    var lines = data.toString().trim().split(': ');
    jobcount = lines[1];
  }.bind(this));
  child.on('exit', function(code) {
    this.db.writePoint('jobs', {'jobs': jobcount});
    var influxcfg = global.config.influxdb;
    var refreshtime = (influxcfg && influxcfg.refresh && influxcfg.refresh.jobs ? influxcfg.refresh.jobs : 30000);
    setTimeout(this.checkJobCount.bind(this), refreshtime);
    this.removeChild(child);
  }.bind(this));
};

Processes.prototype.killAll = function() {
  console.log('killing', this.children.length, 'child processes');
  this.children.forEach(function(child) {
    child.kill();
    this.removeChild(child);
  }.bind(this));
};

return new Processes();
};


