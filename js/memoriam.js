

/*
 * IncidentsMap - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- The entire gun violence dataset
 */

Memoriam = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.allData = _data;
    this.displayData = [];// see data wrangling
    this.testData = {};

    this.initVis();
};



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

Memoriam.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 0, right: 100, bottom: 100, left: 0 };

    vis.diameter = 420;


    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.diameter)
        .attr("height", vis.diameter)
        .attr("class", "bubble center")
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
        .attr("class", "bubble");

    vis.tool_tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<p><strong>Name:</strong> <span style='color:red'>" + d.data.name +"</span></p><br><p><strong>Age:</strong> <span style='color:red'>" + d.data.age + "</span></p>";
        });
    vis.svg.call(vis.tool_tip);

    var deaths_dict = {};
    deaths_dict[0] = 0;

    this.allData.forEach(function(d, i) {
        if (d.n_killed > 0) {
            for (var k in d.participant_status_dict) {
                if (d.participant_status_dict[k] === "Killed") {
                    var age = k in d.participant_age_dict ? d.participant_age_dict[k] : -1;
                    var name = k in d.participant_name_dict ? d.participant_name_dict[k] : "Unknown";

                    if (age > 0) {
                        if (age in deaths_dict) deaths_dict[age] += 1;
                        else deaths_dict[age] = 1;
                    }
                    vis.displayData.push({
                        'age': age,
                        'name': name,
                        'id': i,
                        'incident_id': +d.incident_id
                    });
                }
            }
        }
    });

    vis.displayData = vis.displayData.filter(function(d) {
        return d.age > 0;
    });

    vis.maxage = d3.max(vis.displayData, function(d) { return d.age});

    vis.total_deaths = [0];
    for (var i = 1; i <= vis.maxage; i++) {
        vis.total_deaths.push(vis.total_deaths[i-1] + (i in deaths_dict ? deaths_dict[i] : 0));
    }

    vis.userval = 0;

    vis.slider2 = d3.sliderHorizontal()
        .width(400)
        .on('onchange', val => {
            d3.select('p#value2').text(parseInt(val));
            vis.userval = parseInt(val);
            $("#value2").text(vis.userval);
            $("#total-deaths").text(vis.total_deaths[vis.userval]);
            vis.deadcircles.attr("fill", function(d) {
                if (d.data.age <= vis.userval) {
                    return "red";
                }
            })
        });

    vis.play_button = $("#memoriam-button");

    vis.sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    };

    vis.wrangleData();
};

/*
 * Data wrangling
 */

Memoriam.prototype.wrangleData = function(){
    var vis = this;
    
    vis.slider2.min(0).max(d3.max(vis.displayData, function(d) { return d.age})).default(0);

    vis.group2 = d3.select('div#slider2').append('svg')
        .attr('width', 500)
        .attr('height', 75)
        .attr("class", "center")
        .append('g')
        .attr('transform', 'translate(30,30)');

    vis.group2.call(vis.slider2);

    d3.select('p#value2').text(vis.slider2.value());
    d3.select('a#setValue2').on('click', () => { vis.slider2.value(0.015); d3.event.preventDefault(); });


    // Update the visualization
    vis.updateVis();
};



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

Memoriam.prototype.updateVis = function(){
    var vis = this;


    vis.testData["children"] = vis.displayData;

    //max size of the bubbles

    vis.bubble = d3.pack(vis.testData)
        .size([vis.diameter, vis.diameter])
        .padding(1.5);

        //bubbles needs very specific format, convert data to this.


    var root = d3.hierarchy(vis.testData)
        .sum(function(d) { return vis.maxage - d.age; });


    vis.node = vis.svg.selectAll(".node")
        .data(vis.bubble(root).descendants())
        .enter().filter(function(d){
            return  !d.children
        })
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    vis.deadcircles = vis.node.append("circle")
        .attr("r", function(d) { return d.r; })
        .attr("fill", "black")
        .on('mouseover', function(d) {
            vis.tool_tip.attr('class', 'd3-tip animate').show(d)
        })
        .on('mouseout', function(d) {
            vis.tool_tip.attr('class', 'd3-tip').show(d)
            vis.tool_tip.hide()
        });

    // vis.deadcircles = vis.node.append("circle")
    //     .attr("r", function(d) {
    //         return d.r; })
    //     .attr("fill", "black");

    d3.select(self.frameElement).style("height", vis.diameter + "px");
};

Memoriam.prototype.playMemoriam = function() {
    var vis = this;

    // reset circles to black and hide button and slider
    vis.deadcircles
        .attr("fill", function(d) {
            return "black";
        });
    vis.play_button.hide();
    vis.group2.style("visibility", "hidden");

    recursiveHelper(0, 0);

    function recursiveHelper(i, wait) {
        if (i > vis.maxage) {
            // show play button and slider
            vis.play_button.show();
            vis.group2.style("visibility", "visible");
            return;
        }
        vis.sleep(wait).then(function() {
            var transition = 0;
            var val = i;
            if (val < 4) {
                wait = 0;
                transition = 3000;
            }
            else if (val < 11) {
                wait = 500;
            }
            else {
                wait = 80;
            }
            $("#value2").text(val);
            $("#total-deaths").text(vis.total_deaths[val]);

            if (val < 4) {
                var number = 0;
                vis.deadcircles.transition()
                    .attr("fill", function (d) {
                        if (d.data.age <= val) return "red";
                    })
                    .attr("r", function (d) {
                        if (d.data.age <= val) return 2.5 * d.r;
                        return d.r;
                    })
                    .transition()
                    .duration(transition)
                    .on("start", function() { number += 1; })
                    .on("end", function () {
                        if (--number === 0) return recursiveHelper(i + 1, wait);
                    })
                    .attr("r", function (d) {
                        return d.r;
                    });
            }
            else {
                vis.deadcircles
                    .attr("fill", function (d) {
                        if (d.data.age <= val) return "red";
                    });
                return recursiveHelper(i + 1, wait);
            }
        });
    }
}
