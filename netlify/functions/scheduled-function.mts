import emailjs from "@emailjs/nodejs";
import type { Config } from "@netlify/functions";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import moment from "moment";
import { db } from "../../src/firebase";

export default async (req: Request) => {
  const serviceId = "service_fixajl8";
  const templateId = "template_1y0oq9l";

  const today = new Date();
  let m = "";
  let p = "";
  let rp = "";
  let filteredData = [];

  try {
    const RecipientCollection = collection(db, "recipients");
    const Query = query(RecipientCollection, orderBy("created_on"));
    const Snapshot = await getDocs(Query);
    const Data: any = [];

    Snapshot.forEach((doc: any) => {
      Data.push({ id: doc.id, ...doc.data() });
    });

    const RecordCollection = collection(db, "records");
    const recordQuery = query(
      RecordCollection,
      orderBy("created_on"),
      where("state", "==", "active")
    );
    const querySnapshot = await getDocs(recordQuery);
    const fetchedData: any = [];

    querySnapshot.forEach((doc: any) => {
      fetchedData.push({ id: doc.id, ...doc.data() });
    });

    filteredData = fetchedData.filter((e: any) => {
      return (
        (e.civil_expiry &&
          Math.round(moment(e.civil_expiry).diff(moment(today), "months")) <=
            2) ||
        (e.license_expiry &&
          Math.round(moment(e.license_expiry).diff(moment(today), "months")) <=
            2) ||
        (e.medical_due_on &&
          Math.round(moment(e.medical_due_on).diff(moment(today), "months")) <=
            2) ||
        (e.passportExpiry &&
          Math.round(moment(e.passportExpiry).diff(moment(today), "months")) <=
            6) ||
        (e.vt_hse_induction &&
          Math.round(
            moment(e.vt_hse_induction).diff(moment(today), "months")
          ) <= 2) ||
        (e.vt_car_1 &&
          Math.round(moment(e.vt_car_1).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_2 &&
          Math.round(moment(e.vt_car_2).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_3 &&
          Math.round(moment(e.vt_car_3).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_4 &&
          Math.round(moment(e.vt_car_4).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_5 &&
          Math.round(moment(e.vt_car_5).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_6 &&
          Math.round(moment(e.vt_car_6).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_7 &&
          Math.round(moment(e.vt_car_7).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_8 &&
          Math.round(moment(e.vt_car_8).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_9 &&
          Math.round(moment(e.vt_car_9).diff(moment(today), "months")) <= 2) ||
        (e.vt_car_10 &&
          Math.round(moment(e.vt_car_10).diff(moment(today), "months")) <= 2)
      );
    });

    Data.forEach((r: any) => {
      rp += r.recipient + ", ";
    });

    filteredData.forEach((element: any) => {
      m += element.name + "'s documents : \n\n";

      if (element.civil_expiry != "") {
        if (
          Math.round(
            moment(element.civil_expiry).diff(moment(today), "months")
          ) <= 2
        ) {
          m +=
            "Civil ID expiry  " +
            moment(element.civil_expiry).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.civil_expiry).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.civil_expiry).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.license_expiry != "") {
        if (
          Math.round(
            moment(element.license_expiry).diff(moment(today), "months")
          ) <= 2
        ) {
          m +=
            "Driving License expiry  " +
            moment(element.license_expiry).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.license_expiry).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.license_expiry).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.medical_due_on != "") {
        if (
          Math.round(
            moment(element.medical_due_on).diff(moment(today), "months")
          ) <= 2
        ) {
          m +=
            "Medical expiry  " +
            moment(element.medical_due_on).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.medical_due_on).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.medical_due_on).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.passportExpiry != "") {
        if (
          Math.round(
            moment(element.passportExpiry).diff(moment(today), "months")
          ) <= 6
        ) {
          m +=
            "Passport expiry  " +
            moment(element.passportExpiry).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.passportExpiry).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.passportExpiry).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_hse_induction != "") {
        if (
          Math.round(
            moment(element.vt_hse_induction).diff(moment(today), "months")
          ) <= 2
        ) {
          m +=
            "HSE Induction Training expiry  " +
            moment(element.vt_hse_induction).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_hse_induction)
                .add(1, "day")
                .format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_hse_induction).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_1 != "") {
        if (
          Math.round(moment(element.vt_car_1).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 1 Training expiry  " +
            moment(element.vt_car_1).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_1).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_1).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_2 != "") {
        if (
          Math.round(moment(element.vt_car_2).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 2 Training expiry  " +
            moment(element.vt_car_2).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_2).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_2).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_3 != "") {
        if (
          Math.round(moment(element.vt_car_3).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 3 Training expiry  " +
            moment(element.vt_car_3).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_3).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_3).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_4 != "") {
        if (
          Math.round(moment(element.vt_car_4).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 4 Training expiry  " +
            moment(element.vt_car_4).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_4).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_4).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_5 != "") {
        if (
          Math.round(moment(element.vt_car_5).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 5 Training expiry  " +
            moment(element.vt_car_5).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_5).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_5).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_6 != "") {
        if (
          Math.round(moment(element.vt_car_6).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 6 Training expiry  " +
            moment(element.vt_car_6).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_6).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_6).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_7 != "") {
        if (
          Math.round(moment(element.vt_car_7).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 7 Training expiry  " +
            moment(element.vt_car_7).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_7).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_7).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_8 != "") {
        if (
          Math.round(moment(element.vt_car_8).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 8 Training expiry  " +
            moment(element.vt_car_8).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_8).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_8).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_9 != "") {
        if (
          Math.round(moment(element.vt_car_9).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 9 Training expiry  " +
            moment(element.vt_car_9).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_9).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_9).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (element.vt_car_10 != "") {
        if (
          Math.round(moment(element.vt_car_10).diff(moment(today), "months")) <=
          2
        ) {
          m +=
            "CAR - 10 Training expiry  " +
            moment(element.vt_car_10).startOf("day").fromNow() +
            " on " +
            String(
              moment(element.vt_car_10).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(element.vt_car_10).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      m += element.state == "archived" ? " (Archived) " : "";
      m += "\n\n";
    });

    // INDIVIDUAL MAIL SEND

    filteredData.forEach(async (e: any) => {
      p = "";
      p +=
        "Listed below are some document(s) which require your attention : \n\n";

      if (e.civil_expiry != "") {
        if (
          Math.round(moment(e.civil_expiry).diff(moment(today), "months")) <= 2
        ) {
          p +=
            "Civil ID expiry  " +
            moment(e.civil_expiry).startOf("day").fromNow() +
            " on " +
            String(moment(e.civil_expiry).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.civil_expiry).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.license_expiry != "") {
        if (
          Math.round(moment(e.license_expiry).diff(moment(today), "months")) <=
          2
        ) {
          p +=
            "Driving License expiry  " +
            moment(e.license_expiry).startOf("day").fromNow() +
            " on " +
            String(
              moment(e.license_expiry).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(e.license_expiry).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.medical_due_on != "") {
        if (
          Math.round(moment(e.medical_due_on).diff(moment(today), "months")) <=
          2
        ) {
          p +=
            "Medical expiry  " +
            moment(e.medical_due_on).startOf("day").fromNow() +
            " on " +
            String(
              moment(e.medical_due_on).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(e.medical_due_on).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.passportExpiry != "") {
        if (
          Math.round(moment(e.passportExpiry).diff(moment(today), "months")) <=
          6
        ) {
          p +=
            "Passport expiry  " +
            moment(e.passportExpiry).startOf("day").fromNow() +
            " on " +
            String(
              moment(e.passportExpiry).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(e.passportExpiry).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_hse_induction != "") {
        if (
          Math.round(
            moment(e.vt_hse_induction).diff(moment(today), "months")
          ) <= 2
        ) {
          p +=
            "HSE Induction Training expiry  " +
            moment(e.vt_hse_induction).startOf("day").fromNow() +
            " on " +
            String(
              moment(e.vt_hse_induction).add(1, "day").format("DD/MM/YYYY")
            ) +
            String(
              moment(e.vt_hse_induction).diff(
                moment(today).startOf("day"),
                "days"
              ) <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_1 != "") {
        if (Math.round(moment(e.vt_car_1).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 1 Training expiry  " +
            moment(e.vt_car_1).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_1).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_1).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_2 != "") {
        if (Math.round(moment(e.vt_car_2).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 2 Training expiry  " +
            moment(e.vt_car_2).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_2).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_2).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_3 != "") {
        if (Math.round(moment(e.vt_car_3).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 3 Training expiry  " +
            moment(e.vt_car_3).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_3).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_3).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_4 != "") {
        if (Math.round(moment(e.vt_car_4).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 4 Training expiry  " +
            moment(e.vt_car_4).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_4).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_4).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_5 != "") {
        if (Math.round(moment(e.vt_car_5).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 5 Training expiry  " +
            moment(e.vt_car_5).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_5).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_5).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_6 != "") {
        if (Math.round(moment(e.vt_car_6).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 6 Training expiry  " +
            moment(e.vt_car_6).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_6).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_6).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_7 != "") {
        if (Math.round(moment(e.vt_car_7).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 7 Training expiry  " +
            moment(e.vt_car_7).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_7).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_7).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_8 != "") {
        if (Math.round(moment(e.vt_car_8).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 8 Training expiry  " +
            moment(e.vt_car_8).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_8).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_8).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_9 != "") {
        if (Math.round(moment(e.vt_car_9).diff(moment(today), "months")) <= 2) {
          p +=
            "CAR - 9 Training expiry  " +
            moment(e.vt_car_9).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_9).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_9).diff(moment(today).startOf("day"), "days") <= 0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      if (e.vt_car_10 != "") {
        if (
          Math.round(moment(e.vt_car_10).diff(moment(today), "months")) <= 2
        ) {
          p +=
            "CAR - 10 Training expiry  " +
            moment(e.vt_car_10).startOf("day").fromNow() +
            " on " +
            String(moment(e.vt_car_10).add(1, "day").format("DD/MM/YYYY")) +
            String(
              moment(e.vt_car_10).diff(moment(today).startOf("day"), "days") <=
                0
                ? " (Overdue) "
                : ""
            ) +
            "\n\n";
        }
      }

      //INDIVIDIAL MAIL SEND
      filteredData.length >= 1
        ? e.email != "" &&
          e.notify == true &&
          (await emailjs.send(
            serviceId,
            "template_0f3zy3e",
            {
              recipient: e.email + ", ",
              subject: "Document Expiry Reminder",
              message: p,
            },
            {
              publicKey: "c8AePKR5BCK8UIn_E",
              privateKey: "9pSXJLIK1ktbJWQSCX-Xw",
            }
          ))
        : null;
    });

    // GENERAL MAIL SEND
    filteredData.length >= 1
      ? await emailjs.send(
          serviceId,
          templateId,
          {
            recipient: rp,
            subject: "HR Document Expiry Reminder",
            message: m,
          },
          {
            publicKey: "c8AePKR5BCK8UIn_E",
            privateKey: "9pSXJLIK1ktbJWQSCX-Xw",
          }
        )
      : null;
  } catch (error) {
    console.log(error);
  }

  const { next_run } = await req.json();
  console.log("Received event Next invocation at:", next_run);
};

export const config: Config = {
  // schedule: " 04 00 1 * * ",
  schedule: " * * * * * ",
};
