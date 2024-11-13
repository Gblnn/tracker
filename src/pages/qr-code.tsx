import Back from "@/components/back";
import { Copy, Download, ExternalLink, QrCodeIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";

function QRCode() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(() => {
    const svg = document.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = "qrcode.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }, []);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      className="min-h-screen  p-6"
      style={{
        background:
          "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
      }}
    >
      <Back icon={<QrCodeIcon color="dodgerblue" />} title={"QR Generator"} />
      <div className="max-w-2xl mx-auto">
        <div className=" rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label htmlFor="text" className="block text-sm font-medium mb-2">
              Enter text or URL
            </label>
            <input
              type="text"
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Enter text or URL here..."
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className=" p-6 rounded-xl w-full md:w-auto flex items-center justify-center">
              {text ? (
                <QRCodeSVG
                  value={text}
                  size={200}
                  level="H"
                  includeMargin
                  className="w-full max-w-[200px]"
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400 border-2 border-dashed rounded-lg">
                  <span>QR Code Preview</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {text && (
                <>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>

                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    {copied ? "Copied!" : "Copy Text"}
                  </button>

                  {text.startsWith("http") && (
                    <a
                      href={text}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open URL
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* <div className="text-center text-sm text-gray-600">
          <p>Simply enter your text or URL above to generate a QR code.</p>
          <p>You can download the QR code as a PNG file or copy the text.</p>
        </div> */}
      </div>
    </motion.div>
  );
}

export default QRCode;
