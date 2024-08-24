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
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .container {
      width: 100%;
      max-width: 1200px;
      padding: 20px;
      box-sizing: border-box;
    }
    .button-group {
      margin-bottom: 20px;
    }
    .button-group button {
      margin-right: 10px;
    }
    #chart-container {
      position: relative;
      width: 100%;
      height: 80vh;
    }
    #loading {
      display: none;
      font-size: 20px;
      color: #333;
    }
  </style>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
</head>
<body>
  <div class="container">
    <div class="button-group">
      <button id="exportDataBtn">Экспорт данных</button>
      <button id="last1HourBtn" disabled>Последний час</button>
      <button id="last3HoursBtn" disabled>Последние 3 часа</button>
      <button id="last12HoursBtn" disabled>Последние 12 часов</button>
      <button id="last24HoursBtn" disabled>Сутки</button>
      <button id="last3DaysBtn" disabled>Три дня</button>
      <button id="last7DaysBtn" disabled>Неделя</button>
      <input type="text" id="datepicker" placeholder="Выберите дату">
      <button id="selectDayBtn" disabled>Выбрать день</button>
    </div>
    <div id="loading">Загрузка данных...</div>
    <div id="chart-container">
      <canvas id="myChart"></canvas>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script>
    let chart = null;

    document.getElementById('exportDataBtn').addEventListener('click', async () => {
      document.getElementById('loading').style.display = 'block';
      const response = await fetch('/data');
      const data = await response.json();
      console.log('Полученные данные:', data);  // Вывод данных в консоль

      // Глобальная переменная для хранения данных
      window.chartData = Array.isArray(data) ? data : [];  // Убедиться, что данные - это массив

      document.getElementById('loading').style.display = 'none';
      updateButtonsState(true);  // Активировать кнопки
    });

    document.getElementById('last1HourBtn').addEventListener('click', () => updateChart(1));
    document.getElementById('last3HoursBtn').addEventListener('click', () => updateChart(3));
    document.getElementById('last12HoursBtn').addEventListener('click', () => updateChart(12));
    document.getElementById('last24HoursBtn').addEventListener('click', () => updateChart(24));
    document.getElementById('last3DaysBtn').addEventListener('click', () => updateChart(72));
    document.getElementById('last7DaysBtn').addEventListener('click', () => updateChart(168));

    flatpickr("#datepicker", {
      dateFormat: "Y-m-d",
      onChange: function(selectedDates) {
        if (selectedDates.length > 0) {
          updateChartForDate(selectedDates[0]);
        }
      }
    });

    function updateButtonsState(hasData) {
      const buttons = document.querySelectorAll('.button-group button');
      buttons.forEach(button => button.disabled = !hasData);
    }

    function updateChart(hours) {
      if (!Array.isArray(window.chartData)) return;
      const end = new Date();
      const start = new Date();
      start.setHours(start.getHours() - hours);

      const filteredData = window.chartData.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= start && itemDate <= end;
      });

      const labels = filteredData.map(item => new Date(item.timestamp).toLocaleString());
      const streetTemps = filteredData.map(item => item.street_temp);
      const homeTemps = filteredData.map(item => item.home_temp);

      if (chart) {
        chart.destroy();
      }

      const ctx = document.getElementById('myChart').getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Street Temp',
              data: streetTemps,
              borderColor: 'blue',
              fill: false
            },
            {
              label: 'Home Temp',
              data: homeTemps,
              borderColor: 'red',
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            zoom: {
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true
                },
                mode: 'xy'
              },
              pan: {
                enabled: true,
                mode: 'xy'
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'hour',
                tooltipFormat: 'll HH:mm'
              },
              title: {
                display: true,
                text: 'Time'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Temperature'
              }
            }
          }
        }
      });
    }

    function updateChartForDate(selectedDate) {
      if (!Array.isArray(window.chartData)) return;
      const start = new Date(selectedDate);
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 1);

      const filteredData = window.chartData.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= start && itemDate < end;
      });

      const labels = filteredData.map(item => new Date(item.timestamp).toLocaleString());
      const streetTemps = filteredData.map(item => item.street_temp);
      const homeTemps = filteredData.map(item => item.home_temp);

      if (chart) {
        chart.destroy();
      }

      const ctx = document.getElementById('myChart').getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Street Temp',
              data: streetTemps,
              borderColor: 'blue',
              fill: false
            },
            {
              label: 'Home Temp',
              data: homeTemps,
              borderColor: 'red',
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            zoom: {
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true
                },
                mode: 'xy'
              },
              pan: {
                enabled: true,
                mode: 'xy'
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'hour',
                tooltipFormat: 'll HH:mm'
              },
              title: {
                display: true,
                text: 'Time'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Temperature'
              }
            }
          }
        }
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
