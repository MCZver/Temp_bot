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
    body { font-family: Arial, sans-serif; }
    .container { max-width: 800px; margin: auto; padding: 20px; }
    canvas { background: #f5f5f5; border: 1px solid #ddd; }
  </style>
  <!-- Подключаем Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- Подключаем адаптер date-fns для Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
  <!-- Подключаем плагин для масштабирования -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom"></script>
</head>
<body>
  <div class="container">
    <h1>Temperature Data</h1>
    <button id="exportBtn">Export Data</button>
    <canvas id="chart" style="display:none;"></canvas>
  </div>
  <script>
    const exportBtn = document.getElementById("exportBtn");
    const canvas = document.getElementById('chart');

    exportBtn.addEventListener('click', async () => {
      const response = await fetch("/data");
      if (response.ok) {
        const jsonData = await response.json();
        console.log("Exported KV Data:", jsonData);
        createChart(jsonData);
      } else {
        alert("Failed to export data");
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

      canvas.style.display = "block"; // Показать canvas после загрузки данных

      const ctx = canvas.getContext('2d');
      const chart = new Chart(ctx, {
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
