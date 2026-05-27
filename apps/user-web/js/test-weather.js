/* test-weather.js */
(async () => {
  const lat = 21.0285; // Hanoi
  const lon = 105.8542;
  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode`;
  try {
    const weatherRes = await fetch(openMeteoUrl).then(r => r.json());
    console.log('Open-Meteo response:', weatherRes);
    if (weatherRes && weatherRes.current) {
      const temp = Math.round(weatherRes.current.temperature_2m);
      const code = weatherRes.current.weathercode;
      console.log('Temp:', temp, 'Code:', code);
    }
  } catch (e) {
    console.error('Fetch error', e);
  }
})();
