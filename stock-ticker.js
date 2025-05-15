// Improved Stock Ticker with Multiple Fallbacks
// ----------------------------------------

// Array to store the fetched stock data
let stockData = [];

// List of stock symbols to fetch
const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];

// Console logging - set to false in production
const ENABLE_LOGS = true;

// Log function that only logs when enabled
function log(...args) {
  if (ENABLE_LOGS) console.log(...args);
}

// Main function to fetch and display stock data
async function initializeStockTicker() {
  log("Initializing stock ticker...");
  
  // Try various data sources in order
  let fetchSuccess = false;
  
  // First try: Your Nasdaq Data Link API
  if (!fetchSuccess) {
    try {
      log("Trying Nasdaq Data Link API...");
      fetchSuccess = await tryNasdaqDataLink();
    } catch (error) {
      console.error("Nasdaq Data Link API failed:", error);
    }
  }
  
  // Second try: Yahoo Finance API (via proxy)
  if (!fetchSuccess) {
    try {
      log("Trying Yahoo Finance API...");
      fetchSuccess = await tryYahooFinance();
    } catch (error) {
      console.error("Yahoo Finance API failed:", error);
    }
  }
  
  // Final fallback: Use sample data
  if (!fetchSuccess) {
    log("All data sources failed, using sample data");
    useSampleData();
  }
  
  // Regardless of data source, populate the ticker
  populateStockTicker();
  
  // Set up periodic updates
  setInterval(initializeStockTicker, 300000); // 5 minutes
}

// Try to fetch from Nasdaq Data Link
async function tryNasdaqDataLink() {
  try {
    // Your Nasdaq Data Link API key
    const apiKey = "s4sRFLh4rfyK3-ujaNys"; // Replace with your actual API key
    
    if (!apiKey || apiKey === "YOUR_API_KEY") {
      log("No Nasdaq API key provided, skipping this data source");
      return false;
    }
    
    // Use a specific dataset (EOD is more reliable than WIKI)
    const dataset = "EOD";
    
    // Sample symbol to test API connectivity
    const testSymbol = symbols[0];
    const url = `https://data.nasdaq.com/api/v3/datasets/${dataset}/${testSymbol}.json?api_key=${apiKey}`;
    
    log(`Testing API with ${testSymbol}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    log("Test API response:", data);
    
    // If test worked, fetch all symbols
    if (data && data.dataset && data.dataset.data) {
      const promises = symbols.map(symbol => fetchNasdaqSymbol(symbol, dataset, apiKey));
      stockData = await Promise.all(promises);
      return true;
    } else {
      log("Unexpected API response format");
      return false;
    }
  } catch (error) {
    console.error("Error in Nasdaq Data Link API:", error);
    return false;
  }
}

// Helper function to fetch a single symbol from Nasdaq
async function fetchNasdaqSymbol(symbol, dataset, apiKey) {
  try {
    const url = `https://data.nasdaq.com/api/v3/datasets/${dataset}/${symbol}.json?api_key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error for ${symbol}: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.dataset || !data.dataset.data || data.dataset.data.length < 2) {
      throw new Error(`Invalid data for ${symbol}`);
    }
    
    // Extract and format the data
    const latestData = data.dataset.data[0];
    const previousData = data.dataset.data[1];
    
    // The index depends on the dataset, but typically 4 is the close price
    const closeIndex = 4;
    const currentPrice = latestData[closeIndex];
    const previousPrice = previousData[closeIndex];
    
    // Calculate change
    const change = (currentPrice - previousPrice).toFixed(2);
    const changePercent = ((change / previousPrice) * 100).toFixed(2);
    
    return {
      symbol: symbol,
      price: currentPrice.toFixed(2),
      change: change >= 0 ? `+${change}` : `${change}`,
      changePercent: change >= 0 ? `+${changePercent}%` : `${changePercent}%`
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} from Nasdaq:`, error);
    return getSampleDataForSymbol(symbol);
  }
}

// Try to fetch from Yahoo Finance
async function tryYahooFinance() {
  try {
    // Use a CORS proxy to access Yahoo Finance API
    const proxyUrl = 'https://corsproxy.io/?';
    
    // Test with a single symbol first
    const testSymbol = symbols[0];
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${testSymbol}?interval=1d`;
    
    log(`Testing Yahoo Finance with ${testSymbol}...`);
    const response = await fetch(proxyUrl + encodeURIComponent(yahooUrl));
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    log("Yahoo Finance test response:", data);
    
    // If test worked, fetch all symbols
    if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
      const promises = symbols.map(symbol => fetchYahooSymbol(symbol, proxyUrl));
      stockData = await Promise.all(promises);
      return true;
    } else {
      log("Unexpected Yahoo Finance response format");
      return false;
    }
  } catch (error) {
    console.error("Error in Yahoo Finance API:", error);
    return false;
  }
}

// Helper function to fetch a single symbol from Yahoo Finance
async function fetchYahooSymbol(symbol, proxyUrl) {
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;
    const response = await fetch(proxyUrl + encodeURIComponent(yahooUrl));
    
    if (!response.ok) {
      throw new Error(`HTTP error for ${symbol}: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error(`Invalid data for ${symbol}`);
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    
    // Extract prices
    const latestClose = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    
    // Calculate change
    const change = (latestClose - previousClose).toFixed(2);
    const changePercent = ((change / previousClose) * 100).toFixed(2);
    
    return {
      symbol: symbol,
      price: latestClose.toFixed(2),
      change: change >= 0 ? `+${change}` : `${change}`,
      changePercent: change >= 0 ? `+${changePercent}%` : `${changePercent}%`
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} from Yahoo:`, error);
    return getSampleDataForSymbol(symbol);
  }
}

// Get sample data for a specific symbol
function getSampleDataForSymbol(symbol) {
  const sampleData = {
    'AAPL': { price: '187.32', change: '+1.25', changePercent: '+0.67%' },
    'MSFT': { price: '416.78', change: '-2.15', changePercent: '-0.51%' },
    'GOOGL': { price: '175.84', change: '+0.94', changePercent: '+0.54%' },
    'AMZN': { price: '182.41', change: '+1.87', changePercent: '+1.04%' },
    'META': { price: '489.99', change: '-3.27', changePercent: '-0.66%' },
    'TSLA': { price: '215.36', change: '+4.28', changePercent: '+2.03%' },
    'NVDA': { price: '924.78', change: '+12.43', changePercent: '+1.36%' },
    'JPM': { price: '198.63', change: '-0.85', changePercent: '-0.43%' },
    'V': { price: '275.44', change: '+1.32', changePercent: '+0.48%' },
    'WMT': { price: '152.89', change: '+0.63', changePercent: '+0.41%' }
  };
  
  return {
    symbol: symbol,
    price: sampleData[symbol]?.price || '100.00',
    change: sampleData[symbol]?.change || '+0.00',
    changePercent: sampleData[symbol]?.changePercent || '+0.00%'
  };
}

// Use sample data for all symbols
function useSampleData() {
  log("Using sample data");
  stockData = symbols.map(symbol => getSampleDataForSymbol(symbol));
}

// Function to populate the ticker with stock data
function populateStockTicker() {
  const ticker = document.getElementById('ticker');
  
  if (!ticker) {
    console.error("Ticker element not found!");
    return;
  }
  
  log("Populating ticker with data");
  
  // Clear existing content
  ticker.innerHTML = '';
  
  // Make sure we have data to display
  if (!stockData || stockData.length === 0) {
    log("No stock data available, using samples");
    useSampleData();
  }
  
  // Add each stock to the ticker
  stockData.forEach(stock => {
    const isPositive = stock.change.charAt(0) === '+';
    const stockElement = document.createElement('div');
    stockElement.className = 'ticker-item';
    stockElement.innerHTML = `
      <span class="stock-symbol">${stock.symbol}</span>
      <span class="stock-price">$${stock.price}</span>
      <span class="stock-change ${isPositive ? 'positive' : 'negative'}">${stock.change} (${stock.changePercent})</span>
    `;
    ticker.appendChild(stockElement);
  });
  
  // Duplicate the data to ensure continuous scrolling
  stockData.forEach(stock => {
    const isPositive = stock.change.charAt(0) === '+';
    const stockElement = document.createElement('div');
    stockElement.className = 'ticker-item';
    stockElement.innerHTML = `
      <span class="stock-symbol">${stock.symbol}</span>
      <span class="stock-price">$${stock.price}</span>
      <span class="stock-change ${isPositive ? 'positive' : 'negative'}">${stock.change} (${stock.changePercent})</span>
    `;
    ticker.appendChild(stockElement);
  });
  
  log("Ticker populated successfully");
}

// Update the character's mood based on stock performance
function updateCharacterMood() {
    // Skip if character functions aren't available
    if (typeof window.updateCharacterMood !== 'function') {
        console.log("Character mood update function not available");
        return;
    }
    
    // Count positive and negative stocks
    let positiveCount = 0;
    let negativeCount = 0;
    
    stockData.forEach(stock => {
        if (stock.change && stock.change.charAt(0) === '+') {
            positiveCount++;
        } else {
            negativeCount++;
        }
    });
    
    // Update character mood - use a DIFFERENT NAME to avoid recursion
    try {
        // Call the global function from character-interaction.js
        window.updateCharacterMoodState(positiveCount, negativeCount);
    } catch (error) {
        console.error("Error updating character mood:", error);
    }
}

// Call the function after populating ticker
updateCharacterMood();


// Start the ticker when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  log("DOM loaded, initializing stock ticker");
  initializeStockTicker();
});