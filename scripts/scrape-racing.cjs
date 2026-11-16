const https = require('https');
const fs = require('fs');

const divisions = {
  cuarta: '/futbol/cuarta-division',
  quinta: '/futbol/quinta-division',
  sexta: '/futbol/sexta-division',
  septima: '/futbol/septima-division',
  octava: '/futbol/octava-division',
  novena: '/futbol/novena-division',
  reserva: '/futbol/reserva/selectivo'
};

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.racingclub.com.ar',
      path: path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9'
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parsePlayers(html) {
  const players = [];
  // Match each <li> in <div class="jugadores">
  const jugadorBlockMatch = html.match(/<div class="jugadores">([\s\S]*?)<\/section>/i);
  if (!jugadorBlockMatch) return players;

  const content = jugadorBlockMatch[1];
  const liRegex = /<li>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRegex.exec(content)) !== null) {
    const li = liMatch[1];
    
    // Alt name or strong + text
    const altMatch = li.match(/alt="([^"]*)"/i);
    const strongMatch = li.match(/<strong>([^<]*)<\/strong>\s*([^<\r\n]*)/i);
    const posMatch = li.match(/<span class="posicion"><p>([^<]*)<\/p><\/span>/i);
    const imgSrcMatch = li.match(/data-src="([^"]*)"/i);
    const linkMatch = li.match(/href="([^"]*)"/i);

    let surname = '';
    let firstname = '';
    let fullName = '';

    if (strongMatch) {
      surname = strongMatch[1].replace(/,$/, '').trim();
      firstname = strongMatch[2].trim();
      fullName = `${surname}, ${firstname}`;
    } else if (altMatch) {
      fullName = altMatch[1].trim();
    }

    if (fullName) {
      players.push({
        fullName,
        surname,
        firstname,
        alt: altMatch ? altMatch[1].trim() : '',
        posicion: posMatch ? posMatch[1].trim() : '',
        img: imgSrcMatch ? imgSrcMatch[1].trim() : '',
        link: linkMatch ? linkMatch[1].trim() : ''
      });
    }
  }
  return players;
}

async function scrapeAll() {
  const results = {};
  for (const [key, path] of Object.entries(divisions)) {
    console.log(`Fetching ${key}...`);
    try {
      const html = await fetchUrl(path);
      const players = parsePlayers(html);
      results[key] = players;
      console.log(`  -> ${key}: ${players.length} players found`);
    } catch (err) {
      console.error(`Error fetching ${key}:`, err);
      results[key] = [];
    }
  }

  fs.writeFileSync('scripts/racing_official_rosters.json', JSON.stringify(results, null, 2));
  console.log('Saved scripts/racing_official_rosters.json');
}

scrapeAll();
