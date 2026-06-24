import converter from "number-to-words";

const parseQuantity = (unit: string | number | undefined | null): number => {
  if (unit === undefined || unit === null) return 0;
  if (typeof unit === 'number') return unit;
  const cleaned = String(unit).trim();
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 1 : num;
};

interface QuotationItem {
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
  quotationNo: string;
  items: QuotationItem[];
  validityPeriod: string;
  terms: string[];
  contactNo: string;
  unitTitle: string;
  letterhead?: string;
  subject?: string;
}

interface PageProps extends Props {
  items: QuotationItem[];
  startIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  subtotal: number;
}

const QuotationPage = ({
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
          <hr style={{ color: "crimson", border: "4px solid" }} />
        )}

        {/* Spacer for Sohar Star United or None letterhead */}
        {(props.letterhead === "Sohar Star United" || props.letterhead === "none") && (
          <div style={{ height: "150px" }} />
        )}

        <div
          style={{
            paddingTop: "1rem",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <p style={{ color: "black", fontSize: "0.8rem" }}>
            <b>DATE : {props.date}</b>
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
            <b>QUOTATION</b>
          </p>
        </div>

        <div
          style={{
            padding: "1.5rem",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            display: "flex",
            alignItems: "",
            justifyContent: "space-between",
          }}
        >
          {
            props.clientName &&
            <div
              style={{ display: "flex", flexFlow: "column", fontSize: "0.8rem" }}
            >
              <p>TO</p>
              {props.clientName && (
                <p>
                  <b>M/s {props.clientName}</b>
                </p>
              )}

              <p style={{ border: "", width: "20ch" }}>
                <b>{props.clientAddress}</b>
              </p>
              <p>
                <b>SULTANATE OF OMAN</b>
              </p>
            </div>
          }


          <div style={{ fontSize: "0.8rem", marginRight: "2rem" }}>
            <p>
              <b>{prefix}{prefix ? "#" : ""}{props.refNo}</b>
            </p>
            <p>
              <b>Quotation No - </b> {prefix}{prefix ? "/" : ""}{props.quotationNo}
            </p>
            <p>
              <b>Valid Until: </b> {props.validityPeriod}
            </p>
          </div>
        </div>

        <div style={{ paddingLeft: "2rem", paddingRight: "2rem" }}>
          <div style={{ paddingBottom: "0.75rem" }}>
            <p style={{ paddingBottom: "0.25rem" }}>
              <b>Subject : </b> {props.subject}
            </p>
            {/* <p style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
            We hereby submit the quotation for the following items as requested.
          </p> */}
          </div>

          <table
            style={{
              width: "100%",
              border: "1px solid black",
            }}
          >
            <thead style={{ width: "100%" }}>
              <tr>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0.45rem 0.5rem",
                    fontWeight: "500",
                    width: "8%",
                    paddingBottom: "1rem",
                  }}
                >
                  S No.
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0 0.5rem",
                    paddingBottom: "1rem",
                    width: "60%",
                    fontWeight: "500",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0 0.5rem",
                    fontWeight: "500",
                    width: "22%",
                    paddingBottom: "1rem",
                  }}
                >
                  {(props.unitTitle || "Qty").toUpperCase()}
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0 0.5rem",
                    fontWeight: "500",
                    width: "12%",
                    paddingBottom: "1rem",
                  }}
                >
                  Rate
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "0 0.5rem",
                    fontWeight: "500",
                    width: "15%",
                    paddingBottom: "1rem",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={startIndex + index}>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "0.5rem",
                      paddingBottom: "0.5rem",
                      paddingLeft: "0.5rem",
                    }}
                  >
                    {startIndex + index + 1}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      paddingBottom: "0.5rem",
                      paddingLeft: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.description}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      paddingBottom: "0.5rem",
                      paddingLeft: "0.5rem",
                    }}
                  >
                    {item.unit}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      paddingBottom: "0.5rem",
                      paddingLeft: "0.5rem",
                    }}
                  >
                    {item.amount.toFixed(3)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      paddingBottom: "0.5rem",
                      paddingLeft: "0.5rem",
                    }}
                  >
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
                      padding: "0.5rem 0.5rem",
                      textAlign: "left",

                    }}
                  >
                    TOTAL
                  </td>

                  <td
                    style={{
                      border: "1px solid black",
                      padding: "0.5rem 0.5rem",

                    }}
                  >
                    {props.subtotal.toFixed(3)}
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
              }}
            >
              <p style={{ textTransform: "capitalize", fontSize: "0.8rem" }}>
                <b>
                  Riyal Omani{" "}
                  {(() => {
                    const wholePart = Math.floor(props.subtotal);
                    const decimalPart = Math.round(
                      (props.subtotal - wholePart) * 1000
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
            </div>

            <div style={{ padding: "2rem", fontSize: "0.9rem" }}>
              <p style={{ fontWeight: "600", marginBottom: "1rem" }}>
                Terms and Conditions:
              </p>
              <ol style={{ listStyle: "none", paddingLeft: "1.5rem", fontSize: "0.85rem" }}>
                {props.terms.map((term, index) => (
                  <li
                    key={index}
                    style={{ marginBottom: "0.5rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      <span style={{ marginRight: "0.75rem", flexShrink: 0 }}>
                        •
                      </span>
                      <div
                        style={{ wordBreak: "break-word" }}
                        dangerouslySetInnerHTML={{ __html: term }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* <div
            style={{
              display: "flex",
              paddingTop: "0.5rem",
              paddingLeft: "2.5rem",
              paddingRight: "2.5rem",
              justifyContent: "flex-end",
            }}
          >
            <p>
              <b style={{ fontSize: "0.9rem" }}>
                Contact : {props.contactNo || "92849282"}
              </b>
            </p>
          </div> */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.9rem",
                paddingLeft: "3rem",
                paddingRight: "3rem",
                paddingTop: "0.5rem",
              }}
            >
              <p>Prepared By</p>
              <p>Checked By</p>
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
      <QuotationPage
        key={pageIndex}
        {...props}
        items={pageItems}
        startIndex={startIndex}
        isFirstPage={pageIndex === 0}
        isLastPage={pageIndex === totalPages - 1}
        subtotal={subtotal}
      />
    );
  });

  return <div>{pages}</div>;
}
