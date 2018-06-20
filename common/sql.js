const SQL = require('sql.js');

SQL.verbose = function() {
    return this;
};

SQL._Database = SQL.Database;

class SQL2 extends SQL._Database {
    constructor(filename, mode, cb) {
        super();
        process.nextTick(cb, null);
    }
    serialize(cb) {
        process.nextTick(cb);
    }
    run(sql, params, cb) {
        super.run(sql, params);
        var ctx = {};
        if (sql.toLowerCase().indexOf('insert') !== -1) {
            var rez = this.exec("select last_insert_rowid();");
            ctx.lastID = rez[0].values[0][0];
        }
        if (cb) {
            process.nextTick(cb.bind(ctx), null);
        }
        return this;
    }
    all(sql, params, cb) {
        var result = [];
        this.each(sql, params,
        function(r) {
            result.push(r);
        },
        function() {
            cb(null, result);
        });
        return this;
    }
    close () {}
  }

  SQL.Database = SQL2;

  module.exports = SQL;