
var socket = io();
var svg;

Date.prototype.toDatetimeLocalString = function(){
    var ret = new Date(this);
    var offsetMin = this.getTimezoneOffset();
    ret.setTime(this.getTime() - offsetMin*60000);
        
    // 2011-10-05T14:48:00
    retStr = ret.toISOString().slice(0,16);
    console.log("toDatetimeLocalString: "+retStr+ " offset:"+offsetMin)
    return retStr;
}

init();
function init() {
    socket.io._timeout = 30000;
    
    var end = new Date();
    var begin = new Date();
    begin.setDate(end.getDate() - 7);
    
    document.getElementById("PlotStart").value = begin.toDatetimeLocalString();
    document.getElementById("PlotEnd").value = end.toDatetimeLocalString();
    Plot(begin, end);
}

socket.emit('Command', {
    cmd: "DownLimit", type: "group", addr: 1234
});

socket.on('data', function (data) {
    console.log(data);

    //var msg = document.getElementById('ov1msg');
    //var prevMessage = msg.value;
    //msg.value = (prevMessage + data);
});

socket.on('Badger ORION', function (data) {
    //console.log(JSON.stringify(data));

    var msg = document.getElementById('ov1msg');
    var prevMessage = msg.value;
    msg.value = (prevMessage + JSON.stringify(data)+'\n');
});

socket.on('Itron SCM', function (data) {
    //console.log(JSON.stringify(data));

    var msg = document.getElementById('ov1msg');
    var prevMessage = msg.value;
    msg.value = (prevMessage + JSON.stringify(data) + '\n');
});

function OV1Command()
{
    var cmdSel = document.getElementById('cmdSel');
    var cmdVal = document.getElementById('cmdVal');

    socket.emit('Command', { cmd: cmdSel.value, val: Number(cmdVal.value) });
    console.log('OV1Command: ' + cmdSel.value + " " + cmdVal.value);
}

function UpdatePlot(newData) {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 10, bottom: 35, left: 45 };
    var plotRect = document.getElementById('TemperatureGraph').getBoundingClientRect();
    var width = plotRect.width - margin.left - margin.right;
    var height = plotRect.height - margin.top - margin.bottom;
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    
    var x = d3.scaleTime()
        .domain([new Date(newData[0].time), new Date(newData[newData.length - 1].time)])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([newData[0].value, newData[newData.length - 1].value])
        .range([height, 0]);
    
    var xAxis = d3.axisBottom(x)
    //.ticks((width + 2) / (height + 2) * 5)
    //.tickSize(height)
    //.tickPadding(8 - height);
    ;
    
    var yAxis = d3.axisLeft(y)
    //.ticks(5)
    //.tickSize(width)
    //.tickPadding(8 - width);
    ;
    
    var MeterReading = d3.line()
        .x(function (d) { return (x(new Date(d.time))); })
        .y(function (d) { return y(d.value); });
    
    function zoomed() {
        var transform = d3.zoomTransform(this);
        gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
        gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
        tEx.attr("transform", transform);
        tIn.attr("transform", transform);
        tSet.attr("transform", transform);

        svg.selectAll(".Path")
        .attr("stroke-width", 1 / transform.k);
    }
    
    function resetted() {
        svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
    }
    
    var zoom = d3.zoom()
//    .scaleExtent([1, 40])
//    .translateExtent([[-100, -100], [width + 90, height + 100]])
    .on("zoom", zoomed);
    
    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    if (!svg) {
        svg = d3.select("#TemperatureGraph").append("svg")
        .attr("width", plotRect.width)
        .attr("height", plotRect.height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        //.style("pointer-events", "all")
        .call(zoom);
        
        svg.append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);
        
        // Create invisible rect for mouse tracking
        svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0)
    .attr("id", "mouse-tracker")
    .style("fill", "white");
       
        var color = d3.scaleOrdinal(d3.schemeCategory10)
        
        // text label for the x axis
        svg.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," + (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .attr("class", "AxisDisplay")
        .text("Date");
        
        // text label for the y axis
        svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("class", "AxisDisplay")
        .text("Gallons");
        
        var gX = svg.append("g")
        .attr("class", "axis x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
        
        var gY = svg.append("g")
        .attr("class", "axis y")
        .call(yAxis);
        
        // Create Legend
        svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("dy", "1em")
        .attr("transform", "translate("+ (width-200) +","+ (height-50) +")");
        
        var ordinal = d3.scaleOrdinal()
        .domain(["Meter Reading (gallons)"])
        .range([color(0), color(1), color(2)]);
        
        var legend = d3.legendColor()
        .cellFilter(function (d) { return d.label !== "e" })
        .scale(ordinal);
        
        svg.select(".legendOrdinal")
        .call(legend);
        
        
        // Add data to plot
        var tEx = svg.append("path")
        .data([newData])
        .style("stroke", color(0))
        .style("fill", "none")
        .attr("class", "Path Temp Ext")
        .attr("d", MeterReading);   
    }
    else { // Load new data
        svg.select(".Path.Temp.Ext") // change the line
            .data([newData])
            .attr("d", MeterReading);
        svg.select(".x.axis") // change the x axis
            .call(xAxis);
        svg.select(".y.axis") // change the y axis
            .call(yAxis);
    }
}

function Plot(begin, end) {
    $.get("Plot", { begin: begin, end: end }, function (res) {
        UpdatePlot(res);
    });
}

