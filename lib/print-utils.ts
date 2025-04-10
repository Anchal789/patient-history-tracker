// import type { Patient, Prescription, Medicine, PrintConfig } from "./types";
// import { format } from "date-fns";
// import TemplateImage from "../assets/Template.jpg";
// import { PDFDocument, PDFTextField, StandardFonts } from "pdf-lib";
// import { ReactNode } from "react";
// import TemplatePdf from "../assets/Raksham Health Hindi Text.pdf";
// import { toast } from "@/components/ui/use-toast";
// import fontkit from "@pdf-lib/fontkit";
// import "regenerator-runtime/runtime";
// import { truncateByDomain } from "recharts/types/util/ChartUtils";

// // Default print configuration
// export const defaultPrintConfig: PrintConfig = {
//   hospitalName: "Rakshanam Ayurveda Hospital",
//   hospitalAddress: "481331",
//   hospitalContact: "+91-8827711661",
//   doctorName: "Dr. Gaurav Puri",
//   doctorQualification: "(B.A.M.S) Ayurveda",
//   doctorRegistration: "Registration Number: 60599",
// };

// // Function to generate a patient ID (dummy implementation)

// // Function to generate an appointment ID
// export const generateAppointmentId = (): string => {
//   return Array.from({ length: 5 }, () =>
//     Math.random().toString(36).substring(2, 6)
//   ).join("-");
// };

// // export const printPrescription = (patient: Patient, prescription: Prescription, config?: PrintConfig) => {
// //   const html = generatePrescriptionHTML(patient, prescription, config)

// //   // Create a new window
// //   const printWindow = window.open("", "_blank")
// //   if (!printWindow) {
// //     alert("Please allow popups for this site to print prescriptions")
// //     return
// //   }

// //   // Write HTML content
// //   printWindow.document.write(html)
// //   printWindow.document.close()

// //   // Wait for content to load
// //   printWindow.onload = () => {
// //     // Trigger print
// //     printWindow.focus()
// //     printWindow.print()
// //   }
// // }

// export const printPrescription = async (
//   patient: Patient,
//   prescription: Prescription
// ) => {
//   try {
//     const templateBytes = await fetch(TemplatePdf).then((res) =>
//       res.arrayBuffer()
//     );
//     const pdfDoc = await PDFDocument.load(templateBytes);

//     // Register fontkit
//     pdfDoc.registerFontkit(fontkit);

//     // Load and embed the Devanagari font
//     const fontBytes = await fetch("/fonts/NotoSansDevanagari-Regular.ttf").then(
//       (res) => res.arrayBuffer()
//     );
//     const devanagariFont = await pdfDoc.embedFont(fontBytes, { subset: true });

//     // Also embed a standard font for non-Hindi text
//     const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const standardFontBold = await pdfDoc.embedFont(
//       StandardFonts.HelveticaBold
//     );

//     const form = pdfDoc.getForm();

//     // Function to check if text contains Hindi characters
//     const containsHindi = (text: string): boolean => {
//       if (!text) return false;
//       return /[\u0900-\u097F\uA8E0-\uA8FF\u1CD0-\u1CFF]/.test(text);
//     };

//     // Corrected setFieldText function
//     const setFieldText = (
//       field: PDFTextField,
//       text: string,
//       forceHindi = false,
//       medicineName = false,
//       medIns = false
//     ) => {
//       if (!text) return;

//       const useHindiFont = forceHindi || containsHindi(text);
//       const font = useHindiFont ? devanagariFont : standardFont;

//       field.setText(text);
//       field.setFontSize(medIns ? 8 : 10);
//       field.updateAppearances(medicineName ? standardFontBold : font);
//     };

//     // Get all form fields
//     const nameField = form.getTextField("Name");
//     const dateField = form.getTextField("Date");
//     const ageGender = form.getTextField("AgeGender");
//     const address = form.getTextField("Address");
//     const pulse = form.getTextField("Pulse");
//     const bloodPressure = form.getTextField("BP");
//     const weight = form.getTextField("Weight");
//     const temperature = form.getTextField("Temperature");
//     const respiratory = form.getTextField("Resp");
//     const spO2 = form.getTextField("Spo2");
//     const patientId = form.getTextField("PatientId");
//     const followupDate = form.getTextField("FollowUp");
//     const chiefComplaints = form.getTextField("ChiefComplaint");
//     const diagnosis = form.getTextField("Diagnosis");
//     const med7Name = form.getTextField("Med7Name");
//     const med7Ins = form.getTextField("Med7Ins");
//     const med7Duration = form.getTextField("Med7Duration");
//     const advice = form.getTextField("Advice");

//     // Function to set text with the appropriate font
//     // const setFieldText = (field, text, containsHindi = false) => {
//     //   if (!text) return;

//     //   // Update the field's appearance with the appropriate font
//     //   field.updateAppearances(containsHindi ? devanagariFont : standardFont);
//     //   field.setText(text);
//     // };

//     // // Function to check if text contains Hindi characters
//     // const containsHindi = (text) => {
//     //   if (!text) return false;
//     //   return /[\u0900-\u097F]/.test(text); // Unicode range for Devanagari
//     // };

//     // Set English text fields
//     setFieldText(nameField, patient?.name || "");
//     setFieldText(dateField, format(new Date(prescription.date), "dd-MMM-yyyy"));
//     setFieldText(
//       ageGender,
//       `${patient.age || ""}${patient.gender ? "/ " + patient?.gender : ""}`
//     );
//     setFieldText(address, patient.address || "");
//     setFieldText(patientId, prescription.patientId || "");
//     setFieldText(
//       followupDate,
//       format(new Date(prescription?.followUpDate), "do MMMM, yyyy") || ""
//     );

//     // Set fields that might contain Hindi
//     setFieldText(
//       chiefComplaints,
//       prescription.chiefComplaints || "",
//       containsHindi(prescription.chiefComplaints)
//     );
//     setFieldText(
//       diagnosis,
//       prescription.diagnosis || "",
//       containsHindi(prescription.diagnosis)
//     );
//     setFieldText(
//       advice,
//       prescription.specialAdvice || "",
//       containsHindi(prescription.specialAdvice)
//     );

//     // Set more English fields
//     setFieldText(pulse, prescription.pulse || "");
//     setFieldText(bloodPressure, prescription.bloodPressure || "");
//     setFieldText(weight, prescription.weight || "");
//     setFieldText(
//       temperature,
//       prescription.afebrileTemperature
//         ? "No Fever"
//         : prescription.temperature || ""
//     );
//     setFieldText(
//       respiratory,
//       prescription.respRate ? "Resp rate: " + prescription.respRate : ""
//     );
//     setFieldText(
//       spO2,
//       prescription.spo2 ? "SPO2: " + prescription.spo2 + "%" : ""
//     );

//     // Handle medicine fields (1-6)
//     prescription?.medicines?.slice(0, 6)?.forEach((med, index) => {
//       if (med.name) {
//         const medNameField = form.getTextField(`Med${index + 1}Name`);
//         setFieldText(medNameField, `${index + 1}. ${med.name}`, true, true);
//       }
//     });

//     // Handle medicine 7 separately
//     if (prescription?.medicines?.[6]?.name) {
//       setFieldText(
//         med7Name,
//         `7. ${prescription.medicines[6].name}`,
//         true,
//         true
//       );

//       // Handle medicine 7 instructions (likely contains Hindi)
//       const med7InsText =
//         prescription?.medicines?.[6]?.dosage?.[0]?.instructions || "";
//       setFieldText(med7Ins, med7InsText, containsHindi(med7InsText));

//       // Handle medicine 7 duration (definitely contains Hindi)

//       const sortedDosage =
//         prescription?.medicines?.[6]?.dosage.length > 0
//           ? [...prescription?.medicines?.[6]?.dosage].sort((a, b) => {
//               const timeOrder = ["Morning", "Afternoon", "Evening", "Night"];
//               return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
//             })
//           : [];
//       if (prescription?.medicines?.[6]?.dosage.length > 0) {
//         const dosageText = sortedDosage
//           .map(
//             (item) =>
//               `${
//                 item.time === "Morning"
//                   ? "सुबह"
//                   : item.time === "Afternoon"
//                   ? "दोपहर"
//                   : item.time === "Evening"
//                   ? "शाम"
//                   : "रात"
//               } - ${item.quantity} - ${item.instructions}\n`
//           )
//           .join("");

//         setFieldText(med7Duration, dosageText, true, false, true);
//       }
//     }

//     // Handle medicine instructions for medicines 1-6 (contains Hindi)
//     prescription?.medicines?.slice(0, 6)?.forEach((med, index) => {
//       if (!med) return;

//       let durationText = "";
//       if (med.duration.days > 0) {
//         durationText = `${med.duration.days} दिन`;
//       }
//       if (med.duration.months > 0) {
//         durationText = durationText + ` ${med.duration.months} महीने`;
//       }
//       if (med.duration.years > 0) {
//         durationText = durationText + ` ${med.duration.years} साल`;
//       }

//       const sortedDosage =
//         med?.dosage?.length > 0
//           ? [...med.dosage].sort((a, b) => {
//               const timeOrder = ["Morning", "Afternoon", "Evening", "Night"];
//               return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
//             })
//           : [];

//       const dosageDetails = sortedDosage
//         .map(
//           (item) =>
//             `${
//               item.time === "Morning"
//                 ? "सुबह"
//                 : item.time === "Afternoon"
//                 ? "दोपहर"
//                 : item.time === "Evening"
//                 ? "शाम"
//                 : "रात"
//             } - ${item.quantity} - ${item.instructions}\n`
//         )
//         .join("");
//       const medInsField = form.getTextField(`Med${index + 1}Ins`);
//       const medInsText = `${med.type} (${durationText})\n${dosageDetails}`;
//       setFieldText(medInsField, medInsText, true, false, true);
//     });

//     // Flatten the form if needed
//     form.flatten();

//     // Save the PDF
//     const pdfBytes = await pdfDoc.save();

//     // Create a URL for the PDF
//     const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
//     const pdfUrl = URL.createObjectURL(pdfBlob);

//     // Open the PDF in a new tab
//     const printWindow = window.open(pdfUrl, "_blank");

//     if (!printWindow) {
//       alert("Please allow popups for this site to print prescriptions");
//       return;
//     }

//     printWindow.onload = () => {
//       printWindow.focus();
//       printWindow.print();

//       // Clean up the URL object after a delay
//       setTimeout(() => {
//         URL.revokeObjectURL(pdfUrl);
//       }, 30000); // Clean up after 30 seconds
//     };
//   } catch (error) {
//     console.error("Error generating PDF prescription:", error);
//     toast({
//       title: "Error",
//       description:
//         "There was an error printing the prescription. Please contact administrator.",
//       variant: "destructive",
//     });
//   }
// };

import type { Patient, Prescription, Medicine, PrintConfig } from "./types";
import { format } from "date-fns";
import TemplateImage from "../assets/Template.jpg";
import { ReactNode } from "react";

// Default print configuration
export const defaultPrintConfig: PrintConfig = {
  hospitalName: "Rakshanam Ayurveda Hospital",
  hospitalAddress: "481331",
  hospitalContact: "+91-8827711661",
  doctorName: "Dr. Gaurav Puri",
  doctorQualification: "(B.A.M.S) Ayurveda",
  doctorRegistration: "Registration Number: 60599",
};

// Function to generate a patient ID (dummy implementation)
export const generatePatientId = (): string => {
  return "OW" + Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Function to generate an appointment ID
export const generateAppointmentId = (): string => {
  return Array.from({ length: 5 }, () =>
    Math.random().toString(36).substring(2, 6)
  ).join("-");
};

// Helper function to format the dosage instruction
export const formatDosageInstruction = (medicine: Medicine): ReactNode => {
  // Group dosages by time
  const timingMap: Record<string, string> = {};
  //   medicine.dosage.forEach((d) => {
  //     timingMap[d.time] = d.quantity
  //   })
  //   // Create a string like "1-0-1" for morning-afternoon-evening
  //   const pattern = ["Morning", "Afternoon", "Evening", "Night"]?.map((time) => timingMap[time] || "0").join("-")

  //   // Get the instruction from the first dosage (assuming all have same instructions)
  //   const instruction = medicine.dosage.length > 0 ? medicine.dosage[0].instructions : ""

  // Add duration

  const sortedDosage =
    medicine?.dosage?.length > 0
      ? [...medicine.dosage].sort((a, b) => {
          const timeOrder = ["Morning", "Afternoon", "Evening", "Night"];
          return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
        })
      : [];
  return `<div class="medicineQuantity">${sortedDosage
    .map(
      (item) =>
        `<p class="medicineIns">${
          item.time === "Morning"
            ? "सुबह"
            : item.time === "Afternoon"
            ? "दोपहर"
            : item.time === "Evening"
            ? "शाम"
            : "रात"
        } - ${item.quantity} - ${item.instructions}</p>`
    ).join("")}</div>`;
};

// Function to generate prescription print HTML
export const generatePrescriptionHTML = (
  patient: Patient,
  prescription: Prescription,
  config: PrintConfig = defaultPrintConfig
): string => {
  const prescDate = new Date(prescription.date);

  // Format advice items as bullet points
  const adviceItems = prescription.specialAdvice
    ? prescription.specialAdvice
        .split("\n")
        ?.map((line) => `<li>${line}</li>`)
        .join("")
    : "";

  // Format examination notes as bullet points
  const examItems = prescription.examNotes
    ? prescription.examNotes
        .split("\n")
        ?.map((line) => `<li>${line}</li>`)
        .join("")
    : "";

  // Format medicines as table rows
  const medicineRows = prescription.medicines
    ?.map((med, index) => {
      let durationText = "";
      if (med.duration.days > 0) {
        durationText = `${med.duration.days} दिन`;
      }
      if (med.duration.months > 0) {
        durationText = durationText + ` ${med.duration.months} महीने`;
      }
      if (med.duration.years > 0) {
        durationText = durationText + ` ${med.duration.years} वर्ष`;
      }
      return `
    <div>
      <b>${index + 1}. ${med.name}</b>
      <p style="margin-top: 4px; margin-bottom: 4px; margin-left : 15px">${durationText} (${med.type})</p>
      <span>${formatDosageInstruction(med)}</span>
    </div>
  `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Prescription for ${patient.name}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            max-width: 800px;
            margin: 0;
            
          }
          .letterhead {
            height: auto;
            min-height: 745px;
            position: relative;
            display: grid;
            max-width: 800px;
            grid-template-columns: 24% 70%;
            grid-gap: 10px;
           
            
          }
          .image{
            display: none;
            max-width : 800px;
            position: absolute;
            height: 100vh;
           
            
          }
          .header {
            display: flex;
            justify-content: space-between;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .hospital-info {
            text-align: left;
          }
          .doctor-info {
            text-align: right;
          }
          .hospital-name {
            font-weight: bold;
            font-size: 14pt;
          }
          .doctor-name {
            font-weight: bold;
            font-size: 12pt;
          }
          .patient-info {
            margin-bottom: 20px;
          }
          .name {
            margin-top: 8px;
            margin-left: 44px;
          }
          .date {
            margin-top: 8px;
            margin-left: 42px;
          }
          .age {
          margin-top: -1px;
          margin-left: 72px;
          }
          .nameDate{
            display : flex;
            justify-content: space-between;
          }
          .address{
            margin-top: -1px;
            margin-left: 65px;
          }
          .ageAddress{
            display : flex;
          }
          .patientId{
            margin-left : 9px;
          }
          .vitals {
            margin-top: 595px;
            gap: 17px;
            text-align: end;
            display : flex;
            flex-direction: column;
            font-size: large;
          }
          .mainContent{
            margin-top : 250px;
            height : 780px;
            max-height: 780px;
            margin-bottom : 190px;
          }
          .chiefComplaints b{
            margin-left: 60px;  
          }
          .chiefComplaints p{
            margin-left: 60px;  
          }
          .exam-notes{
            margin-left: 15px;
          }
          .diagnosis{
            margin-left: 15px;
          }
          .medicines{
            margin-top : 20px;
            margin-left: 12px;
    
          }
          .medicineQuantity{
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            gap:5px;
            margin-left : 15px;
          }
            .medicineIns{
            font-size: 13px;
            margin : 0;
            }
            .medicineName{
            display: flex;
            flex-direction : column;
            }
          .medicineQuantity p{
            margin : 0;
          }
          .section-title {
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .advice{
            margin-top:300px;
          }
          .advice ul, .exam-notes ul {
            margin: 5px 0;
            padding-left: 20px;
          }
          .signature {
            text-align: right;
            margin-top: 40px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 9pt;
            padding-top: 5px;
          }
          .idFollowup{
            display :flex;
            justify-content: space-between;
            width : 100&;
          }
          /* Hide print button when printing */
          .no-print {
            display: none;
          }
        }
        
        /* Styles for screen display */
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          max-width: 800px;
          margin: 0;
          margin-bottom: 100px;
        }
        .letterhead {
          height : 745px;
          position: relative;
          display: grid;
          max-width: 800px;
          grid-template-columns: 24% 70%;
          grid-gap: 10px;
        }
        .image{
           max-width : 800px;
           position: absolute;
        }
        .header {
          display: flex;
          justify-content: space-between;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .hospital-info {
          text-align: left;
        }
        .doctor-info {
          text-align: right;
        }
        .hospital-name {
          font-weight: bold;
          font-size: 14pt;
        }
        .doctor-name {
          font-weight: bold;
          font-size: 12pt;
        }
        .patient-info {
          margin-bottom: 20px;
        }
        .name {
          margin-top: 8px;
          margin-left: 44px;
        }
        .date {
          margin-top: 8px;
          margin-right: -11px;
        }
        .age {
         margin-top: 2px;
         margin-left: 67px;
        }
        .nameDate{
          display : flex;
          justify-content: space-between;
        }
        .address{
          margin-top: 2px;
          margin-left: 65px;
        }
        .ageAddress{
          display : flex;
        }
        .patientId{
          margin-left : 9px;
        }
        .vitals {
          margin-top: 605px;
          gap: 17px;
          text-align: end;
          display : flex;
          flex-direction: column;
          font-size: large;
        }
        .mainContent{
          margin-top : 210px;
          max-height: calc(100vh - 190px); /* Viewport height minus margins and header */
        }
        .chiefComplaints b{
          margin-left: 60px;  
        }
        .chiefComplaints p{
          margin-left: 60px;  
        }
        .exam-notes{
          margin-left: 15px;
        }
        .diagnosis{
          margin-left: 15px;
        }
        .medicines{
          margin-top : 20px;
          margin-left: 12px;
        
        }
        .medicineQuantity{
          display: flex;
          flex-direction : column;
          flex-wrap: wrap;
          gap:5px;
          margin-left : 15px;
        }
           .medicineIns{
            font-size: 13px;
            margin : 0}
           .medicineName{
            display: flex;
            flex-direction : column;
            }
        .medicineQuantity p{
          margin : 0;
        }
        .section-title {
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .advice{
          margin-top:300px;
        }
        .advice ul, .exam-notes ul {
          margin: 5px 0;
          padding-left: 20px;
        }
        
        .signature {
          text-align: right;
          margin-top: 40px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 9pt;
          padding-top: 5px;
        }
        .idFollowup{
          display :flex;
          justify-content: space-between;
          width : 100&;
        }
        .print-btn {
          background-color: #4CAF50;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 20px;
        }
        .print-btn:hover {
          background-color: #45a049;
        }
        .no-print {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="print-btn" onclick="window.print()">Print Prescription</button>
      </div>
      
      <img class="image" src="${TemplateImage.src}"/>
      <div class="letterhead">   
        <div class="vitals">
          <div>${prescription.pulse || "--"}</div>
          <div>${prescription.bloodPressure || "--"}</div>
          <div>${prescription.weight || "--"}</div>
          <div>${
            prescription.temperature || prescription.afebrileTemperature
              ? "Afebrile"
              : "__"
          }</div>
          <div>${"___"}</div>
          <div><strong>RESP RATE:</strong> ${
            prescription.respRate || "--"
          } rpm</div>
          ${
            prescription.spo2
              ? `<div><strong>SPO2:</strong> ${prescription.spo2}%</div>`
              : ""
          }
        </div>
        
        <div class="mainContent">
          <div class="patient-info">
            <div class="nameDate">
              <p class="name">${patient?.name}</p>
              <p class="date">${format(prescDate, "dd-MMM-yyyy")}</p>
            </div>
             <div class="ageAddress">
                <p class="age">${patient?.age}/${patient?.gender}</p>
                <p class="address">${patient?.address || "address"}</p>
              </div>
              <div class="idFollowup">
               <div class="follow-up">
              <strong class="patientId">Patient ID:</strong> ${prescription.patientId
                .substring(0, 10)
                .toUpperCase()}  </div> ${
    prescription.followUpDate
      ? `
          <div class="follow-up">
            <strong>Follow up:</strong> ${format(
              new Date(prescription.followUpDate),
              "do MMMM, yyyy"
            )}
          </div>
          `
      : ""
  }
              </div>
          </div>
          
          <div class="chiefComplaints">
            <b>Chief Complaints:</b>
            <p>${prescription.chiefComplaints || "None specified"}</p>
          </div>
          
          
          <div class="diagnosis">
            <div class="section-title">DIAGNOSIS:</div>
            <div>${prescription.diagnosis || "Not specified"}</div>
          </div>
          
          <div class="medicines">
            <p style="font-weight: bold">Medicines (दवाइयाँ):</p>
            <div class="medicineRows" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${medicineRows}
            </div>
          </div>
          
          ${
            prescription.specialAdvice
              ? `
          <div class="advice">
            <div class="section-title">Adivce (सलाह):</div>
            <ul>${adviceItems}</ul>
          </div>
          `
              : ""
          }
        
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printPrescription = (
  patient: Patient,
  prescription: Prescription,
  config?: PrintConfig
) => {
  const html = generatePrescriptionHTML(patient, prescription, config);

  // Create a new window
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to print prescriptions");
    return;
  }

  // Write HTML content
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load
  printWindow.onload = () => {
    // Trigger print
    printWindow.focus();
    printWindow.print();
  };
};
