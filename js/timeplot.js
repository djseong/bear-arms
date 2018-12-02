/*
 * Timeplot - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data				-- The entire gun violence dataset
 */

TimePlot = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.allData = _data;
    this.displayData = []; // see data wrangling
    this.eventHandler = _eventHandler;

    this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

TimePlot.prototype.initVis = function(){
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
    vis.x = d3.scaleTime()
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

    // Add y-label
    vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - vis.margin.left / 3 * 2)
        .attr("x",0 - (vis.height / 2))
        .attr("dy", "1em")
        .attr('class', 'y-label')
        .style("text-anchor", "middle")
        .text('Number of People');

    // Create line chart
    vis.svg.append('path')
        .attr('class', 'path-line')
        .attr('id', 'line-killed')
        .attr('fill', 'none')
        .attr('stroke', '#B22222');
    vis.svg.append('path')
        .attr('class', 'path-line')
        .attr('id', 'line-injured')
        .attr('fill', 'none')
        .attr('stroke', 'black');

    // Add legend
    vis.svg.append('circle')
        .attr('cx', 100)
        .attr('cy', 20)
        .attr('r', 4)
        .attr('fill', '#B22222');
    vis.svg.append('circle')
        .attr('cx', 100)
        .attr('cy', 40)
        .attr('r', 4)
        .attr('fill', 'black');
    vis.svg.append('text')
        .attr('x', 110)
        .attr('y', 20)
        .attr('class', 'legend-text')
        .text('Killed');
    vis.svg.append('text')
        .attr('x', 110)
        .attr('y', 40)
        .attr('class', 'legend-text')
        .text('Injured');

    // Initialize brushing component
    vis.currentBrushRegion = null;
    vis.brush = d3.brushX()
        .extent([[0,0],[vis.width, vis.height]])
        .on("brush", function(){
            // User just selected a specific region
            vis.currentBrushRegion = d3.event.selection;
            vis.currentBrushRegion = vis.currentBrushRegion.map(vis.x.invert);

            // 3. Trigger the event 'selectionChanged' of our event handler
            $(vis.eventHandler).trigger("selectionChanged", vis.currentBrushRegion);
        });


    // Append brush component here
    vis.brushGroup = vis.svg.append("g")
        .attr("class", "brush");

    vis.wrangleData();

};

/*
 * Data wrangling
 */

TimePlot.prototype.wrangleData = function(){
    var vis = this;

    vis.displayData = d3.nest()
        .key(function(d){ return d3.timeMonth(d.date); })
        .rollup(function(d) {
            return {
                n_killed: d3.sum(d, function(g) {return g.n_killed; }),
                n_injured: d3.sum(d, function(g) {return g.n_injured})
            }
        })
        .entries(vis.allData);
    vis.displayData.forEach(function(d){
        d.key = new Date(d.key);
    });

    // Set domain of axes
    vis.x.domain([
        d3.min(vis.displayData, function(d) {return d.key}),
        d3.max(vis.displayData, function(d) {return d.key})
    ]);
    vis.y.domain([
        d3.min(vis.displayData, function(d) {return d.value.n_killed}),
        d3.max(vis.displayData, function(d) {return d.value.n_injured})
    ]);

    // Update the visualization
    vis.updateVis();
};



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

TimePlot.prototype.updateVis = function(){
    var vis = this;

    // Call brush component here
    vis.brushGroup.call(vis.brush);

    // Draw circles for killed
    var circlesKilled = vis.svg.selectAll('.circle-killed')
        .data(vis.displayData);
    circlesKilled.enter()
        .append('circle')
        .attr('class', 'circle-killed')
        .merge(circlesKilled)
        .attr('cx', function(d) {return vis.x(d.key)})
        .attr('cy', function(d) {return vis.y(d.value.n_killed)})
        .attr('r', 4)
        .attr('fill', '#C22222');

    // Draw circles for injured
    var circlesInjured = vis.svg.selectAll('.circle-injured')
        .data(vis.displayData);
    circlesInjured.enter()
        .append('circle')
        .attr('class', 'circle-injured')
        .merge(circlesInjured)
        .attr('cx', function(d) {return vis.x(d.key)})
        .attr('cy', function(d) {return vis.y(d.value.n_injured)})
        .attr('r', 4)
        .attr('fill', 'black');

    // Draw axes
    vis.svg.select('.x-axis')
        .call(vis.xAxis
            .ticks(d3.timeMonth.every(3))
            .tickFormat(d3.timeFormat("%b %Y")))
        .selectAll('text')
        .attr("y", 0)
        .attr("x", -50)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-65)")
        .style("text-anchor", "start");
    vis.svg.select('.y-axis')
        .call(vis.yAxis);

    // Draw line for killed
    var lineKilled = d3.line()
        .x(function(d) { return vis.x(d.key); })
        .y(function(d) { return vis.y(d.value.n_killed); })
        .curve(d3.curveLinear);
    var pathKilled = vis.svg
        .select('#line-killed')
        .attr('d', lineKilled(vis.displayData));

    // Draw line for injured
    var lineInjured = d3.line()
        .x(function(d) { return vis.x(d.key); })
        .y(function(d) { return vis.y(d.value.n_injured); })
        .curve(d3.curveLinear);
    var lineInjured = vis.svg
        .select('#line-injured')
        .attr('d', lineInjured(vis.displayData));

};
