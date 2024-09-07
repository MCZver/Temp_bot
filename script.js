// Функция для форматирования даты в строку день.месяц.год
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};
const formatDateTime = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = date.getFullYear();
	let hour = date.getHours();
	let minute = date.getMinutes();
	
	if (hour < 10) {
		hour = "0" + hour;
	}
	if (minute < 10) {
		minute = "0" + minute;
	}

    return `${hour}:${minute}`;
};

//Переменная для отслеживания нажатия кнопки "Детальнее" grm
let isClicked = false;

// Форматирование даты в ISO строку yyyy-mm-dd
const formatDateToResponse = (date) => date.toISOString().split('T')[0];

// Функция для расчета среднего значения влажности для каждого дня
const calculateDailyAverageHumidity = (hourlyHumidity, hourlyTimes, date) => {
	const dateStart = new Date(date);
    const dateEnd = new Date(date);
    dateEnd.setDate(dateStart.getDate() + 1);

    const dailyHumidities = hourlyHumidity.filter((_, i) => {
        const hourDate = new Date(hourlyTimes[i]);
        return hourDate >= dateStart && hourDate < dateEnd;
    });

    if (dailyHumidities.length === 0) return null;
    const sum = dailyHumidities.reduce((acc, humidity) => acc + humidity, 0);
    return (sum / dailyHumidities.length).toFixed(1);
};

// Функция для показа данных о погоде
function showWeather(index) {
    // Скрыть все данные
    document.querySelectorAll('.weather-info').forEach(el => el.style.display = 'none');
    // Показать только выбранные данные
    document.getElementById('date-' + index).style.display = 'block';
	//Обнуляем параметр Open елемента details
	document.querySelectorAll('.summ-det').forEach(el => {
		el.removeAttribute('open');
	});
	//Отслеживаем нажатие на кнопку выбора дня и обнуляем стили кнопки и блока "Дополнительно"
	document.querySelectorAll('.summ').forEach(el => {
            el.style.borderBottomLeftRadius = '48px';
            el.style.borderBottomRightRadius = '48px';
            //el.style.transition = '1s ease-in';
    });
	
	//Возвращаем значение нажатий кнопки "Дополнительно"
	isClicked = false;
}


//Обработка изменения стилей при нажатии на кнопку "Дополнительно"
function handleClick() {
    console.log('Summary clicked!'); 

    document.querySelectorAll('.summ').forEach(el => {
        if (!isClicked) {
            //применяем стили при нажатии кнопки "Дополнительно"
            el.style.borderBottomLeftRadius = '0px';
            el.style.borderBottomRightRadius = '0px';
            el.style.transition = '0.2s';
			el.style.transition = 'ease-in';
        } else {
            //Возвращаем исходные
            el.style.borderBottomLeftRadius = '';
            el.style.borderBottomRightRadius = '';
            el.style.transition = '0.2s'; 
        }
    });

    // Toggle the flag
    isClicked = !isClicked;
}
/*загрузка перевода из файла*/
async function loadTranslations() {
	try {
		const response = await fetch('translations.json'); // Загружаем JSON файл
		const translations = await response.json();// Преобразуем его в объект
		return translations;
	} catch (error) {
		console.error('Ошибка загрузки файла перевода:', error);
		return null;
	}
}

// Функция для получения перевода по ключу и языку
function getTranslation(translations, key, language) {
	if (translations[key] && translations[key][language]) {
		return translations[key][language];
	} else {
		return translations[key]["uk"]; // Значение по умолчанию
	}
}

// Инициализация данных при загрузке страницы
window.addEventListener('DOMContentLoaded', async () => {
    try {
		/*вывод переменных языка и цветовой схемы отдельно*/
		let userLanguage; 
		let colorScheme;
		const translations = await loadTranslations();
		let buttonLabels = [];
		window.Telegram.WebApp.ready();
		window.Telegram.WebApp.expand();

		// Проверка параметра "testmode" в URL, при значении true мы отвязываемся от телеграмм api
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('testmode') === 'true') {
            userLanguage = 'en';
			colorScheme = 'dark'; // Значение может быть 'white' или 'dark'
        } else	{
			userLanguage = window.Telegram.WebApp.initDataUnsafe.user.language_code;
			colorScheme = window.Telegram.WebApp.colorScheme;
		}
		//console.clear();
		console.log(window.Telegram.WebApp);
		
        // Получение текущей даты и даты через два дня
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 2);

        // Формирование строковых представлений дат
        const startDateStr = formatDateToResponse(today);
        const endDateStr = formatDateToResponse(endDate);

        // Запрос к API погоды
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=47.9057&longitude=33.394&hourly=relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration&timezone=auto&start_date=${startDateStr}&end_date=${endDateStr}`);
        
        if (!weatherResponse.ok) {
            throw new Error(`Ошибка HTTP: ${weatherResponse.status}`);
        }
        
        const weatherData = await weatherResponse.json();
        const dailyData = weatherData.daily;

        if (!dailyData || !dailyData.time) {
            throw new Error("Получены некорректные данные от API");
        }

        const {
            time,
            weather_code,
            temperature_2m_max,
            temperature_2m_min,
            apparent_temperature_max,
            apparent_temperature_min,
            precipitation_probability_max,
            wind_speed_10m_max,
			sunrise,
			sunset,
			daylight_duration
        } = dailyData;

        // Получение данных о влажности
        const hourlyHumidity = weatherData.hourly.relative_humidity_2m;
        const hourlyTimes = weatherData.hourly.time;

        // Формирование HTML с кнопками и данными о погоде
        const buttonsContainer = document.getElementById('buttons');
        const weatherDataContainer = document.getElementById('weather-data');
		const titleContainer = document.getElementById('title');
		//Лишний заголовок grm
		//titleContainer.insertAdjacentHTML('beforeend', 'Прогноз погоды');
		buttonLabels = translations.buttonLabels[userLanguage];
        time.forEach((date, index) => {
            const button = document.createElement('button');
            button.innerText = buttonLabels[index];
            button.onclick = () => showWeather(index);
            buttonsContainer.appendChild(button);
				
            /*const weatherHtml_ru = `
                <div id="date-${index}" class="weather-info">
                    <p class="date-heading">${buttonLabels[index]}</p>
					<p class="date-heading">${formatDate(new Date(date))}</p>
					<div class="weather-details">
						<p> ${weatherCodeToDescription_ru(weather_code[index])}</p>
						<p>Макс. t°: ${temperature_2m_max[index]}°C</p>
						<p>Мин. t°: ${temperature_2m_min[index]}°C</p>
						<p>Вероятность осадков: ${precipitation_probability_max[index]}%</p>
						<p>Макс. скор. ветра: ${wind_speed_10m_max[index]} км/ч</p>
						<p>Продолжительность дня: ${Math.round(daylight_duration[index] / 3600)} ч</p>
					</div>
					<div id="detailed">
        				<details class="summ-det">
            				<summary class="summ" onclick="handleClick()">Подробнее</summary>
								<div class="weather-details-extended">
									<p>Макс. t° по ощущениям: ${apparent_temperature_max[index]}°C</p>
									<p>Мин. t° по ощущениям: ${apparent_temperature_min[index]}°C</p>
									<p>Средняя влажность: ${calculateDailyAverageHumidity(hourlyHumidity, hourlyTimes, date)}%</p>
									<p>Восход: ${formatDateTime(new Date(sunrise[index]))}</p>
									<p>Заката: ${formatDateTime(new Date(sunset[index]))}</p>
								</div>
                </div>
            `;*/
			
			const weatherHtml = `
                <div id="date-${index}" class="weather-info">
				    <p class="date-heading">${buttonLabels[index]}</p>
                    <p class="date-heading">${formatDate(new Date(date))}</p>
					<div class="weather-details">
						<p>${getTranslation(translations, weather_code[index], userLanguage)}</p> <!--выводим значение погоды получая перевод из файла json, в функцию передаем индекс погоды и получаем значение для нужного языка -->
						<p>${getTranslation(translations, "max_t", userLanguage)}: ${temperature_2m_max[index]}°C
						   ${getTranslation(translations, "min_t", userLanguage)}: ${temperature_2m_min[index]}°C</p>
						<p>${getTranslation(translations, "chance_of_precipitation", userLanguage)}: ${precipitation_probability_max[index]}%</p>
						<p>${getTranslation(translations, "max_speed_wind", userLanguage)}: ${wind_speed_10m_max[index]} ${getTranslation(translations, "km_h", userLanguage)}</p>
						<p>${getTranslation(translations, "day_length", userLanguage)}: ${Math.round(daylight_duration[index] / 3600)} ${getTranslation(translations, "hours", userLanguage)}</p>
					</div>
					<div id="detailed">
        				<details class="summ-det">
            				<summary class="summ" onclick="handleClick()">${getTranslation(translations, "read_more", userLanguage)}</summary>
            					<div class="weather-details-extended">
									<p>${getTranslation(translations, "max_t_sensations", userLanguage)}: ${apparent_temperature_max[index]}°C</p>
									<p>${getTranslation(translations, "min_t_sensations", userLanguage)}: ${apparent_temperature_min[index]}°C</p>
									<p>${getTranslation(translations, "humidity", userLanguage)}: ${calculateDailyAverageHumidity(hourlyHumidity, hourlyTimes, date)}%</p>
									<p>${getTranslation(translations, "sunrise", userLanguage)}: ${formatDateTime(new Date(sunrise[index]))}</p>
									<p>${getTranslation(translations, "sunset", userLanguage)}: ${formatDateTime(new Date(sunset[index]))}</p>
								</div>
        				</details>
    				</div>
		
                </div>
            `;
			
			weatherDataContainer.insertAdjacentHTML('beforeend', weatherHtml);
			
			if (colorScheme === 'white') {
				document.body.classList.add('light-theme');
			} else if (colorScheme === 'dark') {
				document.body.classList.add('dark-theme');
			}
            
        });

        // Показать данные для первого дня по умолчанию
        showWeather(0);
    } catch (error) {
		//console.clear();
        console.error(error);
        document.body.innerHTML = `<p>Произошла ошибка при обработке запроса: ${error.message}</p>`;
    }
});
