let sheetID = '1rzYKg1Xz4al00i29DRlgo8MHn2mSieFK2Il8Y2VD0fU';
let spreadsheetName = 'Spielplan Liga 3';

let cacheDuration = 5 * 60 * 1000; // Cache-Dauer: 5 Minuten
let currentDay = 1; // Der aktuelle Spieltag
const totalDays = 15; // Insgesamt 15 Spieltage

// Wähle das Modal und seine Elemente aus
let modal = document.getElementById('gameModal');
let modalTitle = document.getElementById('modalTitle');
let modalDetails = document.getElementById('modalDetails');
let closeBtn = document.querySelector('.close');

// Schließen des Modals, wenn der Benutzer auf (X) klickt
closeBtn.onclick = function() {
    modal.style.display = 'none';
}

// Funktion zum Öffnen des Modals mit Spielinformationen
function openModal(matchData) {
    modalTitle.textContent = `${matchData.blau} vs ${matchData.rot}`;
    modalDetails.innerHTML = `
        <strong>Match ID:</strong> ${matchData.id}<br>
        <strong>Ergebnis:</strong> ${matchData.ergebnis || 'Noch nicht verfügbar'}
    `;
    modal.style.display = 'flex'; // Zeigt das Modal an
}

// Füge die Klick-Events zu den Tabellenzeilen hinzu
function renderMatchTable(jsonData) {
    let rows = jsonData.table.rows;
    let tableBody = document.querySelector('#table-body');
    tableBody.innerHTML = ''; // Lösche vorhandene Einträge

    // Erstelle die Zelle für den Spieltag über alle Zeilen hinweg
    let spieltagCell = document.createElement('td');
    spieltagCell.setAttribute('rowspan', rows.length); // Setzt die Zelle über alle Zeilen hinweg
    spieltagCell.textContent = `Spieltag ${currentDay}`;
    spieltagCell.style.textAlign = 'center'; // Zentriert den Text in der Zelle
    spieltagCell.style.fontWeight = 'bold';
    spieltagCell.style.verticalAlign = 'middle';

    let firstRow = document.createElement('tr');
    firstRow.appendChild(spieltagCell);

    firstRow.innerHTML += `
        <td>${rows[0].c[0]?.v || '-'}</td>
        <td>${rows[0].c[1]?.v || '-'}</td>
        <td>${rows[0].c[2]?.v || '-'}</td>
        <td>${rows[0].c[3]?.v || '-'}</td>
    `;
    
    // Klick-Event für die erste Zeile
    firstRow.addEventListener('click', function() {
        openModal({
            blau: rows[0].c[0]?.v || 'N/A',
            rot: rows[0].c[1]?.v || 'N/A',
            id: rows[0].c[2]?.v || 'N/A',
            ergebnis: rows[0].c[3]?.v || 'N/A'
        });
    });
    tableBody.appendChild(firstRow);

    // Füge die restlichen Spielreihen hinzu
    for (let i = 1; i < rows.length; i++) {
        let newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${rows[i].c[0]?.v || '-'}</td>
            <td>${rows[i].c[1]?.v || '-'}</td>
            <td>${rows[i].c[2]?.v || '-'}</td>
            <td>${rows[i].c[3]?.v || '-'}</td>
        `;

        // Klick-Event für die weiteren Zeilen
        newRow.addEventListener('click', function() {
            openModal({
                blau: rows[i].c[0]?.v || 'N/A',
                rot: rows[i].c[1]?.v || 'N/A',
                id: rows[i].c[2]?.v || 'N/A',
                ergebnis: rows[i].c[3]?.v || 'N/A'
            });
        });

        tableBody.appendChild(newRow);
    }
}

// Optional: Schließen des Modals, wenn der Benutzer außerhalb des Modals klickt
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Funktion zum Abrufen und Rendern der Liga-Daten
function fetchAndRenderData(URL, cacheKey, renderFunction) {
    fetch(URL)
        .then(res => res.text())
        .then(rep => {
            let jsonData = JSON.parse(rep.substr(47).slice(0, -2)); // Entfernt unnötige Zeichen von der Antwort

            // Speichere die Daten im Cache (localStorage) mit dem spezifischen Spieltag
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

// Funktion zum Überprüfen, ob der Cache für einen spezifischen Spieltag noch gültig ist
function isCacheValid(cacheKey) {
    let cached = JSON.parse(localStorage.getItem(cacheKey));
    if (!cached) return false; // Kein Cache vorhanden
    return Date.now() < cached.expiry; // Überprüfe Ablaufzeit
}

// Lade die Spieldaten des aktuellen Spieltags (Match-Tabelle)
function loadMatchData(day) {
    const dataRangeDay = `B${(day - 1) * 7 + 3}:E${(day - 1) * 7 + 6 + 3}`;
    const URL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${spreadsheetName}&range=${dataRangeDay}`;

    // Einzigartiger Cache-Key für den aktuellen Spieltag
    let cacheKey = `spielplan_day_${day}`;

    if (isCacheValid(cacheKey)) {
        // Lade Daten aus dem Cache
        let cachedData = JSON.parse(localStorage.getItem(cacheKey)).data;
        renderMatchTable(cachedData);
    } else {
        // Lade Daten von Google Sheets und rendere die Tabelle
        fetchAndRenderData(URL, cacheKey, renderMatchTable);
    }
}

// Gehe zum vorherigen Spieltag
function prevSlide() {
    currentDay = (currentDay - 1 < 1) ? totalDays : currentDay - 1;
    loadMatchData(currentDay);
}

// Gehe zum nächsten Spieltag
function nextSlide() {
    currentDay = (currentDay + 1 > totalDays) ? 1 : currentDay + 1;
    loadMatchData(currentDay);
}

// Initiales Laden des ersten Spieltags
loadMatchData(currentDay);