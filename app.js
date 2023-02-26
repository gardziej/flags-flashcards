import { getRandomCountry } from './utils.js';
const API_ALL_COUNTRIES_URL = 'https://restcountries.com/v3.1/all';
const FLAGS_IMG_URL = 'https://flagcdn.com/w1280/';
// const API_ALL_COUNTRIES_URL = 'data.json';
// const FLAGS_IMG_URL = 'assets/flags/';

const flashcardElement = document.getElementById('flashcard');
const flashcardContainerElement = document.getElementById('flashcardContainer');
const formEl = document.getElementById('settingsForm');
const counterEl = document.getElementById('counter');

let allCountriesRaw = [];
let codeToCountryList = new Map();
let currentCountry;
let filteredCountries = [];
let settings;


formEl.addEventListener('submit', (event) => {
  event.preventDefault();
  settings = Object.fromEntries(new FormData(formEl));
  fetch(API_ALL_COUNTRIES_URL).then(res => res.json()).then(countriesRaw => {
    allCountriesRaw = countriesRaw;
    countriesRaw.forEach(coutryRaw => {
      codeToCountryList.set(coutryRaw.cca3, settings.lang === 'eng' ? coutryRaw.name.common : coutryRaw.translations[settings.lang].common);
    });
    startNewGame();
  });
});

const startNewGame = () => {
  formEl.classList.toggle('hidden');
  filteredCountries = allCountriesRaw
    .filter(coutryRaw => coutryRaw.area > +settings.area &&
      (settings.continent === 'all' || coutryRaw.continents.includes(settings.continent))
    )
    .map(country => {
      return {
        name: settings.lang === 'eng' ? country.name.common : country.translations[settings.lang].common,
        flag_code: country.cca2.toLowerCase(),
        repeat: {
          inc: +settings.repeatInc,
          cor: +settings.repeatCor
        }, 
        borders: country.borders ? country.borders.map(border => codeToCountryList.get(border)).sort((a, b) => 0.5 - Math.random()) : [],
        cca3: country.cca3
      };
    });
    currentCountry = getRandomCountry(filteredCountries);
    createFlashCard(currentCountry);
}

const choiceAction = (countryName) => {
  const choicesEl = document.getElementById('choices');
  choicesEl.remove();
  const buttonEl = document.createElement('button');
  if (countryName === currentCountry.name) {
    buttonEl.innerText = 'DOBRZE, przejdź do następnej fiszki';
    if (currentCountry.repeat.cor < 1) {
      const currentCountryIndex = filteredCountries.findIndex(fCountry => fCountry.cca3 === currentCountry.cca3);
      filteredCountries.splice(currentCountryIndex, 1);
    }
    else {
      currentCountry.repeat.cor--;
    }
  }
  else {
    buttonEl.innerText = `źle, chodziło o ${currentCountry.name}, przejdź do następnej fiszki`;
    if (currentCountry.repeat.inc === 0) {
      const currentCountryIndex = filteredCountries.findIndex(fCountry => fCountry.cca3 === currentCountry.cca3);
      filteredCountries.splice(currentCountryIndex, 1);
    } 
    else if (currentCountry.repeat.inc > 0) {
      currentCountry.repeat.inc--;
    }
  }
  buttonEl.addEventListener('click', resultButtonHandler);
  flashcardElement.append(buttonEl);
};

const resultButtonHandler = () => {
  const finishedCountry = currentCountry;
  flashcardContainerElement.classList.toggle('hidden');
  if (filteredCountries.length > 1) {
    while (finishedCountry.cca3 === currentCountry.cca3) {
      currentCountry = getRandomCountry(filteredCountries);
    }
  }
  else if (filteredCountries.length === 1) {
    currentCountry = filteredCountries[0];
  }
  createFlashCard(currentCountry);
};

const createFlashCard = (country) => {
  counterEl.innerText = filteredCountries.length;
  flashcardContainerElement.classList.toggle('hidden');
  flashcardElement.innerHTML = '';
  if (filteredCountries.length < 1) {
    const buttonEl = document.createElement('button');
    buttonEl.addEventListener('click', () => {
      window.location.href = './';
    });
    buttonEl.innerText = 'KONIEC, zacznijmy od nowa';
    flashcardElement.append(buttonEl);
    return;
  }
  const imgEl = document.createElement('img');
  imgEl.setAttribute('src', FLAGS_IMG_URL + country.flag_code + '.png');
  flashcardElement.append(imgEl);
  const choices = [
    { name: country.name, type: 'answer' }, 
    ...country.borders.map(border => ({ name: border, type: 'border'}))
    ]
    .slice(0, settings.choices);
  while (choices.length < settings.choices) {
    const randomCountry = getRandomCountry(allCountriesRaw);
    const randomCountryName = settings.lang === 'eng' ? randomCountry.name.common : randomCountry.translations[settings.lang].common;
    if (-1 === choices.findIndex(choice => choice.name === randomCountryName)) {
      choices.push({
        name: randomCountryName,
        type: 'random'
      });
    }
  }
  choices.sort((a, b) => 0.5 - Math.random());
  const choicesEl = document.createElement('div');
  choicesEl.setAttribute('id', 'choices');
  choices.forEach(choice => {
    const buttonEl = document.createElement('button');
    buttonEl.innerText = choice.name;
    choicesEl.append(buttonEl);
  });
  choicesEl.addEventListener('click', (e) => choiceAction(e.target.innerText));
  flashcardElement.append(choicesEl);
};