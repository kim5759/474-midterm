"use-strict";

let data = "";
let svgContainer = ""; // keep SVG reference in global scope
let popChartContainer = "";
const msm = {
    width: 1000,
    height: 800,
    marginAll: 50,
    marginLeft: 50,
}
const small_msm = {
    width: 500,
    height: 500,
    marginAll: 50,
    marginLeft: 80
}

// load data and make scatter plot after window loads
window.onload = function () {
    svgContainer = d3.select("#chart")
        .append('svg')
        .attr('width', msm.width)
        .attr('height', msm.height);
    popChartContainer = d3.select("#popChart")
        .append('svg')
        .attr('width', msm.width)
        .attr('height', msm.height);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("/data/pokemon.csv")
        .then((d) => this.makeScatterPlot(d))
}

function makeScatterPlot(csvData) {
    // assign data as global variable; filter out unplottable values
    data = csvData.filter((data) => { return data["Sp. Def"] != "NA" && data.Total != "NA" })

    let dropDown = d3.select("#filter").append("select")
        .attr("name", "Generation");

    let dropDown2 = d3.select("#filter2").append("select")
        .attr("name", "Legendary");

    // get arrays of fertility rate data and life Expectancy data
    let def_data = data.map((row) => parseFloat(row["Sp. Def"]));
    let total_data = data.map((row) => parseFloat(row["Total"]));

    // find data limits
    let axesLimits = findMinMax(def_data, total_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "Sp. Def", "Total", svgContainer, msm);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels(svgContainer, msm, "Pokemon: Special Defense vs Total Stats", 'Sp. Def', 'Total');

    let distinctGen = [...new Set(data.map(d => d.Generation))];
    let defaultGen = 1;

    let distinctLegendary = [...new Set(data.map(d => d.Legendary))];
    let defaultLegendary = true;

    let options = dropDown.selectAll("option")
        .data(distinctGen)
        .enter()
        .append("option")
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; })
        .attr("selected", function (d) { return d == defaultGen; })

    let options2 = dropDown2.selectAll("option")
        .data(distinctLegendary)
        .enter()
        .append("option")
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; })
        .attr("selected", function (d) { return d == defaultLegendary; })

    showCircles(dropDown.node());
    dropDown.on("change", function () {
        showCircles(this)
    });

    dropDown2.on("change", function () {
        showCircles2(this)
    });
}

function showCircles(me) {
    let selected = me.value;
    displayOthers = me.checked ? "inline" : "none";
    display = me.checked ? "none" : "inline";

    svgContainer.selectAll(".circles")
        .data(data)
        .filter(function (d) { return selected != d.Generation; })
        .attr("display", displayOthers);

    svgContainer.selectAll(".circles")
        .data(data)
        .filter(function (d) { return selected == d.Generation; })
        .attr("display", display);
}

function showCircles2(me) {
    let selected2 = me.value;
    displayOthers = me.checked ? "inline" : "none";
    display = me.checked ? "none" : "inline";

    svgContainer.selectAll(".circles")
        .data(data)
        .filter(function (d) { return selected2 != d.Legendary; })
        .attr("display", displayOthers);

    svgContainer.selectAll(".circles")
        .data(data)
        .filter(function (d) { return selected2 == d.Legendary; })
        .attr("display", display);
}

// make title and axes labels
function makeLabels(svgContainer, msm, title, x, y) {
    svgContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 90)
        .attr('y', msm.marginAll / 2 + 10)
        .style('font-size', '12pt')
        .text(title);

    svgContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 + 50)
        .attr('y', msm.height - 10)
        .style('font-size', '12pt')
        .text(x);

    svgContainer.append('text')
        .attr('transform', 'translate( 15,' + (msm.height / 2 + 30) + ') rotate(-90)')
        .style('font-size', '12pt')
        .text(y);
}

// plot all the data points on the SVG
// and add tooltip functionality
function plotData(map) {
    // get population data as array
    curData = data.filter((row) => {
        return row.Generation == 1 && row["Sp. Def"] != "NA" && row.Total != "NA"
    })
    let pop_data = data.map((row) => +row["Type 1"]);
    let pop_limits = d3.extent(pop_data);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let toolChart = div.append('svg')
        .attr('width', small_msm.width)
        .attr('height', small_msm.height)

    const colors = {
        "Bug": "#4E79A7",
        "Dark": "#A0CBE8",
        "Dragon": "#f7833b",
        "Electric": "#F28E2B",
        "Fairy": "#B260C4",
        "Fighting": "#59A14F",
        "Fire": "#8CD17D",
        "Ghost": "#B6992D",
        "Grass": "#499894",
        "Ground": "#86BCB6",
        "Ice": "#86BCB6",
        "Normal": "#E15759",
        "Poison": "#FF9D9A",
        "Psychic": "#79706E",
        "Rock": "#adaaa8",
        "Steel": "#BAB0AC",
        "Water": "#D37295"
    }

    var cValue = function (d) { return d["Type 1"]; }

    var newType = [...new Set(data.map(function (d) { return d["Type 1"] }))];
    var firstOccurrence = newType.map(function (d) {
        return data.find(function (e) {
            return e["Type 1"] === d
        })
    });

    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', 8)
        .attr('stroke', 'black')
        .attr('fill', function (d) { return colors[cValue(d)]; })
        .attr("class", "circles")
        // add tooltip functionality to points
        .on("mouseover", (d) => {
            toolChart.selectAll("*").remove()
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.Name + "<br/>" +
                d["Type 1"] + "<br/>" +
                d["Type 2"])
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");

        })
        .on("mouseout", (d) => {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // draw legend
    var legend = svgContainer.selectAll(".legend")
        .data(firstOccurrence)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", msm.width - 20)
        .attr("y", 92)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function (d) { return colors[d["Type 1"]]; });

    // draw legend text
    legend.append("text")
        .attr("x", msm.width - 30)
        .attr("y", 100)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function (d) { return d["Type 1"]; });

}

// draw the axes and ticks
function drawAxes(limits, x, y, svgContainer, msm) {
    // return x value from a row of data
    let xValue = function (d) {
        return +d[x];
    }

    // function to scale x value
    let xScale = d3.scaleLinear()
        .domain([limits.xMin - 2.5, limits.xMax + 1.5]) // give domain buffer room
        .range([0 + msm.marginAll, msm.width - msm.marginAll])

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) {
        return xScale(xValue(d));
    };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
        .attr('transform', 'translate(0, ' + (msm.height - msm.marginAll) + ')')
        .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) {
        return +d[y]
    }

    // function to scale y
    let yScale = d3.scaleLinear()
        .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
        .range([0 + msm.marginAll, msm.height - msm.marginAll])

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) {
        return yScale(yValue(d));
    };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
        .attr('transform', 'translate(' + msm.marginAll + ', 0)')
        .call(yAxis);

    // return mapping and scaling functions
    return {
        x: xMap,
        y: yMap,
        xScale: xScale,
        yScale: yScale
    };
}

// find min and max for arrays of x and y
function findMinMax(x, y) {

    // get min/max x values
    let xMin = -10;
    let xMax = 180;

    // get min/max y values
    let yMin = 150;
    let yMax = 800;

    // return formatted min/max data as an object
    return {
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax
    }
}
