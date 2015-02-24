
module.exports = function() {
  var mkdirp = require('mkdirp'),
      util = require('util'),
      EventEmitter = require('events').EventEmitter,
      fs = require('fs');
  
  var BrendaProjects = function() {
    this.projects = {};
    this.update();
    // call the EventEmitter constructor
    EventEmitter.call(this);
    this.init();
  };
  
  util.inherits(BrendaProjects, EventEmitter);
  
  BrendaProjects.prototype.init = function() {
    
  };
  
  BrendaProjects.prototype.updateProjects = function(callback) {
    // Retrieves all of the projects in the database,
    // and adds them to this.projects
    global.dbHandler.getAllProjects(function(res) {
      if (res.rows) {
        for (var i = 0; i < res.rows.length; i++) {
          if (!this.projects.hasOwnProperty(res.rows[i].name)) {
            this.projects[res.rows[i].name] = res.rows[i];
          }
        }
      }
      callback();
    }.bind(this));
  };
  
  BrendaProjects.prototype.updateJobs = function() {
    global.dbHandler.getAllJobs(function(res) {
      // loop through all of the jobs
      for (var i = 0; i < res.rows.length; i++) {
        for (var project in this.projects) {
          // check each project to see if it has a foreign key
          // associated with this job
          if (this.projects.hasOwnProperty(project) && this.projects[project].project_id == res.rows[i].project_id) {
            if (!this.projects[project].hasOwnProperty('jobs')) { this.projects[project].jobs = {}; }
            // add the job to the jobs object
            this.projects[project].jobs[res.rows[i].job_id] = res.rows[i];
          }
        }
      }
      //callback();
      this.emit('newData');
    }.bind(this));
  };

  BrendaProjects.prototype.update = function() {
    // checks through the db and updates this.projects
    this.updateProjects(function() {
      this.updateJobs();
    }.bind(this));
  };
  
  
  
  BrendaProjects.prototype.sanitizeString = function(str) {
    str = str.replace(/[^a-z0-9 \._-]/gim,"");
    return str.trim();
  };
  
  BrendaProjects.prototype.addProject = function(name, callback) {
    // sanitize the project name
    var sanitizedName = this.sanitizeString(name);
    // now add it to the db
    global.dbHandler.addProject(sanitizedName, function(res) {
      // next create the directory tree
      var pjpath = global.config.projects_dir + '/' + sanitizedName;
      mkdirp(pjpath + '/data', function(err) {
        if (err) { console.log('error making dir', err); }
        mkdirp(pjpath + '/jobs', function(err2) {
          if (err2) { console.log('error making dir', err2); }
          this.update(function() {
            callback(sanitizedName);
          });
          this.emit('projectAdded', sanitizedName);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };
  
  BrendaProjects.prototype.addJob = function(opts, callback) {
    // sanitize the jobname
    opts.jobname = this.sanitizeString(opts.jobname);
    // build the config, then add the job and config to the db
    this.makeJobDir(opts, function() {
      this.buildConfig(opts, function() {
        global.dbHandler.addJob(opts);
      }.bind(this));
    }.bind(this));
  };

  BrendaProjects.prototype.buildConfig = function(opts, callback) {
    var configLines = [
      'WORK_QUEUE=sqs://elation-render-output',
      'BLENDER_PROJECT=s3://elation-render-data/'+ opts.project.name + '.tar.gz',
      'RENDER_OUTPUT=s3://elation-render-output/'+ opts.project.name + '/' + opts.jobname + '/',
      'BLENDER_FILE=' + opts.renderOpts.blenderFile,
      'BLENDER_RENDER_RESOLUTION_X=' + opts.renderOpts.renderResolutionX,
      'BLENDER_RENDER_RESOLUTION_Y=' + opts.renderOpts.renderResolutionY,
      'BLENDER_RENDER_RESOLUTION_PERCENTAGE=' + opts.renderOpts.renderPercentage,
      'BLENDER_CYCLES_SAMPLES=' + opts.renderOpts.samples,
      'BLENDER_CYCLES_DEVICE=' + opts.renderOpts.device
      ];
  
    if (opts.jobtype == "bake") {
      var baketype = opts.renderOpts.baketype = opts.baketype || 'COMBINED',
          bakemargin = opts.renderOpts.bakemargin = opts.bakemargin || 0,
          bakeuvlayer = opts.renderOpts.bakeuvlayer = opts.bakeuvlayer || 'LightMap';
      configLines.push('BLENDER_BAKE_TYPE=' + baketype);
      configLines.push('BLENDER_BAKE_MARGIN=' + bakemargin);
      configLines.push('BLENDER_BAKE_UVLAYER=' + bakeuvlayer);
    }
  
    var configText = configLines.join('\n') + '\n';
    var path = global.config.projects_dir + '/' + opts.project.name + '/jobs/' + opts.jobname + '/scratch/brenda-job.conf';
    fs.writeFile(path, configText, function(err) {
      if (err) { console.log(err) } 
      callback();
    });
  };
  
  BrendaProjects.prototype.makeJobDir = function(opts, callback) {
    mkdirp(global.config.projects_dir + '/' + opts.project.name + '/jobs/' + opts.jobname + '/' + 'scratch', function(err) {
      if (err) { console.log(err) }
      callback();
    });
  };

  return new BrendaProjects();
};