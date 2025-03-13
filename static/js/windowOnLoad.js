// Clear the input field on page load

window.onload = () => {
    const defaultInput = 300;
    document.getElementById('apply-input').value = '';
    updateScatterPlot("default_rich_list.json", defaultInput); // Load default data

    const h2Element = document.getElementById('hodl-heading');
    h2Element.textContent = `Days HODLed by Richest Addresses (Top ${defaultInput})`;

    const defaultInputAgeBands = 300;
    document.getElementById('age-bands-input').value = '';
    //updateScatterPlot("default_rich_list.json", defaultInputAgeBands); // Load default data

    const h2AgeBands= document.getElementById('age-bands-heading');
    h2AgeBands.textContent = `Age Bands by Richest Addresses (Top ${defaultInputAgeBands})`;
};