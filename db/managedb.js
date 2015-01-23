#!/usr/bin/env node
var anyDB = require('any-db'),
    fs    = require('fs'),
    argv = require('yargs')
          .usage('Usage: $0 --createdb')
          .argv;
    
if (!global.config) {
  global.config = require('../config/serverconfig.js');
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
                      'conf_id INT,' + 
                      'FOREIGN KEY (project_id) REFERENCES projects(project_id),' +
                      'FOREIGN KEY (conf_id) REFERENCES brendaconfs(conf_id));';
                      
    var create_brendaconfs = 'CREATE TABLE brendaconfs' +
                             '( conf_id INTEGER PRIMARY KEY,' + 
                            // not sure if we'll want these
                            // 'work_queue VARCHAR(100),' +
                            // 'blender_project VARCHAR(100),' +
                            // 'render_output VARCHAR(100),' +
                             'blender_file VARCHAR(100),' +
                             'blender_render_resolution_x INTEGER,' +
                             'blender_render_resolution_y INTEGER,' +
                             'blender_render_resolution_percentage INTEGER,' +
                             'blender_cycles_samples INTEGER,' +
                             'blender_cycles_device VARCHAR(100),' +
                             'blender_bake_type VARCHAR(100),' +
                             'blender_bake_margin VARCHAR(100),' +
                             'blender_bake_uvlayer VARCHAR(100));';
    
    db.query(create_projects, function(err, res) {
      if (err) { console.log(err); }
      else {
        console.log('projects table created');
        console.log(res);
      }
    });
    
    db.query(create_brendaconfs, function(err, res) {
      if (err) { console.log(err); }
      else {
        console.log('brendaconfs table created');
        console.log(res);
        db.query(create_jobs, function(err, res) {
          if (err) { console.log(err); }
          else {
            console.log('jobs table created');
            console.log(res);
          }
        });
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
