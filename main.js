// defining the margin - started with 0, adjusted based on axes at end
var margin = {
    top: 20,
    right: 50,
    bottom: 30,
    left: 70
  }
  // defining width and height

var winWidth = $('#content')
  .width();
var width = winWidth - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;
// defining the date formatting function
var parseDate = d3.time.format('%Y-%m-%d')
  .parse;
// using d3.svg.line layout, and then deciding how to interpret the data from that
var line = d3.svg.line()
  .x(function (d) {
    return x(d.date);
  })
  .y(function (d) {
    return y(d.amount);
  })
  .interpolate('linear');
// basic svg element to be appended
var svg = d3
  .select('#content')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");
// defining scales for x and y - both the line and the axes
var x = d3.time.scale()
  .range([0, width]);
var y = d3.scale.linear()
  .range([height - 2, 0]);
// defining the axes, passing it the scale defined above
var xAxis = d3.svg.axis()
  .scale(x)
  .orient('bottom')
  .ticks(12);
var yAxis = d3.svg.axis()
  .scale(y)
  .orient('left')
  .ticks(10);
//
function fetchData(id) {
  console.log('returning data for ', id);
  var url = 'http://54.213.83.132/hackoregon/http/current_candidate_transactions_out/' + id + '/';
  var fetchedData = new Promise(function (resolve, reject) {
    $.getJSON(url, function (json) {
      resolve(json);
    })
  })
  return fetchedData;
}

function fetchState() {
  console.log('returning data for all of OR');
  var url = 'http://54.213.83.132/hackoregon/http/state_sum_by_date/_/';
  var fetchedData = new Promise(function (resolve, reject) {
    $.getJSON(url, function (json) {
      resolve(json);
    })
  })
  return fetchedData;
}
// sorting function for time series
function sortByDates(a, b) {
  return a.date - b.date;
}
// after promise returns fetched data we are formatting it for dataset
function formatData(data) {
  console.log('formatted ', data.filer_id)
  var dataSet = data.map((item) => {
    return {
      date: parseDate(item.tran_date),
      amount: item.amount
    }
  });
  dataSet.sort(sortByDates);
  return dataSet;
}

function formatState(data) {
  var dataSet = data.map((item) => {
    return {
      date: parseDate(item.tran_date),
      amount: item.total_out
    }
  });
  dataSet.sort(sortByDates);
  return dataSet;
}

function groupByWeeks(data) {
  var minDate = data[0].date;
  var maxDate = data[data.length - 1].date;
  var weeks = d3.time.weeks(minDate, maxDate);
  var weeklyArr = [];
  for (var i = 0; i < weeks.length; i++) {
    let week = {
      date: weeks[i],
      amount: 0
    };
    week['date'] = weeks[i];
    var range = moment.range(weeks[i], weeks[i + 1]);
    for (var j = 0; j < data.length; j++) {
      if (moment(data[j].date)
        .within(range)) {
        week['amount'] += data[j].amount;
      }
    }
    weeklyArr.push(week);
  }
  return weeklyArr;
}
// running our dataset through defined functions
function visualize(data) {
  // data is the dataset
  console.log('visualized')
  var dates = _.map(data, 'date');
  var amounts = _.map(data, 'amount');
  y.domain(d3.extent(amounts)) // using above arrays to pull min & max
  x.domain(d3.extent(dates))
  var updateSvg = d3.select("#content")
    .transition();
  updateSvg.select(".line")
    .duration(500)
    .attr("d", line(data)) // using line function to visualize dataset
  updateSvg.select(".x.axis")
    .duration(500)
    .call(xAxis);
  updateSvg.select(".y.axis")
    .duration(500)
    .call(yAxis);
}
$('#submitFiler')
  .on('click', (arguments) => {
    var $filerId = $('#filerId')
    var filerId = $filerId
      .val();
    return fetchData(filerId)
      .then(value => {
        // value = json
        return formatData(value)
      })
      .then(value => {
        switch (groupOption) {
          case 0:
            return value
            break;
          case 1:
          return groupByWeeks(value)
          break;
          default:
        }
      })
      .then(value => {
        //  value = formatted data
        $filerId.val('');
        return visualize(value)
      })
  })
var groupOption = $('#group').val();
$('#allState')
  .on('click', (arguments) => {
    return fetchState()
      .then(value => {
        return formatState(value)
      })
      .then(value => {
        switch (groupOption) {
          case 0:
            return value
            break;
          case 1:
          return groupByWeeks(value)
          break;
          default:
        }
      })
      .then(value => {
        $('#filerId')
          .val('');
        return visualize(value)
      });
  })

  $('#options').on('change', (event, index, value) => {
    var groupBy = $('select option:selected').val();
    switch (groupBy) {
      case 'Days':
      groupOption = 0;
        break;
        case 'Weeks':
        groupOption = 1;
      default:
    }
  });

function initialize(id) {
  console.log('initialized')
  let url = 'http://54.213.83.132/hackoregon/http/state_sum_by_date/_/';
  d3.json(url, (json) => {
    let dataSet = groupByWeeks(formatState(json));
    svg.append('path')
      .attr('class', 'line')
      .attr('d', line(dataSet));
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);
    visualize(dataSet);
  })
}
initialize(931);
var arr = [{
  amount: 1
}, {
  amount: 2
}, {
  amount: 5
}, {
  amount: 10
}];

function addAmounts(a, b) {
  var num = a + b;
  return num;
}
var amounts = arr.map(d => d.amount)
  .reduce(addAmounts)
