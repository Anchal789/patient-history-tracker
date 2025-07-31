import type { Patient, Prescription, Medicine, PrintConfig } from "./types"
import { format } from "date-fns"

// Default print configuration
export const defaultPrintConfig: PrintConfig = {
  hospitalName: "Rakshanam Ayurveda Hospital",
  hospitalAddress: "481331",
  hospitalContact: "+91-8827711661",
  doctorName: "Dr. Gaurav Puri",
  doctorQualification: "(B.A.M.S) Ayurveda",
  doctorRegistration: "Registration Number: 60599",
}

// Function to generate a patient ID (dummy implementation)
export const generatePatientId = (): string => {
  return "OW" + Math.random().toString(36).substring(2, 10).toUpperCase()
}

// Function to generate an appointment ID
export const generateAppointmentId = (): string => {
  return Array.from({ length: 5 }, () => Math.random().toString(36).substring(2, 6)).join("-")
}

// Helper function to format the dosage instruction
export const formatDosageInstruction = (medicine: Medicine): string => {
  const sortedDosage =
    medicine?.dosage?.length > 0
      ? [...medicine.dosage].sort((a, b) => {
          const timeOrder = ["Morning", "Afternoon", "Evening", "Night"]
          return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time)
        })
      : []

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
        } - ${item.quantity} - ${item.instructions}</p>`,
    )
    .join("")}</div>`
}

// Function to generate prescription print HTML
export const generatePrescriptionHTML = (
  patient: Patient,
  prescription: Prescription,
  config: PrintConfig = defaultPrintConfig,
): string => {
  const prescDate = new Date(prescription.date)

  // Format advice items as bullet points
  const adviceItems = prescription.specialAdvice
    ? prescription.specialAdvice
        .split("\n")
        ?.map((line) => `<li>${line}</li>`)
        .join("")
    : ""

  // Format examination notes as bullet points
  const examItems = prescription.examNotes
    ? prescription.examNotes
        .split("\n")
        ?.map((line) => `<li>${line}</li>`)
        .join("")
    : ""

  // Format medicines as table rows
  const medicineRows = prescription.medicines
    ?.map((med, index) => {
      let durationText = ""
      if (med.duration.days > 0) {
        durationText = `${med.duration.days} दिन`
      }
      if (med.duration.months > 0) {
        durationText = durationText + ` ${med.duration.months} महीने`
      }
      if (med.duration.years > 0) {
        durationText = durationText + ` ${med.duration.years} वर्ष`
      }
      return `
    <div>
      <b>${index + 1}. ${med.name}</b>
      <p style="margin-top: 4px; margin-bottom: 4px; margin-left : 15px">${durationText} (${med.type})</p>
      <span>${formatDosageInstruction(med)}</span>
    </div>
  `
    })
    .join("")

  // Format Panchkarma processes for back side
  const panchkarmaRows =
    prescription.panchkarmaProcesses && prescription.panchkarmaProcesses.length > 0
      ? prescription.panchkarmaProcesses
          .map((process) =>
            process.procedures
              .map(
                (procedure, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${procedure.procedureName}</td>
            <td>${procedure.material}</td>
            <td>${procedure.days.toString().padStart(2, "0")}</td>
          </tr>
        `,
              )
              .join(""),
          )
          .join("")
      : ""

  const hasPanchkarmaOrAdvice =
    (prescription.panchkarmaProcesses && prescription.panchkarmaProcesses.length > 0) || prescription.specialAdvice

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
          .page {
            page-break-after: always;
          }
          .page:last-child {
            page-break-after: auto;
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
          .back-page {
            padding: 40px;
            display: flex;
            flex-direction: column;
          }
          .back-page-content {
            margin-top: 200px;
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
          .panchkarma-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .panchkarma-table th, .panchkarma-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .panchkarma-table th {
            background-color: #f2f2f2;
            font-weight: bold;
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
        .page {
          page-break-after: always;
        }
        .page:last-child {
          page-break-after: auto;
        }
        .letterhead {
          height : 745px;
          position: relative;
          display: grid;
          max-width: 800px;
          grid-template-columns: 24% 70%;
          grid-gap: 10px;
        }
        .back-page {
          padding: 40px;
          display: flex;
          flex-direction: column;
        }
        .back-page-content {
          margin-top: 200px;
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
          max-height: calc(100vh - 190px);
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
        .panchkarma-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .panchkarma-table th, .panchkarma-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        .panchkarma-table th {
          background-color: #f2f2f2;
          font-weight: bold;
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
      
      <!-- Front Page -->
      <div class="page">
        <div class="letterhead">   
          <div class="vitals">
            <div>${prescription.pulse || "--"}</div>
            <div>${prescription.bloodPressure || "--"}</div>
            <div>${prescription.weight || "--"}</div>
            <div>${prescription.temperature || prescription.afebrileTemperature ? "Afebrile" : "__"}</div>
            <div>${"___"}</div>
            <div><strong>RESP RATE:</strong> ${prescription.respRate || "--"} rpm</div>
            ${prescription.spo2 ? `<div><strong>SPO2:</strong> ${prescription.spo2}%</div>` : ""}
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
              <strong>Follow up:</strong> ${format(new Date(prescription.followUpDate), "do MMMM, yyyy")}
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
          </div>
        </div>
      </div>

      ${
        hasPanchkarmaOrAdvice
          ? `
      <!-- Back Page -->
      <div class="page back-page">
        ${
          prescription.panchkarmaProcesses && prescription.panchkarmaProcesses.length > 0
            ? `
        <div class="back-page-content">
          <h2 style="text-align: center; margin-bottom: 30px; font-size: 24px;">Adv. Panchkarma Procedures</h2>
          <table class="panchkarma-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Procedure Name</th>
                <th>Material</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              ${panchkarmaRows}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
        
        ${
          prescription.specialAdvice
            ? `
        <div class="advice" style="margin-top: 40px;">
          <div class="section-title" style="font-size: 18px;">Advice (सलाह):</div>
          <ul style="margin-top: 15px; font-size: 16px; line-height: 1.6;">
            ${adviceItems}
          </ul>
        </div>
        `
            : ""
        }
      `
          : ""
      }
    </body>
    </html>
  `
}

export const printPrescription = (patient: Patient, prescription: Prescription, config?: PrintConfig) => {
  const html = generatePrescriptionHTML(patient, prescription, config)

  // Create a new window
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow popups for this site to print prescriptions")
    return
  }

  // Write HTML content
  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load
  printWindow.onload = () => {
    // Trigger print
    printWindow.focus()
    printWindow.print()
  }
}
