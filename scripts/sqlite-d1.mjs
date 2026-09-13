import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export class SQLiteD1 {
 constructor(file){
  if(file!==':memory:')fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
  this.db=new DatabaseSync(file);this.db.exec('PRAGMA foreign_keys=ON');
  this.db.exec('PRAGMA journal_mode=WAL');
 }
 migrate(){
  this.db.exec('CREATE TABLE IF NOT EXISTS local_schema_migrations(name TEXT PRIMARY KEY)');
  for(const name of fs.readdirSync('cloudflare/migrations').filter(x=>x.endsWith('.sql')).sort()){
   if(this.db.prepare('SELECT name FROM local_schema_migrations WHERE name=?').get(name))continue;
   this.db.exec('BEGIN');
   try{this.db.exec(fs.readFileSync(path.join('cloudflare/migrations',name),'utf8'));this.db.prepare('INSERT INTO local_schema_migrations(name) VALUES(?)').run(name);this.db.exec('COMMIT');}
   catch(e){this.db.exec('ROLLBACK');throw e;}
  }
 }
 prepare(sql){
  const db=this.db;let values=[];
  return{bind(...v){values=v;return this;},async first(){return db.prepare(sql).get(...values)??null;},async all(){return{results:db.prepare(sql).all(...values)};},_run(){return db.prepare(sql).run(...values);},async run(){return this._run();}};
 }
 async batch(statements){
  this.db.exec('BEGIN IMMEDIATE');
  try{const result=statements.map(s=>s._run());this.db.exec('COMMIT');return result;}
  catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 close(){this.db.close();}
}
