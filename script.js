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

// Пример функции для преобразования кодов погоды в описания
const weatherCodeToDescription_ru = (code) => {
    switch (code) {
        case 0: return "Чистое небо"
		case 1: return "Предпочтительно ясно"
		case 2: return "Облачно"
		case 3: return "Переменная облачность"
		case 45: return "Туман"
		case 48: return "Иний"
		case 51: return "Слабая морось"
		case 53: return "Мряка"
		case 55: return "Густой туман"
		case 56: return "Легкий ледяной дождь"
		case 57: return "Сильный ледяной дождь"
		case 61: return "Слабый дождь"
		case 63: return "Дождь"
		case 65: return "Сильный дождь"
		case 66: return "Слабый град"
		case 67: return "Сильный град"
		case 71: return "Слабый снегопад"
		case 73: return "Снегопад"
		case 75: return "Сильный снегопад"
		case 77: return "Снежные крупинки"
		case 80: return "Небольшой ливень"
		case 81: return "Ливень"
		case 82: return "Сильный ливень"
		case 85: return "Небольшая метель"
		case 86: return "Сильная метель"
		case 95: return "Гроза"
		case 96: return "Гроза с градом"
		case 99: return "Гроза с сильным градом"
    }
};

const weatherCodeToDescription_ua = (code) => {
    switch (code) {
        case 0: return "Чисте небо"
		case 1: return "Переважно ясно"
		case 2: return "Мінлива хмарність"
		case 3: return "Похмуро"
		case 45: return "Туман"
		case 48: return "Іній"
		case 51: return "Слабка мряка"
		case 53: return "Мряка"
		case 55: return "Густа мряка"
		case 56: return "Легкий крижаний дощ"
		case 57: return "Сильний крижаний дощ"
		case 61: return "Слабкий дощ"
		case 63: return "Дощ"
		case 65: return "Сильний дощ"
		case 66: return "Слабкий град"
		case 67: return "Сильний град"
		case 71: return "Слабкий снігопад"
		case 73: return "Снігопад"
		case 75: return "Сильний снігопад"
		case 77: return "Снігові крупинки"
		case 80: return "Невелика злива"
		case 81: return "Злива"
		case 82: return "Сильна злива"
		case 85: return "Невелика завірюха"
		case 86: return "Сильна завірюха"
		case 95: return "Гроза"
		case 96: return "Гроза з градом"
		case 99: return "Гроза з сильним градом"
        default: return "Невідомо";
    }
};

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

// Инициализация данных при загрузке страницы
window.addEventListener('DOMContentLoaded', async () => {
    try {
		let buttonLabels = [];
		window.Telegram.WebApp.ready();
		window.Telegram.WebApp.expand();
		// Получение языка пользователя
		//const userLanguage = window.Telegram.WebApp.initDataUnsafe.user.language_code || 'ru';
		const userLanguage = 'uk';
		// Определяем переменную colorScheme
		//const colorScheme = window.Telegram.WebApp.colorScheme;
		const colorScheme = 'dark'; // Значение может быть 'white' или 'dark'
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
		if(userLanguage === "ru") {
				//Лишний заголовок grm
				//titleContainer.insertAdjacentHTML('beforeend', 'Прогноз погоды');
				buttonLabels = ['Сегодня', 'Завтра', 'Послезавтра'];
			}
			if(userLanguage === "uk") {
				//Зайвий заголовок grm
				//titleContainer.insertAdjacentHTML('beforeend', 'Прогноз погоди');
				buttonLabels = ['Сьогодні', 'Завтра', 'Післязавтра'];
			}
        time.forEach((date, index) => {
            const button = document.createElement('button');
            button.innerText = buttonLabels[index];
            button.onclick = () => showWeather(index);
            buttonsContainer.appendChild(button);
				
            const weatherHtml_ru = `
                <div id="date-${index}" class="weather-info">
                    <!-- <p> class="date-heading">${buttonLabels[index]}</p> -->
					<p> class="date-heading">${formatDate(new Date(date))}</p>
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
									<p>Макс. t° по ощущениям:</strong> ${apparent_temperature_max[index]}°C</p>
									<p>Мин. t° по ощущениям:</strong> ${apparent_temperature_min[index]}°C</p>
									<p>Средняя влажность:</strong> ${calculateDailyAverageHumidity(hourlyHumidity, hourlyTimes, date)}%</p>
									<p>Восход:</strong> ${formatDateTime(new Date(sunrise[index]))}</p>
									<p>Заката:</strong> ${formatDateTime(new Date(sunset[index]))}</p>
								</div>
                </div>
            `;
			
			const weatherHtml_ua = `
                <div id="date-${index}" class="weather-info">
				    <!-- <p class="date-heading">${buttonLabels[index]}</p> --> 
                    <p class="date-heading">${formatDate(new Date(date))}</p>
					<div class="weather-details">
						<p>${weatherCodeToDescription_ua(weather_code[index])}</p>
						<p>Макс. t°: ${temperature_2m_max[index]}°C
						Мін. t°: ${temperature_2m_min[index]}°C</p>
						<p>Вірогідність опадів: ${precipitation_probability_max[index]}%</p>
						<p>Макс. шв. вітру: ${wind_speed_10m_max[index]} км/ч</p>
						<p>Тривалість дня: ${Math.round(daylight_duration[index] / 3600)} г</p>
					</div>
					<div id="detailed">
        				<details class="summ-det">
            				<summary class="summ" onclick="handleClick()">Детальніше</summary>
            					<div class="weather-details-extended">
									<p>Макс. t° по відчуттям: ${apparent_temperature_max[index]}°C</p>
									<p>Мін. t° по відчуттям: ${apparent_temperature_min[index]}°C</p>
									<p>Середня вологість: ${calculateDailyAverageHumidity(hourlyHumidity, hourlyTimes, date)}%</p>
									<p>Схід сонця: ${formatDateTime(new Date(sunrise[index]))}</p>
									<p>Захід сонця: ${formatDateTime(new Date(sunset[index]))}</p>
								</div>
        				</details>
    				</div>
		
                </div>
            `;
			
			if(userLanguage === "ru") {
				weatherDataContainer.insertAdjacentHTML('beforeend', weatherHtml_ru);
			}
			if(userLanguage === "uk") {
				weatherDataContainer.insertAdjacentHTML('beforeend', weatherHtml_ua);
			}
			
			if (colorScheme === 'white') {
				document.body.classList.add('light-theme');
			} else if (colorScheme === 'dark') {
				document.body.classList.add('dark-theme');
			}
            
        });

        // Показать данные для первого дня по умолчанию
        showWeather(0);
    } catch (error) {
        console.error(error);
        document.body.innerHTML = `<p>Произошла ошибка при обработке запроса: ${error.message}</p>`;
    }
});
