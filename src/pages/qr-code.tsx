import Back from "@/components/back";
import { Download, Link2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";

function QRCodeGenerator() {
  const [url, setUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = useCallback(async () => {
    if (!url) return;

    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setQrCodeUrl(dataUrl);
      }
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  }, [url]);

  const downloadQRCode = useCallback(() => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrCodeUrl]);

  return (
    <div
      style={{
        height: "100svh",
        background:
          "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
      }}
    >
      <div style={{ padding: "1.5rem" }}>
        <Back title={"QR Generator"} icon={<QrCode color="dodgerblue" />} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className=""
      >
        <div className="max-w-md mx-auto" style={{ border: "" }}>
          <div
            // style={{ background: "rgba(100 100 100/ 10%)" }}
            className="rounded-lg p-6 space-y-6"
          >
            <div className="space-y-2">
              <label htmlFor="url" className="block text-sm font-medium">
                Enter URL or Text
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <button
              onClick={generateQRCode}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none transition-colors"
            >
              Generate QR Code
            </button>

            <motion.div
              style={{ border: "" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="flex flex-col items-center space-y-4"
            >
              <canvas ref={canvasRef} className="hidden" />
              {qrCodeUrl && (
                <>
                  <img
                    src={qrCodeUrl}
                    alt="Generated QR Code"
                    className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                  />
                  <button
                    onClick={downloadQRCode}
                    className="flex items-center space-x-2 bg-grey-700 text-white py-2 px-4 rounded-md  focus:outline-none   transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download PNG</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default QRCodeGenerator;
