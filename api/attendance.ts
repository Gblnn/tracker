import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.body;

  console.log("Punch:", raw);

  res.status(200).send("OK");
}