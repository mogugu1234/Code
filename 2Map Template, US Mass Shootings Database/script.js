/*
LOADING DATA FROM MULTIPLE FILES

To load data from multiple files using d3.csv(), d3.json(), etc.,
we create an array, the items of which are defined by what's returned
by those functions. It's like we're calling those functions separately
and then placing their returned values in an array for later use.
*/
var promises = [
    d3.csv("./data/mass_shooting_events_stanford_msa_release_06142016.csv", parseCSV), 
    d3.json("./geojson/gz_2010_us_040_00_20m.json")
];

/*
PROMISE.ALL()

After we have created our array of promises, we can ask the browser
to wait until all file loading functions are complete before doing
anything with them -- using the Promise.all() construction.
*/
Promise.all(promises).then(function(data) {

    /*
    The data from both files loaded above are stored in an array 
    named `data` (at least, that's what we've named it here!).

    We can access the individual files' data by index position 
    inside that array.
    */

    console.log(data);

    /*
    STANFORD: US MASS SHOOTINGS DATABASE 1966 - 2016
    Adapted from:
    https://www.kaggle.com/carlosparadis/stanford-msa
    */
    var shootingsData = data[0];
    console.log(shootingsData);

    /*
    GEOJSON: UNITED STATES, STATE OUTLINES
    
    Note that this is in GeoJSON format, a special variety of JSON.
    */

    var usa = data[1];
    console.log(usa)

    /*
    BEGIN BY DEFINING THE DIMENSIONS OF THE SVG and CREATING THE SVG CANVAS
    */
    var width = document.querySelector("#chart").clientWidth;
    var height = document.querySelector("#chart").clientHeight;
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);


    /*
    MAKE THE BASE MAP
    */

    // The projection determines how latitude/longitude are transformed into x- and y-position
    var projection = d3.geoAlbers()
        .translate([width/2,height/2])
        .scale(1500);

    // The d3.geoPath() generator will convert our GeoJSON into SVG path elements
    var path = d3.geoPath().projection(projection);

    // Draw the paths (outlines for the states)
    svg.selectAll("path")
        .data(usa.features)
        .enter()
        .append("path")
            .attr("class","state")
            .attr("d", path);

    
    /* 
    DRAW POINTS ON TOP OF THE BASE MAP
    
    After we've drawn the base map, we need to draw the points we want to map.
    Here, we will draw one circle for each location where a mass shooting occurred in the US 
    in the year 2016. The size of the circle will be proportional to the number of deaths
    resulting from the given incident.

    */

    // This scale will convert number of victims to circle radius
    var rScale = d3.scaleSqrt()
        .domain([0,50])
        .range([0,25]);

    // Then, we will use a standard data join pattern to draw circles,
    // one for each mass shooting incident across the entire data set --
    // this includes data from the years 1966 - 2016
    svg.selectAll("circle")
        .data(shootingsData)
        .enter()
        .append("circle")
            .attr("cx", function(d) {
                var proj = projection([d.longitude, d.latitude]);
                return proj[0];
            }).attr("cy", function(d) {
                var proj = projection([d.longitude, d.latitude]);
                return proj[1];              
            }).attr("r", function(d) { return rScale(d.victims); })
            .attr("opacity",0.7)
            .attr("fill","#CC0000");


    
    /*
    SORT THE DATA

    We will sort the data by year, earliest to most recent
    */

    shootingsData = shootingsData.sort(function(a,b) { return a.year - b.year; });


    /*
    UPDATE THE SLIDER MIN AND MAX

    The HTML slider will enable us to change the map data by selected year
    */

    var slider = d3.select("#selectYear");

    slider
        .property("min", shootingsData[0].year)
        .property("max", shootingsData[shootingsData.length-1].year)
        .property("value", shootingsData[shootingsData.length-1].year);

    var initialYear = slider.property("value");

    /*
    MAKE A LABEL FOR THE CURRENTLY SELECTED YEAR
    */

    var yearLabel = svg.append("text")
        .attr("class","yearLabel")
        .attr("x", 25)
        .attr("y", height - 100)
        .text(initialYear);


    /*
    LISTEN FOR SLIDER CHANGES AND UPDATE MAP

    What is the difference between 'input' and 'change' events?
    */

    slider.on("input", function() {
        var year = this.value;
        updateMap(year);
    });


    /* 
    UPDATE WHICH POINTS ARE DRAWN

    Previously, we drew points for ALL data in the data set, regardless of year.
    Now, we only want to display data for a single year at a time -- we will accomplish
    this through the function updateMap() below.

    */


    function updateMap(year) {

        /* TASK 1 */
        // FILTER THE DATA
        // Filter shootingsData to only select data from the year
        // passed through the parameter named 'year' in updateMap(year)

        var yearData = shootingsData.filter(function(d){
        
            return d.year == year;
        });
        

        /* TASK 2 */
        // UPDATE THE DATA
        // Use the enter/update/exit pattern to redraw the points
        // on the map, using the filtered data from Step 1 above
        // Note: use the 'id' property for your key accessor function (why?)
        
        var enterPoints = svg.selectAll ("circle")
        .data(yearData);
        enterPoints.enter().append("circle")
        .attr("cx", function(d) {
            var proj = projection([d.longitude, d.latitude]);
            return proj[0];
        }).attr("cy", function(d) {
            var proj = projection([d.longitude, d.latitude]);
            return proj[1];              
        }).attr("r", function(d) { return rScale(d.victims); })
        .attr("opacity",0.7)
        .attr("fill","#CC0000")
        .merge(enterPoints)
        .transition()
        .attr("cx", function(d) {
            var proj = projection([d.longitude, d.latitude]);
            return proj[0];
        }).attr("cy", function(d) {
            var proj = projection([d.longitude, d.latitude]);
            return proj[1];              
        }).attr("r", function(d) { return rScale(d.victims); })
        .attr("opacity",0.7)
        .attr("fill","#CC0000")
        enterPoints.exit().remove();
     

        // Update the year label
        // (You don't need to do anything here)
        yearLabel.text(year);
    
        /* TASK 3 */
        // BIND TOOLTIP
        // Create a tooltip mouseover event for all the circles now drawn
        // in the map after you complete the enter/update/exit pattern;
        // the tooltip should display the location of the incident ('d.location').
        // Note: var 'tooltip' has already been defined elsewhere in the code,
        // so you only need to create the mouseover/mouseout event here

       
        
        svg.selectAll ("circle").on("mouseover", function(d){
         tooltip.style("visibility", "visible")
         .text(d.location);
        }).on("mouseout", function(){ 
        tooltip.style("visibility", "hidden");
        });  

}

    

    /* TASK 4: INITIALIZE MAP */
    // On page load, draw the map with data for the first time.
    // You only need a single line of code to do this;
    // how can you use the value of variable 'initialYear' to help you?

    


/*
    ADD A TOOLTIP
    We will create a reference to the tooltip here,
    but we will bind the tooltip to the circles created in
    the updateMap() function
    */

   var tooltip = d3.select("#chart")
   .append("div")
   .attr("class","tooltip");




});



/* 
CREATE A PARSE FUNCTION

A parse function is simply a function that we can use to clean up our data.
We first pass our data from the CSV file through this function, and then after that
the data get passed into the part of the script that will create the map from those data.

Here, the parse function will only select specific columns of interest
from the CSV file (we don't need all of them!) and also extract the
year from the date column.
*/
function parseCSV(data) {
    var d = {};
    d.id = data.CaseID;
    d.location = data.Location;
    d.latitude = +data.Latitude;
    d.longitude = +data.Longitude;
    d.victims = +data["Total Number of Victims"];
    d.date = new Date(data.Date);
    d.year = d.date.getFullYear();
    
    return d;
}
