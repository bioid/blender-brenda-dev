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
  
  return new dbHandler();
};
