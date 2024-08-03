// Функция для форматирования даты в строку день.месяц.год
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

// Форматирование даты в ISO строку yyyy-mm-dd
const formatDateToResponse = (date) => date.toISOString().split('T')[0];

// Пример функции для преобразования кодов погоды в описания
const weatherCodeToDescription = (code) => {
    switch (code) {
        case 0: return "Ясно";
        case 1: return "Малоблачно";
        case 2: return "Облачно";
        case 3: return "Переменная облачность";
        case 45: return "Туман";
        case 48: return "Заморозки тумана";
        case 51: return "Легкий дождь";
        case 53: return "Умеренный дождь";
        case 55: return "Сильный дождь";
        case 56: return "Легкий дождь с льдом";
        case 57: return "Сильный дождь с льдом";
        case 61: return "Легкий дождь с осадками";
        case 63: return "Умеренный дождь с осадками";
        case 65: return "Сильный дождь с осадками";
        case 66: return "Легкий дождь с льдом и осадками";
        case 67: return "Сильный дождь с льдом и осадками";
        case 71: return "Легкий снег";
        case 73: return "Умеренный снег";
        case 75: return "Сильный снег";
        case 77: return "Легкие снежинки";
        case 80: return "Легкий дождь и осадки";
        case 81: return "Умеренный дождь и осадки";
        case 82: return "Сильный дождь и осадки";
        case 85: return "Легкий снегопад";
        case 86: return "Сильный снегопад";
        case 95: return "Гроза";
        case 96: return "Гроза с легким дождем";
        case 99: return "Гроза с сильным дождем";
        default: return "Неизвестно";
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
}

// Инициализация данных при загрузке страницы
window.addEventListener('DOMContentLoaded', async () => {
    try {
		window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            // Получение языка пользователя
            //const userLanguage = window.Telegram.WebApp.initDataUnsafe.user.language_code || 'ru';
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
            wind_speed_10m_max
        } = dailyData;

        // Получение данных о влажности
        const hourlyHumidity = weatherData.hourly.relative_humidity_2m;
        const hourlyTimes = weatherData.hourly.time;

        // Формирование HTML с кнопками и данными о погоде
        const buttonsContainer = document.getElementById('buttons');
        const weatherDataContainer = document.getElementById('weather-data');

        time.forEach((date, index) => {
            const button = document.createElement('button');
            button.innerText = formatDate(new Date(date));
            button.onclick = () => showWeather(index);
            buttonsContainer.appendChild(button);

            const weatherHtml = `
                <div id="date-${index}" class="weather-info" style="display: none;">
                    <h2>${formatDate(new Date(date))}</h2>
                    <p><strong>Описание погоды:</strong> ${weatherCodeToDescription(weather_code[index])}</p>
                    <p><strong>Макс. температура:</strong> ${temperature_2m_max[index]}°C</p>
                    <p><strong>Мин. температура:</strong> ${temperature_2m_min[index]}°C</p>
                    <p><strong>Макс. ощущаемая температура:</strong> ${apparent_temperature_max[index]}°C</p>
                    <p><strong>Мин. ощущаемая температура:</strong> ${apparent_temperature_min[index]}°C</p>
                    <p><strong>Вероятность осадков:</strong> ${precipitation_probability_max[index]}%</p>
                    <p><strong>Макс. скорость ветра:</strong> ${wind_speed_10m_max[index]} км/ч</p>
                    <p><strong>Средняя влажность:</strong> ${calculateDailyAverageHumidity(hourlyHumidity, hourlyTimes, date)}%</p>
                </div>
            `;

            weatherDataContainer.insertAdjacentHTML('beforeend', weatherHtml);
        });

        // Показать данные для первого дня по умолчанию
        showWeather(0);
    } catch (error) {
        console.error(error);
        document.body.innerHTML = `<p>Произошла ошибка при обработке запроса: ${error.message}</p>`;
    }
});
