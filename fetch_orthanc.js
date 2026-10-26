const https = require('https');

const options = {
    hostname: 'orthanc.uclouvain.be',
    path: '/downloads/windows-64/',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
};

https.get(options, (res) => {
    console.log('Status with user-agent:', res.statusCode);
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        const regex = /href="([^"]+)"/gi;
        let m;
        const links = [];
        while ((m = regex.exec(data)) !== null) links.push(m[1]);
        console.log('Links found:', links.slice(0, 15));
    });
}).on('error', e => console.error(e));
