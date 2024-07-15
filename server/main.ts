import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  if (req.method === "POST" && url.pathname === "/data") {
    const body = await req.text();
    console.log("Received request body:", body);
    return new Response(body, { status: 200 });
  }

  //return new Response("Not Found", { status: 404 });
};

serve(handler);
