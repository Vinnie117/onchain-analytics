// Select SVG and define margins/dimensions
const drawdown_svg = d3.select("#pf-mdd-plot"),
    marginDrawdown = { top: 60, right: 10, bottom: 20, left: 75 },
    widthDrawdown = +drawdown_svg.attr("width") - marginDrawdown.left - marginDrawdown.right,
    heightDrawdown = +drawdown_svg.attr("height") - marginDrawdown.top - marginDrawdown.bottom;

// SVG group container
const drawdown_chart = drawdown_svg.append("g")
    .attr("transform", `translate(${marginDrawdown.left},${marginDrawdown.top})`);


function updateDrawdownChart(data) {
  // Format and clean data
  const parsedData = data.map(d => ({
      date: new Date(d.Date),
      Combined: d.Portfolio_Value || 0
  }));

  // Clear previous chart
  drawdown_chart.selectAll("*").remove();

  // Scales
  const x = d3.scaleUtc()
    .domain(d3.extent(parsedData, d => d.date))
    .range([0, widthDrawdown]);

  const y = d3.scaleLinear()
    .domain(d3.extent(parsedData, d => d.Combined))
    .nice()
    .range([heightDrawdown, 0]);


  // Add transparent colors
  const color = d3.scaleOrdinal()
      .domain(["Combined"])
      .range(["#4682b4"]);

  // Axes
  drawdown_chart.append("g")
      .attr("transform", `translate(0,${heightDrawdown})`)
      .call(d3.axisBottom(x));

  drawdown_chart.append("g")
  .call(d3.axisLeft(y));

  // Y-axis label
  drawdown_chart.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", -50) // adjust for spacing from the axis
  .attr("x", -heightDrawdown / 2)
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .style("font-size", "16px")
  .style("font-weight", "bold")
  .text("Portfolio Value");


  // Legend
  const legend = drawdown_chart.append("g")
  .attr("class", "legend")
  .attr("transform", "translate(0, -30)");

  const legendItems = [
  { name: "Portfolio Value", color: "#4682b4", isLine: true }
  ];

  legend.selectAll("g")
  .data(legendItems)
  .enter()
  .append("g")
  .attr("transform", (d, i) => `translate(${i * 100}, 0)`)
  .each(function(d) {
      const g = d3.select(this);
      
      if (d.isLine) {
          g.append("line")
              .attr("x1", 0)
              .attr("y1", 5)
              .attr("x2", 20)
              .attr("y2", 5)
              .attr("stroke", d.color)
              .attr("stroke-width", 2);
      } else {
          g.append("rect")
              .attr("x", 0)
              .attr("y", -5)
              .attr("width", 20)
              .attr("height", 10)
              .attr("fill", d.color);
      }

      g.append("text")
          .attr("x", 25)
          .attr("y", 5)
          .attr("dy", "0.35em")
          .style("font-size", "12px")
          .text(d.name);
  });


  // Draw PF line
  const combinedLine = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.Combined));

  drawdown_chart.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", "#4682b4")
      .attr("stroke-width", 2)
      .attr("d", combinedLine);

  // Tooltip line
  const tooltipLine = drawdown_chart.append("line")
      .attr("stroke", "#000")
      .attr("y1", 0)
      .attr("y2", heightArea)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("display", "none");

  // Tooltip div
  const tooltip = d3.select("#pfvalue-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "#f4f4f4")
      .style("border", "1px solid #333")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "13px")
      .style("display", "none");

  // Interaction
  drawdown_chart.append("rect")
      .attr("width", widthArea)
      .attr("height", heightArea)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseover", () => {
          tooltip.style("display", "block");
          tooltipLine.style("display", "block");
      })
      .on("mouseout", () => {
          tooltip.style("display", "none");
          tooltipLine.style("display", "none");
      })
      .on("mousemove", function(event) {
          const [mouseX] = d3.pointer(event, this);
          const x0 = x.invert(mouseX);
          const bisect = d3.bisector(d => d.date).center;
          const i = bisect(parsedData, x0);
          const d = parsedData[i];

          tooltipLine.attr("x1", x(d.date)).attr("x2", x(d.date));

          tooltip
              .style("left", `${event.pageX + 15}px`)
              .style("top", `${event.pageY + 15}px`)
              .html(`
                  <strong>${d.date.toLocaleDateString()}</strong><br>
                  Combined: ${d.Combined.toFixed(2)}
              `);
      });
}

// Initial load
fetch('/static/data/pf_dd_data.json')
    .then(response => response.json())
    .then(data => updateDrawdownChart(data))
.catch(console.error);


// Event handler for updating portfolio
document.getElementById("update-portfolio-mdd-btn").addEventListener("click", () => {
  const btcInput = document.getElementById('allocation-btc-mdd').value.trim();
  const spyInput = document.getElementById('allocation-spy-mdd').value.trim();

  const btcAllocation = parseInt(btcInput, 10);
  const spyAllocation = parseInt(spyInput, 10);

  if (
      isNaN(btcAllocation) || isNaN(spyAllocation) ||
      btcInput.includes('.') || spyInput.includes('.')
  ) {
      alert('Please enter valid integer allocations.');
      return;
  }

  if (btcAllocation + spyAllocation !== 100) {
      alert('Allocations must sum to exactly 100. Use integers.');
      return;
  }

  fetch('/api/update-portfolio-dd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ btc_start: btcAllocation, spy_start: spyAllocation })
  })
  .then(res => res.json())
  .then(result => {
      if (result.status === "success") {
        updateDrawdownChart(result.data);
      } else {
          alert("Error calculating portfolio. Check server logs.");
      }
  })
  .catch(err => {
      console.error("Fetch error:", err);
      alert("Error updating portfolio data.");
  });
  // //Update heading with new values
  // const heading = document.getElementById('pfvalue-heading');
  // heading.innerText = `Portfolio Value for: ${spyAllocation}% SPY and ${btcAllocation}% BTC`;
});

// Enter button
function handleEnterKeyToUpdateDD(event) {
  if (event.key === 'Enter') {
      document.getElementById("update-portfolio-mdd-btn").click();
  }
}    
document.getElementById('allocation-btc-mdd').addEventListener('keydown', handleEnterKeyToUpdateDD);
document.getElementById('allocation-spy-mdd').addEventListener('keydown', handleEnterKeyToUpdateDD);


const slider = document.getElementById('mySlider');
const output = document.getElementById('sliderValue');
slider.addEventListener('input', function() {
  output.textContent = this.value;
});