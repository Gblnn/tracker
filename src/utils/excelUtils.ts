import { db } from "@/firebase";
import * as XLSX from "@e965/xlsx";
import { message } from "antd";
import { doc, writeBatch } from "firebase/firestore";
import moment from "moment";

// Function to check if a document is expiring soon
const isExpiring = (date: string, monthsThreshold: number = 2) => {
  if (!date) return false;
  const expiryDate = moment(date, "DD/MM/YYYY");
  const today = moment();
  const monthsDiff = expiryDate.diff(today, "months");
  return monthsDiff <= monthsThreshold;
};

// Function to export expiring records to Excel
export const exportExpiringRecords = (records: any[]) => {
  try {
    // Filter records with expiring documents
    const expiringRecords = records.filter((record) => {
      return (
        isExpiring(record.civil_expiry, 2) ||
        isExpiring(record.license_expiry, 2) ||
        isExpiring(record.medical_due_on, 2) ||
        isExpiring(record.passportExpiry, 6) || // Passport expires in 6 months
        isExpiring(record.vt_hse_induction, 2) ||
        isExpiring(record.vt_car_1, 2) ||
        isExpiring(record.vt_car_2, 2) ||
        isExpiring(record.vt_car_3, 2) ||
        isExpiring(record.vt_car_4, 2) ||
        isExpiring(record.vt_car_5, 2) ||
        isExpiring(record.vt_car_6, 2) ||
        isExpiring(record.vt_car_7, 2) ||
        isExpiring(record.vt_car_8, 2) ||
        isExpiring(record.vt_car_9, 2) ||
        isExpiring(record.vt_car_10, 2)
      );
    });

    // Prepare data for export
    const exportData = expiringRecords.map((record) => ({
      id: record.id,
      name: record.name,
      civil_id: record.civil_id,
      civil_expiry: record.civil_expiry || "",
      license_expiry: record.license_expiry || "",
      medical_due_on: record.medical_due_on || "",
      passportExpiry: record.passportExpiry || "",
      vt_hse_induction: record.vt_hse_induction || "",
      vt_car_1: record.vt_car_1 || "",
      vt_car_2: record.vt_car_2 || "",
      vt_car_3: record.vt_car_3 || "",
      vt_car_4: record.vt_car_4 || "",
      vt_car_5: record.vt_car_5 || "",
      vt_car_6: record.vt_car_6 || "",
      vt_car_7: record.vt_car_7 || "",
      vt_car_8: record.vt_car_8 || "",
      vt_car_9: record.vt_car_9 || "",
      vt_car_10: record.vt_car_10 || "",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set date format for date columns
    const dateColumns = [
      "civil_expiry",
      "license_expiry",
      "medical_due_on",
      "passportExpiry",
      "vt_hse_induction",
      "vt_car_1",
      "vt_car_2",
      "vt_car_3",
      "vt_car_4",
      "vt_car_5",
      "vt_car_6",
      "vt_car_7",
      "vt_car_8",
      "vt_car_9",
      "vt_car_10",
    ];
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

    // Convert string dates to Excel dates and set format
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (const dateCol of dateColumns) {
        const cellRef = XLSX.utils.encode_cell({
          r: R,
          c: Object.keys(exportData[0]).indexOf(dateCol),
        });
        const cell = ws[cellRef];
        if (cell && cell.v) {
          const parsedDate = moment(cell.v, "DD/MM/YYYY");
          if (parsedDate.isValid()) {
            // Convert to Excel date without adding a day
            cell.t = "d";
            cell.v = parsedDate.toDate();
            cell.z = "dd/mm/yyyy";
          }
        }
      }
    }

    // Add column headers and widths
    ws["!cols"] = [
      { width: 30 }, // id
      { width: 20 }, // name
      { width: 15 }, // civil_id
      { width: 15 }, // civil_expiry
      { width: 15 }, // license_expiry
      { width: 15 }, // medical_due_on
      { width: 15 }, // passportExpiry
      { width: 15 }, // vt_hse_induction
      { width: 15 }, // vt_car_1
      { width: 15 }, // vt_car_2
      { width: 15 }, // vt_car_3
      { width: 15 }, // vt_car_4
      { width: 15 }, // vt_car_5
      { width: 15 }, // vt_car_6
      { width: 15 }, // vt_car_7
      { width: 15 }, // vt_car_8
      { width: 15 }, // vt_car_9
      { width: 15 }, // vt_car_10
    ];

    // Create workbook and save
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expiring Documents");
    XLSX.writeFile(wb, "expiring_documents.xlsx");
    message.success("Excel file exported successfully");
  } catch (error) {
    console.error("Export error:", error);
    message.error("Failed to export Excel file");
  }
};

// Function to validate date format
// const isValidDate = (dateStr: string) => {
//   if (!dateStr) return true; // Empty dates are allowed
//   return moment(dateStr, "DD/MM/YYYY", true).isValid();
// };

// Function to import and update records from Excel
export const importExpiringRecords = async (file: File): Promise<boolean> => {
  try {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, {
            type: "array",
            cellDates: true,
            dateNF: "DD/MM/YYYY",
          });

          // Get first sheet
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

          // Define date columns
          const dateColumns = [
            "dateofJoin",
            "civil_DOB",
            "civil_expiry",
            "license_issue",
            "license_expiry",
            "medical_completed_on",
            "medical_due_on",
            "passportIssue",
            "passportExpiry",
            "vt_hse_induction",
            "vt_car_1",
            "vt_car_2",
            "vt_car_3",
            "vt_car_4",
            "vt_car_5",
            "vt_car_6",
            "vt_car_7",
            "vt_car_8",
            "vt_car_9",
            "vt_car_10",
          ];

          // Get header row to find column indices
          const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
          const headers: { [key: string]: number } = {};
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: range.s.r, c: C });
            const headerCell = worksheet[cellRef];
            if (headerCell?.v) {
              headers[headerCell.v] = C;
            }
          }

          // Process date cells before converting to JSON
          for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (const dateCol of dateColumns) {
              if (headers[dateCol] !== undefined) {
                const cellRef = XLSX.utils.encode_cell({
                  r: R,
                  c: headers[dateCol],
                });
                const cell = worksheet[cellRef];
                if (cell?.v) {
                  let formattedDate = "";
                  if (cell.t === "d" && cell.v instanceof Date) {
                    formattedDate = moment(cell.v).format("DD/MM/YYYY");
                  } else if (typeof cell.v === "string") {
                    const parsedDate = moment(cell.v, [
                      "DD/MM/YYYY",
                      "M/D/YYYY",
                      "YYYY-MM-DD",
                      "MM-DD-YYYY",
                    ]);
                    if (parsedDate.isValid()) {
                      formattedDate = parsedDate.format("DD/MM/YYYY");
                    }
                  }
                  if (formattedDate) {
                    worksheet[cellRef] = {
                      t: "s",
                      v: formattedDate,
                      w: formattedDate,
                    };
                  }
                }
              }
            }
          }

          const records = XLSX.utils.sheet_to_json(worksheet);
          let successCount = 0;
          let errorCount = 0;
          const batchSize = 500; // Firestore batch limit is 500
          const batches = [];
          let currentBatch = writeBatch(db);
          let currentBatchSize = 0;

          for (const record of records) {
            const {
              id,
              name,
              type,
              state,
              remarks,
              employeeCode,
              companyName,
              email,
              contact,
              dateofJoin,
              nativeAddress,
              nativePhone,
              initialSalary,
              initialAllowance,
              civil_number,
              civil_DOB,
              civil_expiry,
              license_number,
              license_issue,
              license_expiry,
              medical_completed_on,
              medical_due_on,
              passportID,
              passportIssue,
              passportExpiry,
              vt_hse_induction,
              vt_car_1,
              vt_car_2,
              vt_car_3,
              vt_car_4,
              vt_car_5,
              vt_car_6,
              vt_car_7,
              vt_car_8,
              vt_car_9,
              vt_car_10,
            } = record as any;

            try {
              const docRef = doc(db, "records", id);
              currentBatch.update(docRef, {
                name: name || "",
                type: type || "",
                state: state || "",
                remarks: remarks || "",
                employeeCode: employeeCode || "",
                companyName: companyName || "",
                email: email || "",
                contact: contact || "",
                dateofJoin: dateofJoin || "",
                nativeAddress: nativeAddress || "",
                nativePhone: nativePhone || "",
                initialSalary: initialSalary || 0,
                initialAllowance: initialAllowance || 0,
                civil_number: civil_number || "",
                civil_DOB: civil_DOB || "",
                civil_expiry: civil_expiry || "",
                license_number: license_number || "",
                license_issue: license_issue || "",
                license_expiry: license_expiry || "",
                medical_completed_on: medical_completed_on || "",
                medical_due_on: medical_due_on || "",
                passportID: passportID || "",
                passportIssue: passportIssue || "",
                passportExpiry: passportExpiry || "",
                vt_hse_induction: vt_hse_induction || "",
                vt_car_1: vt_car_1 || "",
                vt_car_2: vt_car_2 || "",
                vt_car_3: vt_car_3 || "",
                vt_car_4: vt_car_4 || "",
                vt_car_5: vt_car_5 || "",
                vt_car_6: vt_car_6 || "",
                vt_car_7: vt_car_7 || "",
                vt_car_8: vt_car_8 || "",
                vt_car_9: vt_car_9 || "",
                vt_car_10: vt_car_10 || "",
                last_updated: moment().format("DD/MM/YYYY HH:mm:ss"),
              });

              currentBatchSize++;
              successCount++;

              // If batch is full, add it to batches array and create new batch
              if (currentBatchSize === batchSize) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                currentBatchSize = 0;
              }
            } catch (error) {
              console.error("Error processing record:", id, error);
              errorCount++;
            }
          }

          // Add the last batch if it has any operations
          if (currentBatchSize > 0) {
            batches.push(currentBatch);
          }

          // Execute all batches in parallel
          try {
            await Promise.all(batches.map((batch) => batch.commit()));
            message.success(`Updated ${successCount} records successfully`);
            window.location.reload();
            if (errorCount > 0) {
              message.warning(`Failed to update ${errorCount} records`);
            }
            resolve(true);
          } catch (error) {
            console.error("Error committing batches:", error);
            message.error("Failed to update some records");
            reject(error);
          }
        } catch (error) {
          console.error("Import error:", error);
          message.error("Failed to import Excel file");
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("File reading error:", error);
        message.error("Failed to read Excel file");
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error("Import error:", error);
    message.error("Failed to import Excel file");
    return false;
  }
};
