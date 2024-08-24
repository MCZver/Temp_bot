import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/data") {
    try {
      const kv = await Deno.openKv();
      const body = await req.json();
      const timestamp = Date.now();
      const street_temp = body.street_temp;
      const home_temp = body.home_temp;
      const KVdata = {
        timestamp: timestamp,
        street_temp: street_temp,
        home_temp: home_temp,
      };

      if (typeof street_temp !== 'number' || typeof home_temp !== 'number') {
        return new Response("Invalid data format", { status: 400 });
      }

      await kv.set(["TempData", timestamp], KVdata);
      return new Response(JSON.stringify(KVdata), { status: 200 });

    } catch (err) {
      return new Response("Invalid JSON format", { status: 400 });
    }

  } else if (req.method === "GET" && url.pathname === "/data") {
    const kvData = await exportKvToJSON();
    return new Response(JSON.stringify(kvData), { status: 200 });

  } else if (req.method === "GET" && url.pathname === "/") {
    return new Response(
      `
      <!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    .container { position: relative; height: 100vh; width: 100vw; }
    canvas { width: 100%; height: 100%; }
    .spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 8px solid #f3f3f3;
      border-top: 8px solid #3498db;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .hidden { display: none; }
    .buttons {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
    }
    .date-picker-container {
      display: none;
      margin-top: 10px;
    }
    #calendar {
      display: inline-block;
      margin-left: 10px;
    }
  </style>
  <!-- Подключаем Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- Подключаем адаптер date-fns для Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
  <!-- Подключаем плагин для масштабирования -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@1.0.1/dist/chartjs-plugin-zoom.min.js"></script>
  <!-- Подключаем flatpickr для календаря -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
</head>
<body>
  <div class="container">
    <div class="buttons">
      <button id="exportBtn">Export Data</button>
      <button id="hourBtn" class="hidden">Last Hour</button>
      <button id="threeHoursBtn" class="hidden">Last 3 Hours</button>
      <button id="dayBtn" class="hidden">Select Day</button>
      <div id="date-picker-container" class="date-picker-container">
        <input id="calendar" type="text" placeholder="Select date" />
      </div>
    </div>
    <div id="spinner" class="spinner hidden"></div>
    <canvas id="chart"></canvas>
  </div>
  <script>
    const exportBtn = document.getElementById("exportBtn");
    const hourBtn = document.getElementById("hourBtn");
    const threeHoursBtn = document.getElementById("threeHoursBtn");
    const dayBtn = document.getElementById("dayBtn");
    const calendar = document.getElementById("calendar");
    const spinner = document.getElementById('spinner');
    const canvas = document.getElementById('chart');
    let chart = null;

    // Инициализация календаря
    let availableDates = [];
    flatpickr(calendar, {
      enable: availableDates,
      onChange: () => plotData('day', calendar.value),
    });

    exportBtn.addEventListener('click', async () => {
      spinner.classList.remove('hidden'); // Показать спиннер

      try {
        const response = await fetch("/data");
        if (response.ok) {
          const jsonData = await response.json();
          console.log("Exported KV Data:", jsonData);
          showPeriodButtons(jsonData);
        } else {
          alert("Failed to export data");
        }
      } catch (error) {
        alert("An error occurred while fetching data");
      } finally {
        spinner.classList.add('hidden'); // Скрыть спиннер после завершения
      }
    });

    function showPeriodButtons(data) {
      hourBtn.classList.remove('hidden');
      threeHoursBtn.classList.remove('hidden');
      dayBtn.classList.remove('hidden');
      updateAvailableDates(data);
    }

    function updateAvailableDates(data) {
      availableDates = Object.values(data).map(entry => {
        const date = new Date(entry.timestamp);
        return date.toISOString().split('T')[0]; // Формат yyyy-mm-dd
      });
      flatpickr(calendar, { enable: availableDates });
    }

    hourBtn.addEventListener('click', () => plotData('hour'));
    threeHoursBtn.addEventListener('click', () => plotData('threeHours'));
    dayBtn.addEventListener('click', () => {
      calendar.classList.remove('hidden');
    });

    function plotData(period, date) {
      if (chart) {
        chart.destroy(); // Удаляем предыдущий график, если он существует
      }

      spinner.classList.remove('hidden'); // Показать спиннер

      fetch("/data")
        .then(response => response.json())
        .then(jsonData => {
          const filteredData = filterData(jsonData, period, date);
          createChart(filteredData);
        })
        .catch(error => {
          alert("An error occurred while fetching data");
        })
        .finally(() => {
          spinner.classList.add('hidden'); // Скрыть спиннер после завершения
        });
    }

    function filterData(data, period, date) {
      const now = new Date();
      const filteredData = {};
      Object.keys(data).forEach(key => {
        const entry = data[key];
        const entryDate = new Date(entry.timestamp);

        let include = false;
        if (period === 'hour') {
          include = (now - entryDate) < 3600000; // Last hour
        } else if (period === 'threeHours') {
          include = (now - entryDate) < 10800000; // Last 3 hours
        } else if (period === 'day' && date) {
          const selectedDate = new Date(date);
          include = entryDate.toDateString() === selectedDate.toDateString();
        }

        if (include) {
          filteredData[key] = entry;
        }
      });
      return filteredData;
    }

    function createChart(data) {
      const timestamps = [];
      const streetTemps = [];
      const homeTemps = [];

      Object.keys(data).forEach(key => {
        const entry = data[key];
        timestamps.push(new Date(entry.timestamp));
        streetTemps.push(entry.street_temp);
        homeTemps.push(entry.home_temp);
      });

      const ctx = canvas.getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: timestamps,
          datasets: [
            {
              label: 'Street Temperature',
              borderColor: 'rgb(255, 99, 132)',
              data: streetTemps,
              fill: false,
            },
            {
              label: 'Home Temperature',
              borderColor: 'rgb(54, 162, 235)',
              data: homeTemps,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // График будет занимать всю доступную область
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: 'xy', // Разрешить панорамирование по обеим осям
              },
              zoom: {
                wheel: {
                  enabled: true,
                  speed: 0.1, // Скорость масштабирования колесиком
                },
                pinch: {
                  enabled: true, // Масштабирование с помощью жестов на мобильных устройствах
                },
                mode: 'xy', // Масштабирование по обеим осям
              },
            },
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute',
                tooltipFormat: 'll HH:mm', // Используем правильный формат
              },
              title: {
                display: true,
                text: 'Time',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Temperature (°C)',
              },
            },
          },
        },
      });
    }
  </script>
</body>
</html>
      `,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  return new Response("Not Found", { status: 404 });
};

// Функция для экспорта всех данных KV
async function exportKvToJSON() {
  const kv = await Deno.openKv();
  const kvData: Record<string, unknown> = {};

  for await (const entry of kv.list({ prefix: ["TempData"] })) {
    const keyString = entry.key.join(":");
    kvData[keyString] = entry.value;
  }

  return kvData;
}

serve(handler);
