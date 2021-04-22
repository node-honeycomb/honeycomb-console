<h2 align="center"> 🐝honeycomb-console </h2>

<p align="center">honeycomb-console控制台，优秀的集群、应用运维，监控能力！</p>

![应用截图](https://img.alicdn.com/imgextra/i1/O1CN01D51de328X1pbLu7le_!!6000000007941-2-tps-1196-702.png)

## 🐝Demo
暂无线上demo，请参考安装【安装】章节

## ⚒️安装

`docker`安装
```bash
$ docker run -d -p 80:80 \
-p 9999:9999 \
-v $PWD/honeycomb/logs:/home/admin/honeycomb/logs \
-v $PWD/honeycomb/run:/home/admin/honeycomb/run \
-v $PWD/honeycomb/conf:/home/admin/honeycomb/conf \
--name honeycomb-server-console \
node2honeycomb/honeycomb-server-console:latest
```

## ⛑开发

> window下环境配置：https://www.yuque.com/honeycomb/honeycomb/dev-win

```bash
$ git clone https://github.com/hc-better/honeycomb-console.git
$ cd honeycomb-console
$ make install # window下用户执行 cnpm install && cd assets && cnpm install
$ npm start # 打开浏览器 http://localhost:8001/honeycomb-console
```
