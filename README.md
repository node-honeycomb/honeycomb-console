# honeycomb-console

honeycomb-server管控台模块，基于honeycomb app机制开发。
本console目前发挥了70%的功力，还在继续迭代中。

## build

```
> git clone $code
> cd honeycomb-console
> honeycomb package
> cd out/
```

## data persistence

honeycomb-console的存储默认支持两种驱动：mysql 和 sqlite。
默认为本地sqlite.db文件, 适用于单机场景。

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

访问 honeycomb-server 的控制端口， 通常为 `http://ip:9999/`, 发布上去即可。