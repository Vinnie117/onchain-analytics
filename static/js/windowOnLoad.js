// Clear the input field on page load

window.onload = () => {

    const defaultInput = 300;
    document.getElementById('apply-input').value = '';
    updateScatterPlot("default_rich_list.json", defaultInput); // Load default data

    const h2Element = document.getElementById('hodl-heading');
    h2Element.textContent = `Days HODLed by Richest Addresses (Top ${defaultInput})`;

    // Age Bands plot
    const defaultInputAgeBands = 200;
    document.getElementById('age-bands-input').value = '';
    updateAgeBandsPlot("default_rich_list.json", defaultInputAgeBands);
    const h2AgeBands= document.getElementById('age-bands-heading');
    h2AgeBands.textContent = `Age Bands by Richest Addresses (Top ${defaultInputAgeBands})`;

    // Treemap
    document.getElementById('exclude-top').value = '';
    document.getElementById('exclude-bottom').value = '';
    
    // Portfolio value
    document.getElementById('allocation-btc').value = '';
    document.getElementById('allocation-spy').value = '';
    
    const defaultSpyAlloc = 95;
    const defaultBtcAlloc = 5;
    const heading = document.getElementById('pfvalue-heading');
    heading.innerText = `Portfolio Value for: ${defaultSpyAlloc}% SPY and ${defaultBtcAlloc}% BTC`;

    // Max drawdown
    document.getElementById('allocation-btc-mdd').value = '';
    document.getElementById('allocation-spy-mdd').value = '';
    const defaultSpyAllocMdd = 97;
    const defaultBtcAllocMdd = 3;
    const headingMdd = document.getElementById('pf-mdd-heading');
    headingMdd.innerText = `Portfolio Value and Max Drawdown for: ${defaultSpyAllocMdd}% SPY and ${defaultBtcAllocMdd}% BTC`;



};