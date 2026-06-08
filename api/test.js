export default function handler(req, res) {
  console.log("FUNCTION HIT");

  res.status(200).send("OK");
}