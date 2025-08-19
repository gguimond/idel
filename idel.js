const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-extra');
require('puppeteer-extra-plugin-stealth/evasions/chrome.app');
require('puppeteer-extra-plugin-stealth/evasions/chrome.csi');
require('puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes');
require('puppeteer-extra-plugin-stealth/evasions/chrome.runtime');
require('puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow');
require('puppeteer-extra-plugin-stealth/evasions/media.codecs');
require('puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency');
require('puppeteer-extra-plugin-stealth/evasions/navigator.languages');
require('puppeteer-extra-plugin-stealth/evasions/navigator.permissions');
require('puppeteer-extra-plugin-stealth/evasions/navigator.plugins');
require('puppeteer-extra-plugin-stealth/evasions/navigator.vendor');
require('puppeteer-extra-plugin-stealth/evasions/navigator.webdriver');
require('puppeteer-extra-plugin-stealth/evasions/sourceurl');
require('puppeteer-extra-plugin-stealth/evasions/user-agent-override');
require('puppeteer-extra-plugin-stealth/evasions/webgl.vendor');
require('puppeteer-extra-plugin-stealth/evasions/window.outerdimensions');
require('puppeteer-extra-plugin-stealth/evasions/defaultArgs');
require('puppeteer-extra-plugin-user-preferences');
require('puppeteer-extra-plugin-user-data-dir');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_KEY
  },
});

const urlCalendridel = 'https://www.calendridel.fr/annonces/recherches/dpt=14/';
const urlAM = 'https://www.annonces-medicales.com/offres/infirmier-liberal/cession-installation,remplacement-regulier,remplacement-occasionnel/14-calvados/1/0/IN-3,IN-5,IN-2,IN-1,IN-4/0';
const urlCaducee = 'https://www.caducee.net/annonces-medicales/emploi-infirmier/calvados/'
const urlIDELib = 'https://www.ide-liberal.com/annonces.php'

puppeteer.use(StealthPlugin())

async function getBrowser() {
  const viewport = {
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 1080,
    isLandscape: true,
    isMobile: false,
    width: 1920,
  };
  const browser = await puppeteer.launch({
    args: puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    defaultViewport: viewport,
    executablePath: await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v138.0.2/chromium-v138.0.2-pack.x64.tar"
    ),
    headless: "shell",
  });
  return browser
}

async function fetchAndParseCalendridel() {
  const browser = await getBrowser()
  
  const page = await browser.newPage();

  // Définir un User-Agent pour simuler Chrome
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  await page.goto(urlCalendridel, { waitUntil: 'networkidle2' }); // Attendre que le réseau soit calme

  // Récupérer le contenu HTML après chargement
  const html = await page.content();

  const $ = require('cheerio').load(html);

  const annonces = [];

  // Parcourir chaque annonce
  $('.annonces-item').each((index, element) => {
    const annonce = {};

    const classes = $(element).attr('class').split(' ');
    const typeClass = classes.find(c => c.startsWith('annonces-item-type-'));
    if (typeClass) {
      annonce.type = typeClass.replace('annonces-item-type-', '');
    }
    if(!annonce.type || annonce.type === '2'){
      return
    }

    const villeElement = $(element).find('.annonces-item--villes a').first();
    if (villeElement.length) {
      annonce.localisation = villeElement.find('.annonces-item--villedpt_codepostal').text().trim() + ' ' + villeElement.find('.annonces-item--villedpt_nom').text().trim();
    } else {
      annonce.localisation = 'Inconnue';
    }

    const dateText = $(element).find('.annonces-item--dates .aig-contenu').text().trim();
    if (dateText) {
      annonce.date = dateText;
    } else {
      annonce.date = 'Inconnue';
    }

    const infos1Content = $(element).find('.annonces-item--details1').text().trim();
    annonce.detail = infos1Content;

    const infosTitle = $(element).find('.annonces-item-contenu--infos1-auteurcherche').text().trim();
    annonce.title = infosTitle;

    annonces.push(annonce);
  });

  await browser.close();

  return annonces
}

async function fetchAndParseAM() {
  const browser = await getBrowser()
  const page = await browser.newPage();

  // Définir un User-Agent pour simuler Chrome
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  await page.goto(urlAM, { waitUntil: 'networkidle2' }); // Attendre que le réseau soit calme

  // Récupérer le contenu HTML après chargement
  const html = await page.content();

  const $ = require('cheerio').load(html);

  const annonces = [];

  // Parcourir chaque annonce
  $('.annonce-medium').each((index, element) => {
    const annonce = {};

    const ville = $(element).find('.place a').first().text().trim();
    if (ville) {
      annonce.localisation = ville;
    } else {
      annonce.localisation = 'Inconnue';
    }

    const dateText = $(element).find('.annonce-labels-container h4').text().trim();
    if (dateText) {
      annonce.date = dateText;
    } else {
      annonce.date = 'Inconnue';
    }

    const infos1Content = $(element).find('.annonce-desc-container').text().trim();
    annonce.detail = infos1Content;

     const infosTitle = $(element).find('.annonce-list-title').text().trim();
    annonce.title = infosTitle;


    annonces.push(annonce);
  });

  await browser.close();

  return annonces
}

async function fetchAndParseCaducee() {
  const browser = await getBrowser()
  const page = await browser.newPage();

  // Définir un User-Agent pour simuler Chrome
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  await page.goto(urlCaducee, { waitUntil: 'networkidle2' }); // Attendre que le réseau soit calme

  // Récupérer le contenu HTML après chargement
  const html = await page.content();

  const $ = require('cheerio').load(html);

  const annonces = [];

  // Parcourir chaque annonce
  $('.list_ann > div').each((index, element) => {
    const annonce = {};

    const ville = $(element).find('.post-author-2').first().text().trim();
    if (ville) {
      annonce.localisation = ville;
    } else {
      annonce.localisation = 'Inconnue';
    }

    const dateText = $(element).find('.post-chapo').text().trim();
    if (dateText) {
      annonce.date = dateText;
    } else {
      annonce.date = 'Inconnue';
    }

    const infos1Content = $(element).find('.post-desc p').text().trim();
    annonce.detail = infos1Content;

    const infosTitle = $(element).find('.post-title').text().trim();
    annonce.title = infosTitle;

    annonces.push(annonce);
  });

  await browser.close();

  return annonces
}


async function fetchAndParseIDELib() {
  const browser = await getBrowser()
  const page = await browser.newPage();

  // Définir un User-Agent pour simuler Chrome
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  await page.goto(urlIDELib, { waitUntil: 'networkidle2' }); // Attendre que le réseau soit calme
  await page.select('#annonce_departement', '14')
  await page.waitForNavigation();


  //await page.setExtraHTTPHeaders({'content-type': 'application/x-www-form-urlencoded'})
  //await page.goto(urlIDELib, { method: 'POST', postData: 'submitAction=trier&annonce_departement=14&start=0&annonce_type=0', waitUntil: 'networkidle2' }); // Attendre que le réseau soit calme

  // Récupérer le contenu HTML après chargement
  const html = await page.content();

  const $ = require('cheerio').load(html);

  const annonces = [];

  // Parcourir chaque annonce
  $('article').each((index, element) => {
    const annonce = {};

    const ville = $(element).find('.list-inline:nth-child(2) > li:nth-child(3)').first().text().trim();
    if (ville) {
      annonce.localisation = ville;
    } else {
      annonce.localisation = 'Inconnue';
    }

    const dateText = $(element).find('.list-inline:nth-child(2) > li:first-child').text().trim();
    if (dateText) {
      annonce.date = dateText;
    } else {
      annonce.date = 'Inconnue';
    }

    const infos1Content = $(element).find('.post-body').text().trim();
    annonce.detail = infos1Content;

    const infosTitle = $(element).find('.post-title').text().trim();
    annonce.title = infosTitle;

    annonces.push(annonce);
  });

  await browser.close();

  return annonces
}

async function fetchAnnonces() {
  const calendridel = await fetchAndParseCalendridel();
  const am = await fetchAndParseAM();
  const caducee = await fetchAndParseCaducee();
  const idelib = await fetchAndParseIDELib();
  let html = `<h1><a href='${urlCalendridel}'>Caldendridel</a><h1>`
  for(let a of calendridel){
    html += `<h2>${a.localisation} - ${a.title}</h2><h3>${a.date}</h3><p><pre>${a.detail}<pre></p>`
  }
  html += `<h1><a href='${urlAM}'>Caldendridel</a><h1>`
  for(let a of am){
    html += `<h2>${a.localisation} - ${a.title}</h2><h3>${a.date}</h3><p><pre>${a.detail}<pre></p>`
  }
  html += `<h1><a href='${urlCaducee}'>Caldendridel</a><h1>`
  for(let a of caducee){
    html += `<h2>${a.localisation} - ${a.title}</h2><h3>${a.date}</h3><p><pre>${a.detail}<pre></p>`
  }
  html += `<h1><a href='${urlIDELib}'>Caldendridel</a><h1>`
  for(let a of idelib){
    html += `<h2>${a.localisation} - ${a.title}</h2><h3>${a.date}</h3><p><pre>${a.detail}<pre></p>`
  }
  return html
}

async function sendEmail(html) {
    const info = await transporter.sendMail({
        from: `"Annonces IDEL" <${process.env.EMAIL_FROM}>`,
        to: `${process.env.EMAIL_TO}`,
        subject: 'Annonces IDEL',
        html
      }).catch(console.error);

    return info ? info.messageId : null;
}


module.exports= async function run(){
  const html = await fetchAnnonces()
  return sendEmail(html)
}
