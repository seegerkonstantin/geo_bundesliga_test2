let sheetID = '1rzYKg1Xz4al00i29DRlgo8MHn2mSieFK2Il8Y2VD0fU';
let spreadsheetLiga3 = 'Spielplan Liga 3';
let dataRange1 = 'P3:W17';  // Datenbereich für die 3. Liga
let URL1 = 'https://docs.google.com/spreadsheets/d/' + sheetID + '/gviz/tq?sheet=' + spreadsheetLiga3 + '&range=' + dataRange1;

let dataRange2 = 'B3:E23'; // Datenbereich für die aktuellen Spiele
let URL2 = 'https://docs.google.com/spreadsheets/d/' + sheetID + '/gviz/tq?sheet=' + spreadsheetLiga3 + '&range=' + dataRange2;

let cacheKey_L3T = 'L3_TableData'; // Schlüssel für Liga-Tabelle Cache
let cacheKey_L3M = 'L3_matchData';  // Schlüssel für aktuelle Spiele Cache
let cacheDuration = 1000 * 60 * 5; // Cache-Dauer: 5 Minuten

// Funktion zum Abrufen und Rendern der Liga-Daten
function fetchAndRenderData(URL, cacheKey, renderFunction) {
    fetch(URL)
    .then(res => res.text())
    .then(rep => {
        let jsonData = JSON.parse(rep.substr(47).slice(0,-2));

        // Speichere die Daten im Cache (localStorage)
        let cacheData = {
            data: jsonData,
            expiry: Date.now() + cacheDuration
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));

        // Render die Tabelle mit den Daten
        renderFunction(jsonData);
    })
    .catch(error => {
        console.error('Fehler beim Abrufen der Daten: ', error);
    });
}

// Funktion zum Rendern der Liga-Tabelle (1. Liga)
function renderLeagueTable(jsonData) {
    let rows = jsonData.table.rows;
    let tableBody = document.querySelector('.league-table tbody');
    tableBody.innerHTML = ''; // Platzhalter löschen

    rows.forEach(row => {
        let points = row.c[6]?.v || 0; // Punktewert aus der 3. Spalte (Index 2)
        points = parseFloat(points).toFixed(2); // Rundet die Punkte auf 2 Nachkommastellen
        
        let newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${row.c[0].v}</td>
            <td>${row.c[1].v}</td>
            <td>${row.c[3].v}</td>
            <td>${row.c[4].v}</td>
            <td>${row.c[5].v}</td>
            <td>${row.c[6].v}</td>
            <td>${row.c[7].v}</td>
            <td>${points}</td>
        `;
        tableBody.appendChild(newRow);
    });

    // Füge der Tabelle den roten Hintergrund für die letzten drei hinzu
    let allRows = tableBody.querySelectorAll('tr');

    // First three rows for the top positions
    let firstThreeRows = [...allRows].slice(0, 3); 
    firstThreeRows.forEach(row => {
        row.classList.add('first-three');
    });

    // Fourth place as a special relegation position
    if (allRows[3]) {
        allRows[3].classList.add('relegation');
    }
}

// Funktion zum Rendern der aktuellen Spiele (Match-Tabelle)
function renderMatchTable(jsonData) {
    let rows = jsonData.table.rows;
    let tableBody = document.querySelector('.match-table tbody');
    tableBody.innerHTML = ''; // Platzhalter löschen

    rows.forEach(row => {
        let newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${row.c[0]?.v || '-'}</td>
            <td>${row.c[1]?.v || '-'}</td>
            <td>${row.c[2]?.v || '-'}</td>
            <td>${row.c[3]?.v || '-'}</td>
        `;
        tableBody.appendChild(newRow);
    });
}

// Funktion zum Überprüfen, ob der Cache noch gültig ist
function isCacheValid(cacheKey) {
    let cached = JSON.parse(localStorage.getItem(cacheKey));
    if (!cached) return false; // Kein Cache vorhanden
    return Date.now() < cached.expiry; // Überprüfe Ablaufzeit
}

// Lade die Liga-Daten entweder aus dem Cache oder durch API-Abfrage
function loadTableData() {
    if (isCacheValid(cacheKey_L3T)) {
        let cachedData = JSON.parse(localStorage.getItem(cacheKey_L3T)).data;
        renderLeagueTable(cachedData);
    } else {
        fetchAndRenderData(URL1, cacheKey_L3T, renderLeagueTable);
    }
}

// Lade die Spieldaten des aktuellen Spieltags (Match-Tabelle)
function loadMatchData() {
    if (isCacheValid(cacheKey_L3M)) {
        let cachedData = JSON.parse(localStorage.getItem(cacheKey_L3M)).data;
        renderMatchTable(cachedData);
    } else {
        fetchAndRenderData(URL2, cacheKey_L3M, renderMatchTable);
    }
}

// Lade die Liga- und Spieldaten beim Seitenaufruf
loadTableData();
loadMatchData();