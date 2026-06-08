export default function handler(req, res) {
  const raw = req.body;

  console.log("===== NEW PUNCH =====");
  console.log(raw);
  console.log("=====================");

  res.status(200).send("OK");
}
