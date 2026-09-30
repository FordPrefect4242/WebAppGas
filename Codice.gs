// Costanti
//TODO: Inserire ID del foglio Google Sheet
const SHEET_ID = "";


function doGet(e) {
  if (e.parameter.view === 'classifica') {
    return HtmlService.createHtmlOutputFromFile('Leaderboard')
      .setTitle('Classifica Gara')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (e.parameter.teamId) {
    let template = HtmlService.createTemplateFromFile('Team');
    template.teamId = e.parameter.teamId;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sd = ss.getSheetByName('Domande');
    template.numDom = sd.getDataRange().getValues().length - 1;
    const sheetTeam = ss.getSheetByName('Squadre');
    const data = sheetTeam.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == e.parameter.teamId) {
        template.teamName = data[i][1];
        break;
      }
    }
    
    return template.evaluate()
      .setTitle('Pannello Squadra')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createHtmlOutput('Accesso negato. Usa un link valido.');
}


function submitAnswer(teamId, problemId, ans1, ans2) {
  const now = new Date().getTime();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); 
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const foglioConfig = ss.getSheetByName('Configurazione');
    const startTime = new Date(foglioConfig.getRange('B1').getValue()).getTime();
    const durataMinuti = foglioConfig.getRange('B2').getValue();
    const endTime = startTime + durataMinuti*60000;
    const sheetConsegne = ss.getSheetByName('Consegne');
    const sheetDomande = ss.getSheetByName('Domande');

    if (now < startTime) {
      return { success: false, message: 'Gara non ancora iniziata.' };
    } else if (now > endTime) {
      return { success: false, message: 'Gara terminata.' };
    }
    
  
    const logData = sheetConsegne.getDataRange().getValues();
    for (let i = 1; i < logData.length; i++) {
      if (logData[i][1] == teamId && logData[i][2] == problemId && logData[i][5] == 'Corretta') {
        return { success: false, message: 'Hai già risolto questo problema!' };
      }
    }
    

    const domande = sheetDomande.getDataRange().getValues();
    let correct1, correct2, prec;
    for (let i = 1; i < domande.length; i++) {
      if (domande[i][0] == problemId) {
        correct1 = domande[i][2];
        correct2 = domande[i][3];
        prec = domande[i][4];
        break;
      }
    }
    

    const corrVal = parseFloat(String(correct1).trim());
    const corrExp = parseInt(String(correct2).trim());
    const insVal = parseFloat(String(ans1).trim());
    const insExp = parseInt(String(ans2).trim());
    const p = parseFloat(prec);
    const rat = (insVal/corrVal)*(10**(insExp-corrExp));
    const esito = (rat < (1+p) && 1/(1+p) < rat) ? 'Corretta' : 'Errata';
    

    sheetConsegne.appendRow([new Date(), teamId, problemId, ans1, ans2, esito, rat]);
    
    return { success: true, message: `Consegna registrata. Esito: ${esito}` };
    
  } finally {
    lock.releaseLock();
  }
}


function setJolly(teamId, problemId) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const startTime = new Date(ss.getSheetByName('Configurazione').getRange('B1').getValue()).getTime();
  const tJ = parseFloat(ss.getSheetByName('Configurazione').getRange('B6').getValue());
  const now = new Date().getTime();
  const diffMins = (now - startTime) / 60000;
  
  if (diffMins > tJ) {
    return { success: false, message: 'Tempo per scegliere il Jolly scaduto (primi ' + String((Math.round(100*tJ))/100) + ' minuti).' };
  } else if (diffMins < 0) {
    return { success: false, message: 'Gara non ancora iniziata.' };
  }

  
  
  const sheetJolly = ss.getSheetByName('Jolly');
  const jollyData = sheetJolly.getDataRange().getValues();
  for (let i = 1; i < jollyData.length; i++) {
    if (jollyData[i][0] == teamId) return { success: false, message: 'Jolly già scelto!' };
  }

  const sheetConsegne = ss.getSheetByName('Consegne');
  const consegneData = sheetConsegne.getDataRange().getValues();
  for (let i = 1; i < consegneData.length; i++) {
    if (consegneData[i][1] == teamId && 
        consegneData[i][2] == problemId && 
        consegneData[i][5] == 'Corretta') {
      return { success: false, message: 'Non puoi mettere il jolly su un problema già risolto!' };
    }
  }
  
  sheetJolly.appendRow([teamId, problemId, new Date()]);
  return { success: true, message: 'Jolly registrato con successo.' };
}

function g(p, k, m) {
  return Math.floor(p* Math.exp(4*(1-k)/m));
}


function getScoreboardData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  console.log('Foglio aperto...');
  const foglioConfig = ss.getSheetByName('Configurazione');
  console.log('Config aperto...');

  const parE = foglioConfig.getRange('B3').getValue(); // Aggiunti gli apici
  console.log("parE:", parE);
  const dom = ss.getSheetByName('Domande').getDataRange().getValues();
  const sq = ss.getSheetByName('Squadre').getDataRange().getValues();
  const parN = dom.length - 1;
  console.log("parN:", parN);
  const parA = foglioConfig.getRange('B4').getValue();
  console.log("parA:", parA);
  const parh = foglioConfig.getRange('B5').getValue();
  console.log("parh:", parh);
  
  const startTime = new Date(foglioConfig.getRange('B1').getValue()).getTime();
  const durataMinuti = foglioConfig.getRange('B2').getValue(); 
  const now = new Date().getTime();


  
  const parNs = sq.length - 1;
  console.log("parNs:", parNs);
  
  const teams = {}; 
  const problems = {};
  let fullers = 0;
  
  console.log('Caricamento squadre...');
 
  sq.slice(1).forEach(row => {
    let tId = row[0];
    teams[tId] = { name: row[1], score: 0, problems: {} , solved: {}, wrongs: [], ac: 0};
    for (let i = 0; i < parN; i++) {
      teams[tId].wrongs.push(0);
    }
  });
  
  console.log('Caricamento domande...');

  dom.slice(1).forEach(row => {
    problems[row[0]] = { 
      id: parseInt(row[0]),
      pb: parseInt(row[5]),
      pd: 70,
      currentVal: parseInt(row[5])+70, 
      solves: 0, 
      wrongCount: 0, 
      timeSecondSolve: null,
      firstSolvers: [] 
    };
  });
  
  console.log('Caricamento jolly...');

  ss.getSheetByName('Jolly').getDataRange().getValues().slice(1).forEach(row => {
    if (teams[row[0]]) teams[row[0]].jolly = parseInt(row[1]);
    teams[row[0]].ac = 1;
  });
  
  console.log('Caricamento consegne e calcolo squadre attive...');

  const log = ss.getSheetByName('Consegne').getDataRange().getValues().slice(1);
  log.sort((a, b) => new Date(a[0]) - new Date(b[0]));
  

  let squadreAttive = new Set();
  
  log.forEach(row => {
    const esito = row[5];
    const teamId = row[1];
    teams[teamId].ac = 1;
    if (esito === 'Corretta') {
      squadreAttive.add(teamId); // Il Set ignora in automatico i duplicati
      
    }
  });
  
  let parNSqAtt = squadreAttive.size;
  console.log("parNSqAtt (Squadre con >= 1 corretta):", parNSqAtt);

  let parSatt = Math.max(parNs/2, parNSqAtt, 5);
  console.log("parSatt calcolato:", parSatt);
  // ---------------------------------------------------

  console.log('Elaborazione cronologica punteggi...');

  log.forEach(row => {
    const timeConsegna = new Date(row[0]).getTime();
    
    const teamId = row[1];
    const problemId = row[2];
    const esito = row[5];
    

    
    if (!teams[teamId] || !problems[problemId]) return;

    const isJolly = teams[teamId].jolly == parseInt(problemId);
    const multiplier = isJolly ? 2 : 1;

    let timeComp;
    if (problems[problemId].timeSecondSolve === null) {
      timeComp = Math.min(timeConsegna, startTime+durataMinuti*60000); 
    } else {
      timeComp = problems[problemId].timeSecondSolve;
    }
    
    let minutiTrascorsi = Math.floor((timeComp - startTime) / 60000);
    if (minutiTrascorsi < 0) minutiTrascorsi = 0;
    
    if (esito === 'Errata') {

      let pIndex = parseInt(problemId) - 1; 
      teams[teamId].wrongs[pIndex] = Math.min(parh, teams[teamId].wrongs[pIndex] + 1);
      
  
      problems[problemId].wrongCount = 0; 
      for (let t in teams) {
        problems[problemId].wrongCount += teams[t].wrongs[pIndex]; 
      }
      
      teams[teamId].score -= (parE * multiplier);
      teams[teamId].problems[problemId] = (teams[teamId].problems[problemId] || 0) - (10 * multiplier);
      teams[teamId].solved[problemId] = 0;
    } 
    else if (esito === 'Corretta') {
      if (!teams[teamId].problems.hasOwnProperty(problemId)) {
        teams[teamId].problems[problemId] = 0;
      }
      
      teams[teamId].solved[problemId] = 1;
      
      let tot = 0;
      for (let key in teams[teamId].solved) {
        tot += teams[teamId].solved[key]; 
      }
      
      if (tot == parN) {
        fullers += 1;
    
        if(typeof g === "function") teams[teamId].score += g(20*parN, fullers, Math.sqrt(2*parSatt)); 
      }
      
      problems[problemId].solves++;
      
      if(typeof g === "function") {
          teams[teamId].problems[problemId] += g(20, problems[problemId].solves, Math.sqrt(4*parSatt)) * multiplier;
          teams[teamId].score += g(20, problems[problemId].solves, Math.sqrt(4*parSatt)) * multiplier; 
      }
    }
  });


  for (let p in problems) {
    if(typeof g === "function") {
        problems[p].currentVal = problems[p].pb + g(70 + parA * problems[p].wrongCount / parSatt, problems[p].solves, parSatt);
    }
  }

  for (let t in teams) {
    for (let p in problems) {
      if (teams[t].solved.hasOwnProperty(p)) {
        if (teams[t].solved[p] == 1) {
          let m = (teams[t].jolly == parseInt(p)) ? 2 : 1;
          teams[t].problems[p] += m * problems[p].currentVal;
          teams[t].score += m * problems[p].currentVal;
        }
      }
    }
    teams[t].score += parE*parN*(teams[t].ac);
  }


  return { 
    teams: teams, 
    problems: problems,
    startTime: startTime,
    duration: durataMinuti
  };
}
