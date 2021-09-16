// Width and height
const WIDTH = 980;
const HEIGHT = 700;

// SVG
const svg = d3
  .select("#map")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

// Tooltip
const tooltip = d3
  .select("#map")
  .append("div")
  .attr("id", "tooltip")
  .style("opacity", 0);

// Allows the SVG to turn into a map
const path = d3.geoPath();

// Colors
const colors = d3
  .scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(d3.schemeSpectral[8]);

// Legend
const LEG_WIDTH = 400;
const LEG_HEIGHT = 200 / d3.schemeSpectral[8].length;
const legScale = d3.scaleLinear().domain([2.6, 75.1]).range([0, LEG_WIDTH]);

const g = svg
  .append("g")
  .attr("id", "legend")
  .attr("transform", "translate(" + LEG_WIDTH + "," + LEG_HEIGHT + ")");

g.selectAll("rect")
  .data(
    colors.range().map((d) => {
      d = colors.invertExtent(d);

      if (d[0] === null) {
        d[0] = legScale.domain()[0];
      }

      if (d[1] === null) {
        d[1] = legScale.domain()[1];
      }

      return d;
    })
  )
  .enter()
  .append("rect")
  .attr("height", 8)
  .attr("x", (d) => legScale(d[0]))
  .attr("y", -8)
  .attr("width", (d) => legScale(d[1]) - legScale(d[0]))
  .attr("fill", (d) => colors(d[0]))
  .attr("stroke", "#000");

g.call(
  d3
    .axisBottom(legScale)
    .tickFormat((l) => Math.round(l) + "%")
    .tickSize(13)
    .tickValues(colors.domain())
)
  .select(".domain")
  .remove();

// Mouse event functions
const mouseover = function (e) {
  tooltip.style("opacity", 0.9);
  d3.select(this).style("stroke", "#000");
};

const mousemove = function (e) {
  const areaName = e.target.getAttribute("data-area-name");
  const state = e.target.getAttribute("data-state");
  const bachelorsOrHigher = e.target.getAttribute("data-education");
  var html = "<b>" + areaName + ", " + state + "</b>";
  html += "<p>" + bachelorsOrHigher + "% adults</p>";

  tooltip
    .html(html)
    .attr("data-education", bachelorsOrHigher)
    .style("left", e.pageX + 25 + "px")
    .style("top", e.pageY - 25 + "px");
};

const mouseleave = function (e) {
  tooltip.style("opacity", 0);
  d3.select(this).style("stroke", "none");
};

// Gets data from JSON files
const EDUCATION_FILE =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";

const COUNTY_FILE =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

const promises = [COUNTY_FILE, EDUCATION_FILE];

Promise.all(promises.map((url) => d3.json(url))).then(function (values) {
  svg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(values[0], values[0].objects.counties).features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .attr("data-fips", (v) => v.id)
    .attr("data-education", (v) => {
      let res = values[1].filter((val) => val.fips === v.id);

      if (res[0]) {
        return res[0].bachelorsOrHigher;
      }

      console.error("Could not find: ", v.id);
      return 0;
    })
    .attr("data-area-name", (v) => {
      let res = values[1].filter((val) => val.fips === v.id);

      if (res[0]) {
        return res[0].area_name;
      }

      console.error("Could not find: ", v.id);
      return "";
    })
    .attr("data-state", (v) => {
      let res = values[1].filter((val) => val.fips === v.id);

      if (res[0]) {
        return res[0].state;
      }

      console.error("Could not find: ", v.id);
      return "";
    })
    .attr("fill", (v) => {
      var res = values[1].filter((val) => val.fips === v.id);

      if (res[0]) {
        return colors(res[0].bachelorsOrHigher);
      }

      return colors(0);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  // Adds borders for states
  svg
    .append("path")
    .datum(
      topojson.mesh(values[0], values[0].objects.states, function (v1, v2) {
        return v1 !== v2;
      })
    )
    .attr("class", "state")
    .attr("d", path);
});
