import * as XLSX from '@e965/xlsx';
import { saveAs } from 'file-saver';
import moment from 'moment';

export const getBlank = async (category:string|undefined) => {
    try {
        
        const myHeader = ["name","employeeCode","companyName","email","contact","dateofJoin","nativeAddress","nativePhone","initialSalary","initialAllowance","civil_number","civil_DOB", "civil_expiry", "license_number","license_issue", "license_expiry","medical_completed_on" ,"medical_due_on","passportID","passportIssue", "passportExpiry", "vt_hse_induction", "vt_car_1", "vt_car_2", "vt_car_3", "vt_car_4", "vt_car_5", "vt_car_6", "vt_car_7", "vt_car_8", "vt_car_9", "vt_car_10"];

        const Header = ["name","employeeCode","companyName","email","contact","dateofJoin","nativeAddress","nativePhone","initialSalary","initialAllowance","civil_number","civil_DOB", "civil_expiry", "license_number","license_issue", "license_expiry","medical_completed_on" ,"medical_due_on","passportID","passportIssue", "passportExpiry"]

        const worksheet = XLSX.utils.json_to_sheet([{}], {header: category=="personal"?Header: myHeader});

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // Buffer to store the generated Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        saveAs(blob, "Template.xlsx");
        
    } catch (error) {
        console.log(error)
    }
}


export const exportDatabase = (records:any, category:string|undefined) => {
    const myHeader = ["id","name","employeeCode","type","companyName","state","civil_number", "civil_expiry", "license_number", "license_expiry", "medical_due_on","passportID", "passportExpiry", "vt_hse_induction", "vt_car_1", "vt_car_2", "vt_car_3", "vt_car_4", "vt_car_5", "vt_car_6", "vt_car_7", "vt_car_8", "vt_car_9", "vt_car_10"];

    const Header = ["id","name","employeeCode","type","companyName","state","civil_number", "civil_expiry", "license_number", "license_expiry", "medical_due_on","passportID", "passportExpiry"]

    records.forEach((e:any) => {
        
        e.civil_expiry==""?
        {}
        : 
        e.civil_expiry = String(moment(e.civil_expiry.toDate()).format("DD/MM/YYYY"))

        e.license_expiry==""?
        {}
        :
        e.license_expiry = String(moment(e.license_expiry.toDate()).format("DD/MM/YYYY"))


        e.medical_due_on==""?
        {}
        :
        e.medical_due_on = String(moment(e.medical_due_on.toDate()).format("DD/MM/YYYY"))

        e.passportExpiry==""?
        {}
        :
        e.passportExpiry = String(moment(e.passportExpiry.toDate()).format("DD/MM/YYYY"))
        


        e.vt_hse_induction==""?
        {}
        :
        category=="vale"?
        e.vt_hse_induction = String(moment(e.vt_hse_induction.toDate()).format("DD/MM/YYYY"))
        :{}




        e.vt_car_1==""?
        {}
        :
        category=="vale"?
        e.vt_car_1 = String(moment(e.vt_car_1.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_2==""?
        {}
        :
        category=="vale"?
        e.vt_car_2 = String(moment(e.vt_car_2.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_3==""?
        {}
        :
        category=="vale"?
        e.vt_car_3 = String(moment(e.vt_car_3.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_4==""?
        {}
        :
        category=="vale"?
        e.vt_car_4 = String(moment(e.vt_car_4.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_5==""?
        {}
        :
        category=="vale"?
        e.vt_car_5 = String(moment(e.vt_car_5.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_6==""?
        {}
        :
        category=="vale"?
        e.vt_car_6 = String(moment(e.vt_car_6.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_7==""?
        {}
        :
        category=="vale"?
        e.vt_car_7 = String(moment(e.vt_car_7.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_8==""?
        {}
        :
        category=="vale"?
        e.vt_car_8 = String(moment(e.vt_car_8.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_9==""?
        {}
        :
        category=="vale"?
        e.vt_car_9 = String(moment(e.vt_car_9.toDate()).format("DD/MM/YYYY"))
        :{}



        e.vt_car_10==""?
        {}
        :
        category=="vale"?
        e.vt_car_10 = String(moment(e.vt_car_10.toDate()).format("DD/MM/YYYY"))
        :{}
    });

    const worksheet = XLSX.utils.json_to_sheet(records, {header: category=="personal"?Header:myHeader});
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Buffer to store the generated Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    saveAs(blob, "exportedData.xlsx");
    

}