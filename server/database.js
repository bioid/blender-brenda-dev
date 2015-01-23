module.exports = function() {

  var anyDB = require('any-db');
  
  var dbHandler = function() {
      this.projects_db = anyDB.createConnection('sqlite3://' + global.config.projects_dir + '/projects.db');
  };
  
  dbHandler.prototype.addProject = function(name, callback) {
    var sql = 'INSERT INTO projects(name) VALUES(?);';
    this.projects_db.query(sql, [name], function(err, res) {
      if (err) { console.log(err) }
      callback(res);
    });
  };
  
  dbHandler.prototype.getAllProjects = function(callback) {
    var sql = 'SELECT * FROM projects;';
    this.projects_db.query(sql, function(err, res) {
      if (err) { console.log(err) }
      callback(res);
    });
  };
  
  dbHandler.prototype.addJob = function(jobName, project, callback) {
    var sql = 'INSERT INTO jobs(job_name, project_id) VALUES(?, ?);';
    this.projects_db.query(sql, [jobName, project.project_id], function(err, res) {
      if (err) { console.log(err) }
      callback(res);
    });
  };
  
  dbHandler.prototype.getAllJobs = function(callback) {
    var sql = 'SELECT * FROM jobs;';
    this.projects_db.query(sql, function(err, res) {
      if (err) { console.log(err) }
      callback(res);
    });
  };
  
  dbHandler.prototype.addBrendaConf = function(opts, callback) {
    var fields = [
        'blender_file',
        'blender_render_resolution_x',
        'blender_render_resolution_y',
        'blender_render_resolution_percentage',
        'blender_cycles_samples',
        'blender_cycles_device'
      ];
    var values = [
        opts.renderOpts.blenderFile,
        opts.renderOpts.renderResolutionX,
        opts.renderOpts.renderResolutionY,
        opts.renderOpts.renderPercentage,
        opts.renderOpts.samples,
        opts.renderOpts.device
      ];
    if (opts.jobtype == 'bake') {
      fields.push('blender_bake_type', 'blender_bake_margin', 'blender_bake_uvlayer');
      values.push(opts.renderOpts.baketype, opts.renderOpts.bakemargin, opts.renderOpts.bakeuvlayer);
    }
    var bakeValues = (opts.jobtype == 'bake') ? ', ?, ?, ?' : '';
    var sql = 'INSERT INTO brendaconfs(' + fields.join(', ') + ') VALUES (?, ?, ?, ?, ?, ? '+ bakeValues + ');';
    console.log(sql);
    
    this.projects_db.query(sql, values, function(err, res) {
      if (err) { console.log(err) }
      console.log(res);
      callback();
    });
  };
  
  return new dbHandler();
};
