var React = require('react');
let moment = require('moment');
let ReactDom = require('react-dom');
var $ = require('jquery');
var echarts = require('echarts');
class Linechart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      cpu: null,
      mem: null
    }
    this.setLineOption = this.setLineOption.bind(this);
    this.initLine = this.initLine.bind(this);
  }

  initLine(data,myChart) {
    if (data && data.data.length > 0) {
      let options = this.setLineOption(data);
      myChart.setOption(options);
    }
  }
  componentWillReceiveProps(props) {
    if(props.data && !_.isEqual(props.data.data, this.state[props.data.type])){
      let newState = _.cloneDeep(this.state);
      newState[props.data.type] = _.cloneDeep(props.data.data);
    }
  }
  componentDidMount() {
    const data = this.props.data;
    let dom = $(ReactDom.findDOMNode(this)).find('#lineReact')[0];
    let myChart = echarts.init(dom);
    if(data && !_.isEqual(data.data, this.state[data.type])){
      this.initLine(data,myChart)
    } 
  }

  componentDidUpdate() {
    const data = this.props.data;
    let dom = $(ReactDom.findDOMNode(this)).find('#lineReact')[0];
    let myChart = echarts.init(dom);
    if(data && !_.isEqual(data.data, this.state[data.type])){
      this.initLine(data,myChart)
    }
  }
  render() {
    return (
      <div  ref="line-chart" className="line-react" style={{display: 'inline-block'}}>
        <div id="lineReact" style={{width: '488px', height: '300px'}}></div>
      </div>
    );
  }

  setLineOption(data) {
    let text = null;
    let yAxisName = null;
    if (data.type === 'cpu') {
      text = 'CPU占用率';
      yAxisName = text + '/%';
    } else if (data.type === 'mem') {
      text = '内存占用';
      yAxisName = text + '/MB';
    }

    let _series = [];
    let obj = {
      name: data.data[0].name,
      type: 'line',
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 4,
      hoverAnimation: false,
      data: data.data[0].data.map(function (o) {
        return o.y;
      })
    };
    _series.push(obj);

    return {
      title: {
        text: text,
        subtext: '主机IP  ' + data.ip
      },
      legend: {
        data: data.data.map((item) => {
          return item.name;
        }),
        formatter: (name) => {
          return echarts.format.truncateText(name, 35, '10px Microsoft Yahei', '…');
        },
        tooltip: {
          show: true
        },
        itemGap: 5,
        right: 0,
        width: 385,
        height: 10,
        itemWidth: 10,
        itemHeight: 5,
        textStyle: {
          fontSize: 3,
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
        data: data.data[0].data.map((item, index) => {
          return moment(item.x, 'YYYYMMDD HH:mm:ss.SSS').format('HH:mm:ss');
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
