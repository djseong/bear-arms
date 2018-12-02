/*
 * BarPlot - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- The entire gun violence dataset
 */

BarPlot = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.allData = _data;
    this.filteredData = _data;
    this.displayData = []; // see data wrangling

    this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

BarPlot.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 50, right: 60, bottom: 50, left: 100 };

    vis.width = 600 - vis.margin.left - vis.margin.right;
    vis.height = 500 - vis.margin.top - vis.margin.bottom;


    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Add scales
    vis.x = d3.scaleBand()
        .domain(['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99'])
        .range([0, vis.width]);
    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    // Add axes
    vis.xAxis = d3.axisBottom()
        .scale(vis.x);
    vis.svg.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", "translate(0," + vis.height + ")");
    vis.yAxis = d3.axisLeft()
        .scale(vis.y);
    vis.svg.append('g')
        .attr('class', 'axis y-axis');

    // Add x-label
    vis.svg.append("text")
        .attr("y", vis.height + 25)
        .attr("x", (vis.width / 2))
        .attr("dy", "1em")
        .attr('class', 'y-label')
        .style("text-anchor", "middle")
        .text('Age Group');

    // Add y-label
    vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - vis.margin.left / 3 * 2)
        .attr("x",0 - (vis.height / 2))
        .attr("dy", "1em")
        .attr('class', 'y-label')
        .style("text-anchor", "middle")
        .text('Number of People');

    vis.wrangleData();

};

/*
 * Data wrangling
 */

BarPlot.prototype.wrangleData = function(){
    var vis = this;

    // Get counts by age group (every 10 years)
    var numKilledByAge = Array.apply(null, Array(10)).map(Number.prototype.valueOf,0);
    var numInjuredByAge = Array.apply(null, Array(10)).map(Number.prototype.valueOf,0);
    for (var i = 0; i < vis.filteredData.length; i++) {
        for (var k in Object.keys(vis.filteredData[i].participant_age_dict)) {
            var age = vis.filteredData[i].participant_age_dict[k];
            if (vis.filteredData[i].participant_status_dict[k] == 'Killed') {
                numKilledByAge[Math.floor(age / 10)] += 1;
            }
            else if (vis.filteredData[i].participant_status_dict[k] == 'Injured') {
                numInjuredByAge[Math.floor(age / 10)] += 1;
            }
        }
    }
    vis.displayData = {
        'numKilledByAge': numKilledByAge,
        'numInjuredByAge': numInjuredByAge
    };

    // Set domain of y axis
    vis.y.domain([0, d3.max(vis.displayData.numInjuredByAge)])

    // Update the visualization
    vis.updateVis();
};



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

BarPlot.prototype.updateVis = function(){
    var vis = this;

    // Draw axes
    vis.svg.select('.x-axis')
        .call(vis.xAxis);
    vis.svg.select('.y-axis')
        .call(vis.yAxis);

    // Draw rectangles for killed
    var rects = vis.svg.selectAll('.rect-killed')
        .data(vis.displayData.numKilledByAge);
    rects.enter()
        .append('rect')
        .attr('class', 'rect-killed')
        .merge(rects)
        .attr('x', function(d, i) {
            if (i == 0) {
                return vis.x('0-9') + 5;
            }
            else {
                return vis.x(i + '0-' + i + '9') + 5;
            }
        })
        .attr('y', function(d) {return vis.y(d)})
        .attr('width', 12)
        .attr('height', function(d) {return vis.height - vis.y(d)})
        .attr('fill', '#B22222\t');

    // Draw rectangles for injured
    var rects = vis.svg.selectAll('.rect-injured')
        .data(vis.displayData.numInjuredByAge);
    rects.enter()
        .append('rect')
        .attr('class', 'rect-injured')
        .merge(rects)
        .attr('x', function(d, i) {
            if (i == 0) {
                return vis.x('0-9') + 17;
            }
            else {
                return vis.x(i + '0-' + i + '9') + 17;
            }
        })
        .attr('y', function(d) {return vis.y(d)})
        .attr('width', 12)
        .attr('height', function(d) {return vis.height - vis.y(d)})
        .attr('fill', 'black');

};

BarPlot.prototype.onSelectionChange = function(selectionStart, selectionEnd){
    var vis = this;

    // Filter original unfiltered data depending on selected time period (brush)

    vis.filteredData = vis.allData.filter(function(d){
        return d.date >= selectionStart && d.date <= selectionEnd;
    });

    vis.wrangleData();
}
