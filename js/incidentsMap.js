

/*
 * IncidentsMap - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- The entire gun violence dataset
 */

IncidentsMap = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.allData = _data;
    this.displayData = []; // see data wrangling

    this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

IncidentsMap.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 15, right: 100, bottom: 80, left: 0 };

    vis.width = 1100 - vis.margin.left - vis.margin.right;
    vis.height = 520 - vis.margin.top - vis.margin.bottom;


    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.projection = d3.geoAlbersUsa()
        .translate([vis.width / 2, vis.height / 2])
        .scale(990);

    vis.path = d3.geoPath()
        .projection(vis.projection);

    vis.radius = d3.scaleLinear()
        .range([1, 15]);

    vis.slider1 = d3.sliderHorizontal()
        .width(400)
        .on('onchange', val => {
            d3.select('p#value1').text(parseInt(val));
            var userval = parseInt(val);
            vis.displayData = vis.originalData.sort(function(a,b) { return b.casualties - a.casualties; });
            vis.displayData = vis.displayData.slice(0, userval);
            vis.updateVis();
        });

    //Define quantize scale to sort data values into buckets of color
    vis.color = d3.scaleQuantize();

    // Legend
    vis.svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(900,100)");

    vis.legend = d3.legendSize()
        .labelFormat(d3.format("d"))
        .scale(vis.radius)
        .shape('circle')
        .shapePadding(15)
        .labelOffset(20)
        .title("Number of deaths")
        .titleWidth(200);

    d3.json('data/us.topo.json', function(err, data) {
        vis.usData = topojson.feature(data, data.objects.states).features;
        vis.wrangleData();

    });
};

/*
 * Data wrangling
 */

IncidentsMap.prototype.wrangleData = function(){
    var vis = this;

    vis.displayData = vis.allData.filter(function(d) {
        return d.latitude !== 0 && d.longitude !== 0 && d.casualties !== 0;
    });

    vis.radius.domain([d3.min(vis.displayData, function(d) {
        return d.casualties;
    }), d3.max(vis.displayData, function(d) {
        return d.casualties;
    })]);

    vis.originalData = vis.displayData;

    vis.slider1.min(0).max(vis.displayData.length).default(vis.displayData.length);

    vis.group1 = d3.select('div#slider1').append('svg')
        .attr('width', 500)
        .attr('height', 80)
        .append('g')
        .attr('transform', 'translate(30,30)');

    vis.group1.call(vis.slider1);

    d3.select('p#value1').text(vis.slider1.value());
    d3.select('a#setValue1').on('click', () => { vis.slider1.value(0.015); d3.event.preventDefault(); });

    // Update the visualization
    vis.updateVis();
};



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

IncidentsMap.prototype.updateVis = function(){
    var vis = this;

    // console.log(vis.displayData);

    vis.color.domain([
        d3.min(vis.displayData, function(d) { return d.casualties; }),
        d3.max(vis.displayData, function(d) { return d.casualties; })
    ]);
    vis.color.range(["#B73200","#892500","#5B1900", "#2D0C00"]);

    // Update legend
    vis.svg.select(".legend")
        .call(vis.legend);

    vis.svg.selectAll("path")
        .data(vis.usData)
        .enter().append("path")
        .attr("class", "country-border")
        .attr("d", vis.path);

    var circles = vis.svg.selectAll(".node")
        .data(vis.displayData, function(d) { return d.incident_id; });

    circles.enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", function(d) {
            return vis.radius(d.casualties);
        })
        .attr("transform", function(d) {
            return "translate(" + vis.projection([d.longitude, d.latitude]) + ")";
        })
        .style("fill", function(d) {
            return "#a50f15";
        });
        // .style("stroke", "#760b0f");
    circles.exit().remove();


};
