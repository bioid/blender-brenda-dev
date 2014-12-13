
module.exports = function() {
  var mkdirp = require('mkdirp');
  var dbHandler = require('./database')();

  var BrendaProjects = function() {
    this.projects = {};
    this.updateProjects();
  };
  
  BrendaProjects.prototype.updateProjects = function() {
    dbHandler.getAllProjects(function(res) {
      for (var i = 0; i < res.rows.length; i++) {
        if (!this.projects.hasOwnProperty(res.rows[i].name)) {
          this.projects[res.rows[i].name] = res.rows[i];
        }
      }
    }.bind(this));
  };
  
  BrendaProjects.prototype.sanitizeString = function(str) {
    str = str.replace(/[^a-z0-9 \._-]/gim,"");
    return str.trim();
  };
  
  BrendaProjects.prototype.addProject = function(name, callback) {
    var sanitizedName = this.sanitizeString(name);
    dbHandler.addProject(sanitizedName, function(res) {
      var pjpath = global.config.projects_dir + '/' + sanitizedName;
      this.updateProjects();
      mkdirp(pjpath + '/data', function(err) {
        if (err) { console.log('error making dir', err); }
        mkdirp(pjpath + '/jobs', function(err2) {
          if (err2) { console.log('error making dir', err2); }
          callback(res);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  return new BrendaProjects();
};