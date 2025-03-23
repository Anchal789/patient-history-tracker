import type { Patient, Prescription, Medicine, PrintConfig } from "./types"
import { format } from "date-fns"
import TemplateImage from "../assets/Template.jpg"
import { ReactNode } from "react"

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
export const formatDosageInstruction = (medicine: Medicine): ReactNode => {
  // Group dosages by time
  const timingMap: Record<string, string> = {}
//   medicine.dosage.forEach((d) => {
//     timingMap[d.time] = d.quantity
//   })
//   // Create a string like "1-0-1" for morning-afternoon-evening
//   const pattern = ["Morning", "Afternoon", "Evening", "Night"].map((time) => timingMap[time] || "0").join("-")

//   // Get the instruction from the first dosage (assuming all have same instructions)
//   const instruction = medicine.dosage.length > 0 ? medicine.dosage[0].instructions : ""

  // Add duration
  let durationText = ""
  if (medicine.duration.days > 0) {
    durationText = `${medicine.duration.days} दिन`
  } 
   if (medicine.duration.months > 0) {
    durationText = durationText + ` ${medicine.duration.months} महीने`
  } 
  if (medicine.duration.years > 0) {
    durationText =  durationText + ` ${medicine.duration.years} वर्ष`
  }

  return `<div class="medicineQuantity">${medicine.dosage.length > 0 ? medicine.dosage.map((item)=> `<p>${item.quantity} - ${item.instructions}</p>`).join("") : ""}<br/>${durationText}</div>`
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
      <td>${med.name} (${med.type})</td>
      <td>${formatDosageInstruction(med)}</td>
    </tr>
  `,
    )
    .join("")

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
            border: 1px solid #ccc;
            height: auto;
            min-height: 745px;
            position: relative;
            display: grid;
            max-width: 800px;
            grid-template-columns: 24% 70%;
            grid-gap: 10px;
          }
          .image{
            max-width : 800px;
            position: absolute;
            height: 100vh;
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
            margin-bottom: 20px;
          }
          .name {
            margin-top: 8px;
            margin-left: 40px;
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
            margin-left: 55px;
          }
          .ageAddress{
            display : flex;
          }
          .patientId{
            margin-left : 9px;
          }
          .vitals {
            margin-top: 611px;
            gap: 17px;
            text-align: end;
            display : flex;
            flex-direction: column;
            font-size: large;
          }
          .mainContent{
            margin-top : 250px;
            overflow: hidden;
          }
          .chiefComplaints{
            margin-left: 60px;  
          }
          .chiefComplaints p{
            margin: 0;  
          }
          .exam-notes{
            margin-left: 60px;
          }
          .diagnosis{
            margin-left: 60px;
          }
          .medicines{
            margin-left: 12px;
          }
          .medicineQuantity{
            display: flex;
            flex-wrap: wrap;
            gap:10px;
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
            border-top: 1px solid #000;
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
          border: 1px solid #ccc;
          height : 745px;
          position: relative;
          display: grid;
          max-width: 800px;
          grid-template-columns: 24% 70%;
          grid-gap: 10px;
          page-break-inside: auto;
          /* Ensure the entire letterhead starts on a new page if needed */
          page-break-before: auto;
        }
        .image{
           max-width : 800px;
           position: absolute;
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
          margin-bottom: 20px;
        }
        .name {
          margin-top: 8px;
          margin-left: 40px;
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
          margin-left: 55px;
        }
        .ageAddress{
          display : flex;
        }
        .patientId{
          margin-left : 9px;
        }
        .vitals {
          margin-top: 671px;
          gap: 17px;
          text-align: end;
          display : flex;
          flex-direction: column;
          font-size: large;
        }
        .mainContent{
          margin-top : 220px;
          max-height: calc(100vh - 190px); /* Viewport height minus margins and header */
          overflow: hidden;

        }
        .chiefComplaints{
          margin-left: 60px;  
        }
        .chiefComplaints p{
          margin: 0;  
        }
        .exam-notes{
          margin-left: 60px;
        }
        .diagnosis{
          margin-left: 60px;
        }
        .medicines{
          margin-left: 12px;
        }
        .medicineQuantity{
          display: flex;
          flex-wrap: wrap;
          gap:10px;
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
          border-top: 1px solid #000;
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
              <strong class="patientId">Patient ID:</strong> ${prescription.patientId.substring(0, 10).toUpperCase()}  </div> ${
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
          
          <div class="exam-notes">
            <div class="section-title">EXAMINATION NOTES:</div>
            <ul>${examItems || "<li>None</li>"}</ul>
          </div>
          
          <div class="diagnosis">
            <div class="section-title">DIAGNOSIS:</div>
            <div>${prescription.diagnosis || "Not specified"}</div>
          </div>
          
          <div class="medicines">
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
        
        </div>
      </div>
    </body>
    </html>
  `
}

// Function to open the print dialog
// Function to handle content overflow and page breaks
const handlePageOverflow = () => {
  // This function will be injected into the print window
  return `
    function insertPageBreaks() {
      // Get viewport height (A4 page height in print mode)
      const pageHeight = 1122; // A4 height in pixels at 96 DPI
      const breakPoint = pageHeight - 90; // Point where we need to break (90px from bottom)
      
      // Get the main content container
      const mainContent = document.querySelector('.mainContent');
      if (!mainContent) return;
      
      // Get all potential elements that could need breaking
      const contentElements = mainContent.querySelectorAll(' .chiefComplaints,.exam-notes,.diagnosis,.medicines,.advice,');
      
      // Function to check if element crosses the threshold
      function needsPageBreak(element) {
        const rect = element.getBoundingClientRect();
        const elementBottom = rect.bottom;
        return elementBottom > breakPoint;
      }
      
      // Find the first element that crosses our threshold
      let breakElement = null;
      for (let i = 0; i < contentElements.length; i++) {
        if (needsPageBreak(contentElements[i])) {
          breakElement = contentElements[i];
          break;
        }
      }
      
      // If we found an element that needs breaking
      if (breakElement) {
        // Insert page break before this element
        breakElement.style.pageBreakBefore = 'always';
        
        // Add top margin to this element to start at 300px on next page
        breakElement.style.marginTop = '300px';
        
        // Create new container for the next page if needed
        const parentElement = breakElement.parentElement;
        if (parentElement && parentElement !== mainContent) {
          // If the break element is nested, we may need to adjust its container
          parentElement.style.pageBreakInside = 'avoid';
        }
        
        // Handle special case for table rows
        if (breakElement.tagName === 'TR' || breakElement.closest('tr')) {
          const row = breakElement.tagName === 'TR' ? breakElement : breakElement.closest('tr');
          const table = row.closest('table');
          if (table) {
            // Place the break before the whole table if it's crossing the threshold
            table.style.pageBreakBefore = 'always';
            table.style.marginTop = '300px';
            breakElement.style.marginTop = '0'; // Reset element margin
          }
        }
      }
      
      // Ensure table rows don't break across pages
      const tableRows = document.querySelectorAll('tr');
      tableRows.forEach(row => {
        row.style.pageBreakInside = 'avoid';
      });
    }
    
    // Run when DOM is loaded
    document.addEventListener('DOMContentLoaded', insertPageBreaks);
    
    // Also run right before printing
    window.addEventListener('beforeprint', insertPageBreaks);
  `;
};

// Update the printPrescription function to include our overflow handler
export const printPrescription = (patient: Patient, prescription: Prescription, config?: PrintConfig) => {
  const html = generatePrescriptionHTML(patient, prescription, config);

  // Create a new window
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to print prescriptions");
    return;
  }

  // Write HTML content
  printWindow.document.write(html);
  
  // Add the overflow detection script to the head
  const overflowScript = document.createElement('script');
  overflowScript.textContent = handlePageOverflow();
  printWindow.document.head.appendChild(overflowScript);
  
  printWindow.document.close();

  // Wait for content to load
  printWindow.onload = () => {
    // Trigger print
    printWindow.focus();
    printWindow.print();
  };
};

