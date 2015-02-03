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
  
  dbHandler.prototype.addJob = function(opts, callback) {
    var values = [opts.jobname, opts.project.project_id, opts.jobtype, Date.now()];
    var fields = ['job_name', 'project_id', 'job_type', 'start_time'];
    var placeholders = ['?', '?', '?', '?'];
    console.log('opts', opts);
    if (opts.jobtype == 'animation') {
      var animationValues = [opts.start, opts.end];
      fields.push('start_frame', 'end_frame');
      placeholders.push('?', '?');
      
      if (opts.subframe) {
        animationValues.push(opts.tilesX, opts.tilesY);
        fields.push('tiles_x', 'tiles_y');
        placeholders.push('?', '?');
      }
      values = values.concat(animationValues);
    }
    else if (opts.jobtype == 'bake') {
      values.push(opts.numobjects);
      fields.push('num_objects');
      placeholders.push('?');
    }
    
    var sql = 'INSERT INTO jobs('+ fields.join(', ') +') VALUES('+ placeholders.join(', ') +');';
    console.log(sql);
    console.log(values);
    this.projects_db.query(sql, values, function(err, res) {
      if (err) { console.log(err) }
      callback(res.lastInsertId);
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
    var values = [
        opts.renderOpts.blenderFile,
        opts.renderOpts.renderResolutionX,
        opts.renderOpts.renderResolutionY,
        opts.renderOpts.renderPercentage,
        opts.renderOpts.samples,
        opts.renderOpts.device
      ];
    if (opts.jobtype == 'bake') {
      values.push(opts.renderOpts.baketype, opts.renderOpts.bakemargin, opts.renderOpts.bakeuvlayer);
    }
    values.push(opts.job_id);
    
    var bakeValues = (opts.jobtype == 'bake') ? ', blender_bake_type = ?, blender_bake_margin = ?, blender_bake_uvlayer = ?' : '';

    var sql = 'UPDATE jobs SET blender_file = ?, blender_render_resolution_x = ?, \
    blender_render_resolution_y = ?, blender_render_resolution_percentage = ?, \
    blender_cycles_samples = ?, blender_cycles_device = ?' + bakeValues + ' WHERE job_id = ?';
    
    this.projects_db.query(sql, values, function(err, res) {
      if (err) { console.log(err) }
      callback();
    }.bind(this));
  };
  
  dbHandler.prototype.setDone = function(job, callback) {
    var time = Date.now();
    var sql = 'UPDATE jobs SET end_time = ? WHERE job_id = ?;';
    this.projects_db.query(sql, [time, job.job_id], function(err, res) {
      if (!err) {
        callback();
      }
    });
  };
  
  return new dbHandler();
};
