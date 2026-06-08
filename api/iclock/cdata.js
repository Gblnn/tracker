export default function handler(req, res) {
  const sn = req.query.SN;
  const table = req.query.table;
  const stamp = req.query.Stamp;

  let raw = "";

  req.on("data", chunk => {
    raw += chunk.toString();
  });

  req.on("end", () => {
    console.log("===== ICLOCK PUSH =====");
    console.log("SN:", sn);
    console.log("TABLE:", table);
    console.log("STAMP:", stamp);
    console.log("DATA:", raw);
    console.log("=======================");

    res.status(200).send("OK");
  });
}