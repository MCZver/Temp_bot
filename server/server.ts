import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { openKv } from "https://deno.land/x/kv/mod.ts";

const dataStore = new Map<number, { street_temp: number; home_temp: number }>();

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/data") {
    try {
      const kv = await openKv();
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

      // Сохранение данных в памяти
      dataStore.set(timestamp, { street_temp, home_temp });
      await kv.set(["TempData", timestamp], KVdata);

      // Вернуть данные
      return new Response(JSON.stringify({ timestamp, street_temp, home_temp }), { status: 200 });

    } catch (err) {
      return new Response("Invalid JSON format", { status: 400 });
    }

  } else if (req.method === "GET" && url.pathname === "/data") {
    const data = Array.from(dataStore.entries()).map(([timestamp, { street_temp, home_temp }]) => ({ timestamp, street_temp, home_temp }));
    return new Response(JSON.stringify(data), { status: 200 });

  } else if (req.method === "GET" && url.pathname === "/export") {
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
          .container { max-width: 600px; margin: auto; padding: 20px; }
          .data { white-space: pre-wrap; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="data" class="data"></div>
          <label for="options">Choose an option:</label>
          <select id="options" name="options">
            <option value="Option 1">Option 1</option>
            <option value="Option 2">Option 2</option>
            <option value="Option 3">Option 3</option>
          </select>
          <button id="exportBtn">Export Data</button>
        </div>
        <script>
          const dataDiv = document.getElementById("data");
          const options = document.getElementById("options");
          const exportBtn = document.getElementById("exportBtn");

          options.addEventListener('change', (event) => {
            console.log(event.target.value);
          });

          exportBtn.addEventListener('click', async () => {
            const response = await fetch("/export");
            if (response.ok) {
              const jsonData = await response.json();
              console.log("Exported KV Data:", jsonData);
            } else {
              alert("Failed to export data");
            }
          });

          async function loadData() {
            const response = await fetch("/data");
            if (response.ok) {
              const data = await response.json();
              const formattedData = data.map(entry => \`Time: \${new Date(entry.timestamp).toLocaleString()}, Street Temp: \${entry.street_temp}, Home Temp: \${entry.home_temp}\`).join("\\n");
              dataDiv.innerText = formattedData;
            } else {
              alert("Failed to load data");
            }
          }

          loadData();
          setInterval(loadData, 5000);  // Запрос каждые 5 секунд
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
  const kv = await openKv();
  const kvData: Record<string, unknown> = {};

  for await (const entry of kv.list({ prefix: [] })) {
    const keyString = entry.key.join(":");
    kvData[keyString] = entry.value;
  }

  kv.close();
  return kvData;
}

serve(handler);
