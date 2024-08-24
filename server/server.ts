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
  </style>
  <!-- Подключаем Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- Подключаем адаптер date-fns для Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
  <!-- Подключаем плагин для масштабирования -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@1.0.1/dist/chartjs-plugin-zoom.min.js"></script>
</head>
<body>
  <div class="container">
    <button id="exportBtn">Export Data</button>
    <div id="spinner" class="spinner hidden"></div>
    <canvas id="chart"></canvas>
  </div>
  <script>
    const exportBtn = document.getElementById("exportBtn");
    const canvas = document.getElementById('chart');
    const spinner = document.getElementById('spinner');

    exportBtn.addEventListener('click', async () => {
      spinner.classList.remove('hidden'); // Показать спиннер

      try {
        const response = await fetch("/data");
        if (response.ok) {
          const jsonData = await response.json();
          console.log("Exported KV Data:", jsonData);
          createChart(jsonData);
        } else {
          alert("Failed to export data");
        }
      } catch (error) {
        alert("An error occurred while fetching data");
      } finally {
        spinner.classList.add('hidden'); // Скрыть спиннер после завершения
      }
    });

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
      new Chart(ctx, {
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
