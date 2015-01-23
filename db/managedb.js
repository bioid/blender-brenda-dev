var anyDB = require('any-db'),
    fs    = require('fs');

if (!global.config) {
  global.config = require('../config/serverconfig.js') 
}

if (!fs.existsSync(global.config.projects_dir + '/projects.db')) {
  console.log('Creating projects.db');
  var db = anyDB.createConnection('sqlite3://' + global.config.projects_dir + '/projects.db');
  var create_projects = 'CREATE TABLE projects' +
                        '( project_id INTEGER PRIMARY KEY,' +
                        'name VARCHAR(100),' + 
                        'owner_id INT);';
        
  var create_jobs = 'CREATE TABLE jobs' +
                    '( job_id INTEGER PRIMARY KEY,' +
                    'job_name VARCHAR(100),' +
                    'project_id INT,' +
                    'FOREIGN KEY (project_id) REFERENCES projects(project_id));';
  
  db.query(create_projects, function(err, res) {
    if (err) { console.log(err); }
    console.log(res);
  });
  db.query(create_jobs, function(err, res) {
    if (err) { console.log(err); }
    console.log(res);
  });
}

else {
  console.log('projects.db already exists');
  var db = anyDB.createConnection('sqlite3://' + global.config.projects_dir + '/projects.db');
  db.query('SELECT * FROM projects;', function(err, res) {
    if (err) { console.log(err); }
    console.log(res);
  });
  db.query('SELECT * FROM jobs;', function(err, res) {
    if (err) { console.log(err); }
    console.log(res);
  });
}