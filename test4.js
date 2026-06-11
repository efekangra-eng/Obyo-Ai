import fs from "fs";

async function test() {
  const resp = await fetch("http://localhost:3000/api/analyze-chart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image: "data:image/svg+xml;utf8," + encodeURIComponent("<svg width='100' height='100'></svg>")
    })
  });
  console.log(resp.status);
  console.log(await resp.text());
}

test();
