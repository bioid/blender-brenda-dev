
module.exports = function() {
  var mkdirp = require('mkdirp');

  var BrendaProjects = function() {
    this.projects = {};
    this.update();
  };
  
  BrendaProjects.prototype.updateProjects = function(callback) {
    global.dbHandler.getAllProjects(function(res) {
      for (var i = 0; i < res.rows.length; i++) {
        if (!this.projects.hasOwnProperty(res.rows[i].name)) {
          console.log(res.rows[i])
          this.projects[res.rows[i].name] = res.rows[i];
        }
      }
      callback();
    }.bind(this));
  };
  
  BrendaProjects.prototype.updateJobs = function() {
    global.dbHandler.getAllJobs(function(res) {
      for (var i = 0; i < res.rows.length; i++) {
        for (var key in this.projects) {
          if (this.projects.hasOwnProperty(key) && this.projects[key].project_id == res.rows[i].project_id) {
            if (!this.projects[key].hasOwnProperty('jobs')) { this.projects[key].jobs = {}; }
            this.projects[key].jobs[res.rows[i].job_name] = res.rows[i];
          }
        }
      }
    }.bind(this));
  };
  
  BrendaProjects.prototype.update = function() {
    this.updateProjects(function() {
      this.updateJobs(); 
    }.bind(this));
  };
  
  BrendaProjects.prototype.sanitizeString = function(str) {
    str = str.replace(/[^a-z0-9 \._-]/gim,"");
    return str.trim();
  };
  
  BrendaProjects.prototype.addProject = function(name, callback) {
    var sanitizedName = this.sanitizeString(name);
    global.dbHandler.addProject(sanitizedName, function(res) {
      var pjpath = global.config.projects_dir + '/' + sanitizedName;
      this.update();
      mkdirp(pjpath + '/data', function(err) {
        if (err) { console.log('error making dir', err); }
        mkdirp(pjpath + '/jobs', function(err2) {
          if (err2) { console.log('error making dir', err2); }
          callback(sanitizedName);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };
  
  BrendaProjects.prototype.addJob = function(jobName, project, callback) {
    global.dbHandler.addJob(jobName, project, function(res) {
      this.update();
      callback();
    }.bind(this));
  };

  return new BrendaProjects();
};