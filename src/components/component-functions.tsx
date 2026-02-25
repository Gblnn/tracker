import * as XLSX from "@e965/xlsx";
import { saveAs } from "file-saver";
import moment from "moment";

export const getBlank = async (category: string | undefined) => {
  try {
    const myHeader = [
      "id",
    "name",
    "type",
    "state",
    "remarks",
    "employeeCode",
    "companyName",
    "email",
    "contact",
    "cug",
    "dateofJoin",
    "nativeAddress",
    "nativePhone",
    "designation",
    "role",
    "initialSalary",
    "initialAllowance",
    "salaryBasic",
    "allowance",
    "site",
    "project",
    "civil_number",
    "civil_DOB",
    "civil_expiry",
    "license_number",
    "license_issue",
    "license_expiry",
    "medical_completed_on",
    "medical_due_on",
    "passportID",
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

    const Header = [
      "id",
    "name",
    "type",
    "state",
    "remarks",
    "employeeCode",
    "companyName",
    "email",
    "contact",
    "cug",
    "dateofJoin",
    "nationality",
    "nativeAddress",
    "nativePhone",
    "designation",
    "role",
    "initialSalary",
    "initialAllowance",
    "salaryBasic",
    "allowance",
    "site",
    "project",
    "civil_number",
    "civil_DOB",
    "civil_expiry",
    "license_number",
    "license_issue",
    "license_expiry",
    "medical_completed_on",
    "medical_due_on",
    "passportID",
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

    const worksheet = XLSX.utils.json_to_sheet([{}], {
      header: category == "personal" ? Header : myHeader,
    });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Buffer to store the generated Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "Template.xlsx");
  } catch (error) {
    console.log(error);
  }
};

export const exportRaw = (records: any) => {
  const myHeader = [
    "name",
    "type",
    "state",
    "remarks",
    "employeeCode",
    "companyName",
    "email",
    "contact",
    "cug",
    "dateofJoin",
    "nationality",
    "nativeAddress",
    "nativePhone",
    "initialSalary",
    "initialAllowance",
    "civil_number",
    "civil_DOB",
    "civil_expiry",
    "license_number",
    "license_issue",
    "license_expiry",
    "medical_completed_on",
    "medical_due_on",
    "passportID",
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
  records.forEach((e: any) => {
    e.civil_expiry == ""
      ? {}
      : (e.civil_expiry = String(moment(e.civil_expiry).format("DD/MM/YYYY")));

    e.license_expiry == ""
      ? {}
      : (e.license_expiry = String(
          moment(e.license_expiry).format("DD/MM/YYYY")
        ));

    e.medical_due_on == ""
      ? {}
      : (e.medical_due_on = String(
          moment(e.medical_due_on).format("DD/MM/YYYY")
        ));

    e.passportExpiry == ""
      ? {}
      : (e.passportExpiry = String(
          moment(e.passportExpiry).format("DD/MM/YYYY")
        ));

    e.vt_hse_induction == ""
      ? {}
      : (e.vt_hse_induction = String(
          moment(e.vt_hse_induction).format("DD/MM/YYYY")
        ));

    e.vt_car_1 == ""
      ? {}
      : (e.vt_car_1 = String(moment(e.vt_car_1).format("DD/MM/YYYY")));

    e.vt_car_2 == ""
      ? {}
      : (e.vt_car_2 = String(moment(e.vt_car_2).format("DD/MM/YYYY")));

    e.vt_car_3 == ""
      ? {}
      : (e.vt_car_3 = String(moment(e.vt_car_3).format("DD/MM/YYYY")));

    e.vt_car_4 == ""
      ? {}
      : (e.vt_car_4 = String(moment(e.vt_car_4).format("DD/MM/YYYY")));

    e.vt_car_5 == ""
      ? {}
      : (e.vt_car_5 = String(moment(e.vt_car_5).format("DD/MM/YYYY")));

    e.vt_car_6 == ""
      ? {}
      : (e.vt_car_6 = String(moment(e.vt_car_6).format("DD/MM/YYYY")));

    e.vt_car_7 == ""
      ? {}
      : (e.vt_car_7 = String(moment(e.vt_car_7).format("DD/MM/YYYY")));

    e.vt_car_8 == ""
      ? {}
      : (e.vt_car_8 = String(moment(e.vt_car_8).format("DD/MM/YYYY")));

    e.vt_car_9 == ""
      ? {}
      : (e.vt_car_9 = String(moment(e.vt_car_9).format("DD/MM/YYYY")));

    e.vt_car_10 == ""
      ? {}
      : (e.vt_car_10 = String(moment(e.vt_car_10).format("DD/MM/YYYY")));
  });

  const worksheet = XLSX.utils.json_to_sheet(records, { header: myHeader });
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Buffer to store the generated Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(blob, "exportedData - " + moment().format("DD.MM.YYYY") + ".xlsx");
};

export const exportDatabase = (records: any, category: string | undefined) => {
  const myHeader = [
    "id",
    "name",
    "type",
    "state",
    "remarks",
    "employeeCode",
    "companyName",
    "email",
    "contact",
    "cug",
    "dateofJoin",
    "nationality",
    "nativeAddress",
    "nativePhone",
    "designation",
    "role",
    "initialSalary",
    "initialAllowance",
    "salaryBasic",
    "allowance",
    "site",
    "project",
    "civil_number",
    "civil_DOB",
    "civil_expiry",
    "license_number",
    "license_issue",
    "license_expiry",
    "medical_completed_on",
    "medical_due_on",
    "passportID",
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

  const Header = [
    "id",
    "name",
    "type",
    "state",
    "remarks",
    "employeeCode",
    "companyName",
    "email",
    "contact",
    "cug",
    "dateofJoin",
    "nationality",
    "nativeAddress",
    "nativePhone",
    "designation",
    "role",
    "initialSalary",
    "initialAllowance",
    "salaryBasic",
    "allowance",
    "site",
    "project",
    "civil_number",
    "civil_DOB",
    "civil_expiry",
    "license_number",
    "license_issue",
    "license_expiry",
    "medical_completed_on",
    "medical_due_on",
    "passportID",
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

  // records.forEach((e: any) => {
  //   e.civil_expiry == ""
  //     ? {}
  //     : (e.civil_expiry = String(moment(e.civil_expiry).format("DD/MM/YYYY")));

  //   e.license_expiry == ""
  //     ? {}
  //     : (e.license_expiry = String(
  //         moment(e.license_expiry).format("DD/MM/YYYY")
  //       ));

  //   e.medical_due_on == ""
  //     ? {}
  //     : (e.medical_due_on = String(
  //         moment(e.medical_due_on).format("DD/MM/YYYY")
  //       ));

  //   e.passportExpiry == ""
  //     ? {}
  //     : (e.passportExpiry = String(E
  //         moment(e.passportExpiry).format("DD/MM/YYYY")
  //       ));

  //   e.vt_hse_induction == ""
  //     ? {}
  //     : (e.vt_hse_induction = String(
  //         moment(e.vt_hse_induction).format("DD/MM/YYYY")
  //       ));

  //   e.vt_car_1 == ""
  //     ? {}
  //     : (e.vt_car_1 = String(moment(e.vt_car_1).format("DD/MM/YYYY")));

  //   e.vt_car_2 == ""
  //     ? {}
  //     : (e.vt_car_2 = String(moment(e.vt_car_2).format("DD/MM/YYYY")));

  //   e.vt_car_3 == ""
  //     ? {}
  //     : (e.vt_car_3 = String(moment(e.vt_car_3).format("DD/MM/YYYY")));

  //   e.vt_car_4 == ""
  //     ? {}
  //     : (e.vt_car_4 = String(moment(e.vt_car_4).format("DD/MM/YYYY")));

  //   e.vt_car_5 == ""
  //     ? {}
  //     : (e.vt_car_5 = String(moment(e.vt_car_5).format("DD/MM/YYYY")));

  //   e.vt_car_6 == ""
  //     ? {}
  //     : (e.vt_car_6 = String(moment(e.vt_car_6).format("DD/MM/YYYY")));

  //   e.vt_car_7 == ""
  //     ? {}
  //     : (e.vt_car_7 = String(moment(e.vt_car_7).format("DD/MM/YYYY")));

  //   e.vt_car_8 == ""
  //     ? {}
  //     : (e.vt_car_8 = String(moment(e.vt_car_8).format("DD/MM/YYYY")));

  //   e.vt_car_9 == ""
  //     ? {}
  //     : (e.vt_car_9 = String(moment(e.vt_car_9).format("DD/MM/YYYY")));

  //   e.vt_car_10 == ""
  //     ? {}
  //     : (e.vt_car_10 = String(moment(e.vt_car_10).format("DD/MM/YYYY")));
  // });

  const worksheet = XLSX.utils.json_to_sheet(records, {
    header: category == "personal" ? Header : myHeader,
  });
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Buffer to store the generated Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(blob, "exportedData - " + moment().format("DD.MM.YYYY") + ".xlsx");
};
