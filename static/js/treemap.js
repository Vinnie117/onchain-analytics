const treemap_svg = d3.select("#treemap-plot"),
    marginTreemap = { top: 30, right: 20, bottom: 100, left: 70 },
    widthTreemap = +treemap_svg.attr("width") - marginTreemap.left - marginTreemap.right,
    heightTreemap = +treemap_svg.attr("height") - marginTreemap.top - marginTreemap.bottom;

const treemap_chart = treemap_svg.append("g")
    .attr("transform", `translate(${marginTreemap.left},${marginTreemap.top})`);

// Zoom behavior
const zoomBehavior = d3.zoom()
    .scaleExtent([1, 5])
    .on("zoom", zoomed);

treemap_svg.call(zoomBehavior);

function zoomed(event) {
    treemap_chart.attr("transform", event.transform);
}

function updateTreeMap(dataFile = '/static/data/corporate_treasuries_20250322.csv') {

    d3.csv(dataFile, d3.autoType).then(data => {

        const root = d3.hierarchy({ values: data }, d => d.values)
            .sum(d => d.Bitcoin)
            .sort((a, b) => b.value - a.value);

        d3.treemap()
            .size([widthTreemap, heightTreemap])
            .padding(2)(root);

        const treemap_color = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(data, d => d.Bitcoin)]);

        const nodes = treemap_chart.selectAll("g")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        nodes.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => treemap_color(d.value));

            nodes.append("text")
            .attr("class", "node")
            .attr("fill", "black")
            .attr("x", 4)
            .attr("y", 14)
            .text(d => d.data.Name)
            .style("font-size", function(d) {
                const rectWidth = d.x1 - d.x0;
                const rectHeight = d.y1 - d.y0;
                // Initial guess for font size based on rectangle size
                return `${Math.min(rectHeight / 2, rectWidth / d.data.Name.length * 1.8, 16)}px`;
            })
            .each(function(d) {
                const textEl = d3.select(this);
                let bbox = this.getBBox();
                const rectWidth = d.x1 - d.x0 - 4;  // slight padding
                const rectHeight = d.y1 - d.y0 - 4; // slight padding
                let fontSize = parseFloat(textEl.style("font-size"));
        
                // Iteratively shrink font until it fits
                while ((bbox.width > rectWidth || bbox.height > rectHeight) && fontSize > 5) {
                    fontSize -= 0.5;
                    textEl.style("font-size", `${fontSize}px`);
                    bbox = this.getBBox();
                }
        
                // If it still doesn't fit at minimum size, hide the text
                if (bbox.width > rectWidth || bbox.height > rectHeight) {
                    textEl.style("display", "none");
                }
            });
        
        
    });
}

updateTreeMap();

document.getElementById('treemap-download').addEventListener('click', () => {
    const svg = document.querySelector('#treemap-plot');
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    if (!source.includes('xmlns="http://www.w3.org/2000/svg"')) {
        source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    fetch('/static/css/style.css').then(response => response.text()).then(css => {
        const style = `<style>${css}</style>`;
        source = source.replace('</svg>', `${style}</svg>`);

        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'treemap.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }).catch(error => console.error('Error loading CSS:', error));
});
