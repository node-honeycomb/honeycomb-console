# honeycomb-console

本console只发挥了50%的管理能力，还在快速迭代中

## build

```
> git clone $code
> cd honeycomb-console
> honeycomb package
> cd out/
```

## data persistence

默认honeycomb-console的存储为本地sqlite.db, 系统默认支持多种存储驱动

如果需要更可靠的存储，请切换config.meta配置:

sql.js:（honeycomb-console单机部署推荐）
```
{
    meta: {
        driver: 'sql.js',
        dbfile: '$abs_path'
    }
}
```


mysql:（honeycomb-console高可用集群部署推荐）
```
{
    meta: {
       "driver": "mysql",
       "host": "$db_host",
       "port": "$db_port",
       "user": "$db_user",
       "password": "$db_pwd",
       "database": "$db_name"
    }
}
```

## install into honeycomb-server

visit honeycomb-server `http://ip:9999/`, publish it