#!/usr/bin/env node
var anyDB = require('any-db'),
    fs    = require('fs'),
    argv = require('yargs')
          .usage('Usage: $0 --createdb')
          .argv;
    
if (!global.config) {
  global.config = require('../config/serverconfig.js');
}

if (argv.query) {
  var db = anyDB.createConnection('sqlite3://' + global.config.projects_dir + '/projects.db');
  db.query(argv.query, function(err, res) {
    if (err) { console.log(err); }
    console.log(res);
  });
  
}

if (argv.createdb) {
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
                      'job_type VARCHAR(15),' +
                      'start_frame INT,' +
                      'end_frame INT,' +
                      'tiles_x INT,' +
                      'tiles_y, INT,' +
                      'num_objects INT,' +
                      'start_time INT,' +
                      // times are MILLISECONDS since epoch 
                      //(divide by 1000 and floor for unix time)
                      'end_time INT,' +
                      'blender_file VARCHAR(100),' +
                      'blender_render_resolution_x INTEGER,' +
                      'blender_render_resolution_y INTEGER,' +
                      'blender_render_resolution_percentage INTEGER,' +
                      'blender_cycles_samples INTEGER,' +
                      'blender_cycles_device VARCHAR(100),' +
                      'blender_bake_type VARCHAR(100),' +
                      'blender_bake_margin VARCHAR(100),' +
                      'blender_bake_uvlayer VARCHAR(100),' +
                      'FOREIGN KEY (project_id) REFERENCES projects(project_id));';

    db.query(create_projects, function(err, res) {
      if (err) { console.log(err); }
      else {
        console.log('projects table created');
        console.log(res);
      }
    });
    
    db.query(create_jobs, function(err, res) {
      if (err) { console.log(err); }
      else {
        console.log('brendaconfs table created');
        console.log(res);
      }
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
}
