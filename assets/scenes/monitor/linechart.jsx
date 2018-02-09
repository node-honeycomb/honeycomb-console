var React = require('react');
let moment = require('moment');
let ReactDom = require('react-dom');
var $ = require('jquery');
var echarts = require('echarts');
class Linechart extends React.Component {

  constructor(props) {
    super(props);
    this.setLineOption = this.setLineOption.bind(this);
    this.initLine = this.initLine.bind(this);
  }

  initLine() {
    const data = this.props.data;
    let dom = $(ReactDom.findDOMNode(this)).find('#lineReact')[0];
    let myChart = echarts.init(dom);
    myChart.clear();
    myChart.showLoading('default', {
      text: 'loading',
      color: '#108ee9',
      textColor: '#108ee9',
      maskColor: 'rgba(255, 255, 255, 0.8)',
      zlevel: 0
    });
    if (data.data.length > 0) {
      myChart.hideLoading();
      let options = this.setLineOption(data);
      myChart.setOption(options);
    }
  }

  componentDidMount() {
    this.initLine();
  }

  componentDidUpdate() {
    this.initLine();
  }

  render() {
    return (
      <div className="line-react" style={{display: 'inline-block'}}>
        <div id="lineReact" style={{width: '540px', height: '300px'}}></div>
      </div>
    );
  }

  setLineOption(data) {
    let text = null;
    let yAxisName = null;
    if (data.isSys && data.type === 'cpu') {
      text = '系统负载(SYSTEM)';
      yAxisName = '系统负载(SYSTEM)';
    } else if (data.isSys && data.type === 'mem') {
      text = '内存占用率(SYSTEM)';
      yAxisName = '内存占用率(SYSTEM)/%';
    } else if (!data.isSys && data.type === 'cpu') {
      text = 'CPU占用率(应用)';
      yAxisName = text + '/%';
    } else if (!data.isSys && data.type === 'mem') {
      text = '内存占用(应用)';
      yAxisName = text + '/MB';
    }

    let _series = [];
    let maxLen = _.max(_.map(data.data, (item, index) => {
      return item.data.length;
    }));
    let maxObj = _.find(data.data, (item, index) => {
      return item.data.length === maxLen;
    });
    _.map(data.data, (item, index) => {
      if (item.data.length < maxLen) {
        let sliceIndex = _.findKey(maxObj.data, (value, key) => {
          return moment(value.x, 'HH:mm:ss').isAfter(moment(item.data[0].x, 'HH:mm:ss'));
        });
        let slice = _.map(_.slice(maxObj.data, 0, sliceIndex - 1), (value, key) => {
          return value = {x: value.x, y: 0};
        });
        item.data = slice.concat(item.data);
      }
      let obj = {
        name: item.name,
        type: 'line',
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 4,
        hoverAnimation: false,
        data: item.data.map(function (o) {
          return o.y;
        })
      };
      _series.push(obj);
    });

    return {
      title: {
      },
      legend: {
        data: data.data.map((item) => {
          return item.name;
        }),
        // formatter: (name) => {
        //   return echarts.format.truncateText(name, 35, '10px Microsoft Yahei', '…');
        // },
        tooltip: {
          show: true
        },
        itemGap: 5,
        right: 20,
        width: 385,
        height: 10,
        itemWidth: 10,
        itemHeight: 5,
        textStyle: {
          fontSize: 10,
          color: '#666',
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        top: 80,
        containLabel: true
      },
      xAxis: {
        name: '时间',
        type: 'category',
        boundaryGap: false,
        splitLine: {
          show: false
        },
        data: maxObj.data.map((item, index) => {
          return moment(item.x, 'HH:mm:ss.SSS').format('HH:mm:ss');
        })
      },
      yAxis: {
        name: yAxisName,
        type: 'value',
        splitLine: {
          show: false
        }
      },
      series: _series
    };
  }
}
module.exports = Linechart;
