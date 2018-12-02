allData = [];

var dataset = "data/gun-violence-min.csv";

// Load data
loadData();

// Date parser to convert strings to date objects
var parseDate = (dataset === "data/stage3.csv")? d3.timeParse("%Y-%m-%d") : d3.timeParse("%m/%d/%Y");

function loadData() {
    d3.csv(dataset, function(error, data){
        data.forEach(function(d) {
            d.latitude = +d.latitude;
            d.longitude = +d.longitude;
            d.n_injured = +d.n_injured;
            d.n_killed = +d.n_killed;
            d.casualties =  d.n_killed;
            d.date = parseDate(d.date);
            d.participant_age_dict = {};
            if (d.participant_age !== "") {
                (d.participant_age.split('||')).map(function (e) {
                    var b = e.split('::');
                    d.participant_age_dict[+b[0]] = +b[1];
                });
            }
            d.participant_status_dict = {};
            if (d.participant_status !== "") {
                (d.participant_status.split('||')).map(function (e) {
                    var b = e.split('::');
                    d.participant_status_dict[+b[0]] = b[1];
                });
            }
            d.participant_name_dict = {};
            if (d.participant_name !== "") {
                (d.participant_name.split('||')).map(function (e) {
                    var b = e.split('::');
                    d.participant_name_dict[+b[0]] = b[1];
                });
            }
        });
        createVis(data);
    });
}

function createVis(data) {

    // TO-DO: Instantiate visualization objects here

    console.log(data);
    incidentsMap = new IncidentsMap("incidents-map", data);
    memoriam = new Memoriam("memoriam", data);

    // Create event handler
    var eventHandler = {};
    timeplot = new TimePlot("timeplot", data, eventHandler);
    barplot = new BarPlot("barplot", data);

    $(eventHandler).bind("selectionChanged", function(event, rangeStart, rangeEnd){
        barplot.onSelectionChange(rangeStart, rangeEnd);
    });

}