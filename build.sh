#!/bin/bash

make release

# envType=$1
# declare __ENV__="dev"
# case $envType in
#     daily )
#     # 日常
#     __ENV__="dev"
#     ;;
#     prepub )
#     # 预发
#     __ENV__="pre"
#     ;;
#     # 生产
#     publish )
#     __ENV__="pro"
#     ;;
# esac
# echo "----------- ${__ENV__} env -------------------"

## 警告：请不要修改次行以下的代码
test -f bin/sysbuild.sh && sh bin/sysbuild.sh $1 $2

## call dtboost-framework's build.sh
test -f out/release/node_modules/@ali/dtboost-framework/build.sh && sh out/release/node_modules/@ali/dtboost-framework/build.sh $1 $2
# sh out/release/node_modules/@ali/dtboost-framework/build.sh $1 $2
echo 'Build finished!'
