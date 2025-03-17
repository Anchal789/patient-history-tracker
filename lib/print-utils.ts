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
  // Group dosages by time
  const timingMap: Record<string, string> = {}
  medicine.dosage.forEach((d) => {
    timingMap[d.time] = d.quantity
  })

  // Create a string like "1-0-1" for morning-afternoon-evening
  const pattern = ["Morning", "Afternoon", "Evening"].map((time) => timingMap[time] || "0").join("-")

  // Get the instruction from the first dosage (assuming all have same instructions)
  const instruction = medicine.dosage.length > 0 ? medicine.dosage[0].instructions : ""

  // Add duration
  let durationText = ""
  if (medicine.duration.days > 0) {
    durationText = `for ${medicine.duration.days} days`
  } else if (medicine.duration.months > 0) {
    durationText = `for ${medicine.duration.months} months`
  } else if (medicine.duration.years > 0) {
    durationText = `for ${medicine.duration.years} years`
  }

  return `${pattern}\n${instruction} ${durationText}`
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
        .map((line) => `<li>${line}</li>`)
        .join("")
    : ""

  // Format examination notes as bullet points
  const examItems = prescription.examNotes
    ? prescription.examNotes
        .split("\n")
        .map((line) => `<li>${line}</li>`)
        .join("")
    : ""

  // Format medicines as table rows
  const medicineRows = prescription.medicines
    .map(
      (med, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${med.name} ${med.type}</td>
      <td>${formatDosageInstruction(med)}</td>
    </tr>
  `,
    )
    .join("")

  // Generate the HTML with styling that matches the letterhead
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
            margin: 0;
            padding: 0;
            width: 100%;
            font-family: Arial, sans-serif;
            font-size: 11pt;
          }
          .letterhead {
            padding: 20px 30px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #000;
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
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
          }
          .vitals {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
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
          .advice ul, .exam-notes ul {
            margin: 5px 0;
            padding-left: 20px;
          }
          .follow-up {
            margin-top: 20px;
            padding: 10px 0;
            border-top: 1px solid #000;
          }
          .signature {
            text-align: right;
            margin-top: 40px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 9pt;
            border-top: 1px solid #000;
            padding-top: 5px;
          }
          /* Hide print button when printing */
          .no-print {
            display: none !important;
          }
        }
        
        /* Styles for screen display */
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          font-size: 11pt;
        }
        .letterhead {
          border: 1px solid #ccc;
          padding: 20px 30px;
          margin-bottom: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #000;
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
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
        }
        .vitals {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
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
        .advice ul, .exam-notes ul {
          margin: 5px 0;
          padding-left: 20px;
        }
        .follow-up {
          margin-top: 20px;
          padding: 10px 0;
          border-top: 1px solid #000;
        }
        .signature {
          text-align: right;
          margin-top: 40px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 9pt;
          border-top: 1px solid #000;
          padding-top: 5px;
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
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="print-btn" onclick="window.print()">Print Prescription</button>
      </div>
      
      <div class="letterhead">
        <div class="header">
          <div class="hospital-info">
            <div class="hospital-name">${config.hospitalName}</div>
            <div>${config.hospitalAddress}</div>
            <div>${config.hospitalContact}</div>
          </div>
          <div class="doctor-info">
            <div class="doctor-name">${config.doctorName}</div>
            <div>${config.doctorQualification}</div>
            <div>${config.doctorRegistration}</div>
          </div>
        </div>
        
        <div class="patient-info">
          <div>
            <strong>Name:</strong> ${patient.name} (${patient.gender}, ${patient.age} Years)<br>
            <strong>Date & Time:</strong> ${format(prescDate, "dd-MMM-yyyy; hh:mm a")}
          </div>
          <div>
            <strong>Patient ID:</strong> ${prescription.patientId.substring(0, 10).toUpperCase()}
          </div>
        </div>
        
        <div>
          <div class="section-title">CHIEF COMPLAINTS:</div>
          <div>${prescription.chiefComplaints || "None specified"}</div>
        </div>
        
        <div class="vitals">
          <div><strong>TEMPERATURE:</strong> ${prescription.temperature || "--"}°F</div>
          <div><strong>PULSE:</strong> ${prescription.pulse || "--"} bpm</div>
          <div><strong>RESP RATE:</strong> ${prescription.respRate || "--"} rpm</div>
          <div><strong>BP:</strong> ${prescription.bloodPressure || "--"} mmHg</div>
          ${prescription.spo2 ? `<div><strong>SPO2:</strong> ${prescription.spo2}%</div>` : ""}
        </div>
        
        <div class="exam-notes">
          <div class="section-title">EXAMINATION NOTES:</div>
          <ul>${examItems || "<li>None</li>"}</ul>
        </div>
        
        <div>
          <div class="section-title">DIAGNOSIS:</div>
          <div>${prescription.diagnosis || "Not specified"}</div>
        </div>
        
        <div>
          <div class="section-title">&#8478;</div>
          <table>
            <thead>
              <tr>
                <th>Sl</th>
                <th>Medicine Name</th>
                <th>Regime and Instruction</th>
              </tr>
            </thead>
            <tbody>
              ${medicineRows}
            </tbody>
          </table>
        </div>
        
        ${
          prescription.specialAdvice
            ? `
        <div class="advice">
          <div class="section-title">ADVICE:</div>
          <ul>${adviceItems}</ul>
        </div>
        `
            : ""
        }
        
        ${
          prescription.followUpDate
            ? `
        <div class="follow-up">
          <strong>FOLLOW UP:</strong> Scheduled a follow-up appt. for ${format(new Date(prescription.followUpDate), "do MMMM, yyyy")} at ${format(new Date(prescription.followUpDate), "hh:mm a")}
          ${prescription.appointmentId ? `<br><strong>Appointment ID - </strong> ${prescription.appointmentId}` : ""}
        </div>
        `
            : ""
        }
        
        <div class="signature">
          ${config.doctorName}
        </div>
        
        <div class="footer">
          Powered by Bajaj Finserv Health Limited
        </div>
      </div>
    </body>
    </html>
  `
}

// Function to open the print dialog
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

