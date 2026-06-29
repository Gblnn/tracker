import converter from "number-to-words";

const parseQuantity = (unit: string | number | undefined | null): number => {
  if (unit === undefined || unit === null) return 0;
  if (typeof unit === 'number') return unit;
  const cleaned = String(unit).trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 1 : num;
};

interface InvoiceItem {
  description: string;
  unit: string;
  quantity: number;
  amount: number;
}

interface Props {
  date: string;
  clientName: string;
  clientAddress: string;
  refNo: string;
  invoiceNo: string;
  items: InvoiceItem[];
  amount: number;
  isTaxInvoice: boolean;
  vatinNo: string;
  contactNo: string;
  unitTitle: string;
  letterhead?: string;
  bankDetails?: string;
}

interface PageProps {
  items: InvoiceItem[];
  startIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  date: string;
  clientName: string;
  clientAddress: string;
  refNo: string;
  invoiceNo: string;
  amount: number;
  isTaxInvoice: boolean;
  vatinNo: string;
  contactNo: string;
  subtotal: number;
  vatAmount: number;
  netPayable: number;
  unitTitle: string;
  letterhead?: string;
  bankDetails?: string;
}

const InvoicePage = ({
  items,
  startIndex,
  isLastPage,
  ...props
}: PageProps) => {
  const prefix = props.letterhead === "Unique"
    ? "UQ"
    : props.letterhead === "Sohar Star United"
      ? "SSU"
      : props.letterhead === "none"
        ? ""
        : "ARC";

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        justifyContent: "space-between",
        background: props.letterhead === "Sohar Star United" ? "url(/letter-head.png)" : "white",
        backgroundSize: props.letterhead === "Sohar Star United" ? "contain" : "",
        backgroundPosition: props.letterhead === "Sohar Star United" ? "center" : "",
        color: "black",
        padding: "",
        fontSize: "0.9rem",
        width: "100%",
        maxWidth: "800px",
        height: "1130px",
        maxHeight: "1130px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        marginBottom: "4rem",
        margin: "0 auto",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        pageBreakAfter: "always",
      }}
    >
      <div style={{ border: "" }}>
        {/* Unique Solutions Header */}
        {props.letterhead === "Unique" && (
          <div
            style={{
              display: "flex",
              borderTop: "20px solid white",
              justifyContent: "start",
            }}
          >
            <img
              src="/unique_logo.png"
              style={{
                width: "10rem",
                border: "",
                margin: "2rem",
                marginTop: "1rem",
              }}
            />
          </div>
        )}

        {/* ARC Engineering Header */}
        {props.letterhead === "ARC" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              padding: "1rem",
              alignItems: "center",
            }}
          >
            <img
              src={"/letter-head-logo.jpg.png"}
              style={{ width: "5.5rem", height: "5rem" }}
            />
            <img src="/letter-head-header.jpg" />
          </div>
        )}

        {/* Crimson divider for ARC Engineering */}
        {props.letterhead === "ARC" && (
          <hr
            style={{
              color: "crimson",
              border: "4px solid",
            }}
          />
        )}

        {/* Spacer for Sohar Star United or None letterhead */}
        {(props.letterhead === "Sohar Star United" || props.letterhead === "none") && (
          <div style={{ height: "135px" }} />
        )}

        <div
          style={{
            paddingTop: "2rem",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <p style={{ color: "black", fontSize: "0.8rem" }}>
            <b style={{}}>DATE : {props.date}</b>
          </p>
        </div>
        <div
          style={{
            padding: "",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexFlow: "column",
          }}
        >
          <p style={{ color: "black", fontSize: "1rem" }}>
            <b style={{}}>
              {props.isTaxInvoice ? "TAX INVOICE" : "INVOICE"}
            </b>
          </p>
          {props.isTaxInvoice && (props.letterhead === "ARC" || props.letterhead === "Unique") && (
            <p>
              {props.letterhead === "ARC"
                ? "VATINOM110026180X"
                : "VATINOM110021451X"}{" "}
            </p>
          )}
        </div>

        <div
          style={{
            padding: "1.5rem",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            display: "flex",
            alignItems: "",
            justifyContent: "space-between",
            flexFlow: "",
          }}
        >

          {
            props.clientName &&
            <div
              style={{ display: "flex", flexFlow: "column", fontSize: "0.9rem" }}
            >
              <p>TO</p>
              <p>
                <b>{props.clientName}</b>
              </p>
              <div
                style={{ border: "", width: "20ch", fontWeight: "bold" }}
                dangerouslySetInnerHTML={{ __html: props.clientAddress }}
              />
              <p>
                <b>SULTANATE OF OMAN</b>
              </p>
              {props.vatinNo && props.isTaxInvoice && (
                <p>
                  <b>VATIN : {props.vatinNo}</b>
                </p>
              )}
            </div>
          }


          <div style={{ fontSize: "0.9rem", marginRight: "2rem" }}>
            <p>
              <b>{prefix}{prefix ? "#" : ""}{props.refNo}</b>
            </p>
            <p>Invoice No - {prefix}{prefix ? "/" : ""}{props.invoiceNo}</p>
          </div>
        </div>

        <div style={{ paddingLeft: "2rem", paddingRight: "2rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid black",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0.5rem",
                    fontWeight: "normal",
                    width: "8%",
                  }}
                >
                  S No.
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0.5rem",
                    fontWeight: "normal",
                    width: "60%",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0.5rem",
                    fontWeight: "normal",
                    width: "10%",
                  }}
                >
                  {(props.unitTitle || "Qty").toUpperCase()}
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0.5rem",
                    fontWeight: "normal",
                    width: "10%",
                  }}
                >
                  Rate
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0.5rem",
                    fontWeight: "normal",
                    width: "15%",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={startIndex + index}>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                    {startIndex + index + 1}
                  </td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                    {item.description}
                  </td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                    {item.unit}
                  </td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                    {item.amount.toFixed(3)}
                  </td>
                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                    {(parseQuantity(item.unit) * item.amount).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
            {isLastPage && (
              <tfoot>
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      border: "1px solid black",
                      padding: "0.5rem",
                      textAlign: "left",
                    }}
                  >
                    TOTAL
                  </td>

                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                    {props.subtotal.toFixed(3)}
                  </td>
                </tr>
                {props.isTaxInvoice && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        border: "1px solid black",
                        padding: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      {"VAT(5%)"}
                    </td>

                    <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                      {props.vatAmount.toFixed(3)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td
                    colSpan={4}
                    style={{ border: "1px solid black", padding: "0.5rem" }}
                  >
                    NET PAYABLE
                  </td>

                  <td style={{ border: "1px solid black", padding: "0.5rem" }}>
                    {props.netPayable.toFixed(3)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {isLastPage && (
          <>
            <div
              style={{
                display: "flex",
                paddingTop: "1rem",
                paddingLeft: "2.5rem",
                paddingRight: "2.5rem",
                justifyContent: "space-between",
              }}
            >
              <p style={{ textTransform: "capitalize" }}>
                <b>
                  Riyal Omani{" "}
                  {(() => {
                    const wholePart = Math.floor(props.netPayable);
                    const decimalPart = Math.round(
                      (props.netPayable - wholePart) * 1000
                    );

                    let result = converter.toWords(String(wholePart));

                    if (decimalPart > 0) {
                      result += ` and ${converter.toWords(
                        String(decimalPart)
                      )} baiza`;
                    }

                    return result;
                  })()}{" "}
                  Only
                </b>
              </p>
              <p>
                <b style={{ fontSize: "0.9rem" }}>
                  Contact : {props.contactNo || "92849282"}
                </b>
              </p>
            </div>
            {props.bankDetails && (
              <div
                style={{
                  paddingLeft: "2.5rem",
                  paddingRight: "2.5rem",
                  marginTop: "1.5rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    lineHeight: "1.3",
                    // border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "4px",
                    // padding: "0.5rem 1rem",
                    // background: "rgba(0,0,0,0.01)",
                  }}
                  className="bank-details-display"
                >
                  <div style={{ fontWeight: "600", marginBottom: "0.15rem", color: "#374151" }}>Bank Details</div>
                  <div dangerouslySetInnerHTML={{ __html: props.bankDetails }} />
                </div>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.9rem",
                padding: "3rem",
              }}
            >
              <p>Prepared By</p>
              <div style={{ position: "relative", display: "flex", flexFlow: "column", alignItems: "center" }}>
                {(() => {
                  const stampSrc = props.letterhead === "Sohar Star United"
                    ? "/ssu_stamp.png"
                    : (!props.letterhead || props.letterhead === "ARC")
                      ? "/arc_stamp.png"
                      : null;
                  return stampSrc ? (
                    <img
                      src={stampSrc}
                      style={{
                        position: "absolute",
                        bottom: "-20px",
                        left: "50%",
                        transform: "translate(-50%, -20%)",
                        width: "6.5rem",
                        maxWidth: "none",
                        height: "auto",
                        opacity: 0.85,
                        pointerEvents: "none",
                      }}
                      alt="Stamp"
                    />
                  ) : null;
                })()}
                <p style={{ position: "relative", zIndex: 1 }}>Checked By</p>
              </div>
              <p>Approved By</p>
            </div>
          </>
        )}
      </div>

      <div
        style={{
          border: "",
          height: "",
          width: "100%",
          display: "flex",
          flexFlow: "column",
          padding: "",
          justifyContent: "flex-end",
        }}
      >
        {/* ARC Footer */}
        {props.letterhead === "ARC" && (
          <div
            style={{
              borderTop: "5px solid crimson",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "1rem",
              paddingTop: "1rem",
              paddingBottom: "1rem",
              wordSpacing: "0.25rem",
              textAlign: "center",
              color: "darkred",
              fontWeight: "500",
            }}
          >
            <p>
              CR No. 1388060 | P.O BOX 427 | PC 311 | Sohar | Sultanate of Oman
              <br />
              GSM : +968 92822305, +968 92849282 | Email : marketing@arcen.net
            </p>
          </div>
        )}

        {/* Unique Footer */}
        {props.letterhead === "Unique" && (
          <div
            style={{
              display: "flex",
              fontSize: "0.9rem",
              fontWeight: "500",
              flexFlow: "column",
            }}
          >
            <p style={{ paddingLeft: "1rem", paddingBottom: "0.25rem" }}>
              CR No : 1068664 P.O Box 432, P.C : 311, Sawary Center, Sohar,
              Sultanate of Oman
            </p>
            <div
              style={{
                background: "#122029",
                color: "white",
                padding: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                paddingLeft: "1.5rem",
                paddingRight: "1.5rem",
              }}
            >
              <p>info@uniquesolutions.services</p>
              <p>VATIN:OM110021451X</p>
            </div>
          </div>
        )}

        {/* Spacer for Sohar Star United or None letterhead footer */}
        {(props.letterhead === "Sohar Star United" || props.letterhead === "none") && (
          <div style={{ height: "80px" }} />
        )}
      </div>
    </div>
  );
};

export default function Template1(props: Props) {
  // Calculate totals
  const subtotal = props.items.reduce(
    (sum, item) => sum + parseQuantity(item.unit) * item.amount,
    0
  );
  const vatAmount = props.isTaxInvoice ? subtotal * 0.05 : 0;
  const netPayable = subtotal + vatAmount;

  // Calculate items per page
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(props.items.length / ITEMS_PER_PAGE);

  // Create pages array
  const pages = Array.from({ length: totalPages }, (_, pageIndex) => {
    const startIndex = pageIndex * ITEMS_PER_PAGE;
    const pageItems = props.items.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    return (
      <InvoicePage
        key={pageIndex}
        {...props}
        items={pageItems}
        startIndex={startIndex}
        isFirstPage={pageIndex === 0}
        isLastPage={pageIndex === totalPages - 1}
        subtotal={subtotal}
        vatAmount={vatAmount}
        netPayable={netPayable}
      />
    );
  });

  return <div>{pages}</div>;
}
