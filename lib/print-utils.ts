import type { Patient, Prescription, Medicine, PrintConfig } from "./types";
import { format } from "date-fns";
import TemplateImage from "../assets/Template.jpg";
import { PDFDocument, PDFTextField, StandardFonts } from "pdf-lib";
import { ReactNode } from "react";
import TemplatePdf from "../assets/Raksham Health Hindi Text.pdf";
import { toast } from "@/components/ui/use-toast";
import fontkit from "@pdf-lib/fontkit";
import "regenerator-runtime/runtime";
import { truncateByDomain } from "recharts/types/util/ChartUtils";

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

// Function to generate an appointment ID
export const generateAppointmentId = (): string => {
  return Array.from({ length: 5 }, () =>
    Math.random().toString(36).substring(2, 6)
  ).join("-");
};

// export const printPrescription = (patient: Patient, prescription: Prescription, config?: PrintConfig) => {
//   const html = generatePrescriptionHTML(patient, prescription, config)

//   // Create a new window
//   const printWindow = window.open("", "_blank")
//   if (!printWindow) {
//     alert("Please allow popups for this site to print prescriptions")
//     return
//   }

//   // Write HTML content
//   printWindow.document.write(html)
//   printWindow.document.close()

//   // Wait for content to load
//   printWindow.onload = () => {
//     // Trigger print
//     printWindow.focus()
//     printWindow.print()
//   }
// }

export const printPrescription = async (
  patient: Patient,
  prescription: Prescription
) => {
  try {
    const templateBytes = await fetch(TemplatePdf).then((res) =>
      res.arrayBuffer()
    );
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Register fontkit
    pdfDoc.registerFontkit(fontkit);

    // Load and embed the Devanagari font
    const fontBytes = await fetch("/fonts/NotoSansDevanagari-Regular.ttf").then(
      (res) => res.arrayBuffer()
    );
    const devanagariFont = await pdfDoc.embedFont(fontBytes, { subset: true });

    // Also embed a standard font for non-Hindi text
    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const standardFontBold = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

    const form = pdfDoc.getForm();

    // Function to check if text contains Hindi characters
    const containsHindi = (text: string): boolean => {
      if (!text) return false;
      return /[\u0900-\u097F\uA8E0-\uA8FF\u1CD0-\u1CFF]/.test(text);
    };

    // Corrected setFieldText function
    const setFieldText = (
      field: PDFTextField,
      text: string,
      forceHindi = false,
      medicineName = false,
      medIns = false
    ) => {
      if (!text) return;

      const useHindiFont = forceHindi || containsHindi(text);
      const font = useHindiFont ? devanagariFont : standardFont;

      field.setText(text);
      field.setFontSize(medIns ? 8 : 10);
      field.updateAppearances(medicineName ? standardFontBold : font);
    };

    // Get all form fields
    const nameField = form.getTextField("Name");
    const dateField = form.getTextField("Date");
    const ageGender = form.getTextField("AgeGender");
    const address = form.getTextField("Address");
    const pulse = form.getTextField("Pulse");
    const bloodPressure = form.getTextField("BP");
    const weight = form.getTextField("Weight");
    const temperature = form.getTextField("Temperature");
    const respiratory = form.getTextField("Resp");
    const spO2 = form.getTextField("Spo2");
    const patientId = form.getTextField("PatientId");
    const followupDate = form.getTextField("FollowUp");
    const chiefComplaints = form.getTextField("ChiefComplaint");
    const diagnosis = form.getTextField("Diagnosis");
    const med7Name = form.getTextField("Med7Name");
    const med7Ins = form.getTextField("Med7Ins");
    const med7Duration = form.getTextField("Med7Duration");
    const advice = form.getTextField("Advice");

    // Function to set text with the appropriate font
    // const setFieldText = (field, text, containsHindi = false) => {
    //   if (!text) return;

    //   // Update the field's appearance with the appropriate font
    //   field.updateAppearances(containsHindi ? devanagariFont : standardFont);
    //   field.setText(text);
    // };

    // // Function to check if text contains Hindi characters
    // const containsHindi = (text) => {
    //   if (!text) return false;
    //   return /[\u0900-\u097F]/.test(text); // Unicode range for Devanagari
    // };

    // Set English text fields
    setFieldText(nameField, patient?.name || "");
    setFieldText(dateField, format(new Date(prescription.date), "dd-MMM-yyyy"));
    setFieldText(
      ageGender,
      `${patient.age || ""}${patient.gender ? "/ " + patient?.gender : ""}`
    );
    setFieldText(address, patient.address || "");
    setFieldText(patientId, prescription.patientId || "");
    setFieldText(
      followupDate,
      format(new Date(prescription?.followUpDate), "do MMMM, yyyy") || ""
    );

    // Set fields that might contain Hindi
    setFieldText(
      chiefComplaints,
      prescription.chiefComplaints || "",
      containsHindi(prescription.chiefComplaints)
    );
    setFieldText(
      diagnosis,
      prescription.diagnosis || "",
      containsHindi(prescription.diagnosis)
    );
    setFieldText(
      advice,
      prescription.specialAdvice || "",
      containsHindi(prescription.specialAdvice)
    );

    // Set more English fields
    setFieldText(pulse, prescription.pulse || "");
    setFieldText(bloodPressure, prescription.bloodPressure || "");
    setFieldText(weight, prescription.weight || "");
    setFieldText(
      temperature,
      prescription.afebrileTemperature
        ? "No Fever"
        : prescription.temperature || ""
    );
    setFieldText(
      respiratory,
      prescription.respRate ? "Resp rate: " + prescription.respRate : ""
    );
    setFieldText(
      spO2,
      prescription.spo2 ? "SPO2: " + prescription.spo2 + "%" : ""
    );

    // Handle medicine fields (1-6)
    prescription?.medicines?.slice(0, 6)?.forEach((med, index) => {
      if (med.name) {
        const medNameField = form.getTextField(`Med${index + 1}Name`);
        setFieldText(medNameField, `${index + 1}. ${med.name}`, true, true);
      }
    });

    // Handle medicine 7 separately
    if (prescription?.medicines?.[6]?.name) {
      setFieldText(
        med7Name,
        `7. ${prescription.medicines[6].name}`,
        true,
        true
      );

      // Handle medicine 7 instructions (likely contains Hindi)
      const med7InsText =
        prescription?.medicines?.[6]?.dosage?.[0]?.instructions || "";
      setFieldText(med7Ins, med7InsText, containsHindi(med7InsText));

      // Handle medicine 7 duration (definitely contains Hindi)

      const sortedDosage =
        prescription?.medicines?.[6]?.dosage.length > 0
          ? [...prescription?.medicines?.[6]?.dosage].sort((a, b) => {
              const timeOrder = ["Morning", "Afternoon", "Evening", "Night"];
              return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
            })
          : [];
      if (prescription?.medicines?.[6]?.dosage.length > 0) {
        const dosageText = sortedDosage
          .map(
            (item) =>
              `${
                item.time === "Morning"
                  ? "सुबह"
                  : item.time === "Afternoon"
                  ? "दोपहर"
                  : item.time === "Evening"
                  ? "शाम"
                  : "रात"
              } - ${item.quantity} - ${item.instructions}\n`
          )
          .join("");

        setFieldText(med7Duration, dosageText, true, false, true);
      }
    }

    // Handle medicine instructions for medicines 1-6 (contains Hindi)
    prescription?.medicines?.slice(0, 6)?.forEach((med, index) => {
      if (!med) return;

      let durationText = "";
      if (med.duration.days > 0) {
        durationText = `${med.duration.days} दिन`;
      }
      if (med.duration.months > 0) {
        durationText = durationText + ` ${med.duration.months} महीने`;
      }
      if (med.duration.years > 0) {
        durationText = durationText + ` ${med.duration.years} साल`;
      }

      const sortedDosage =
        med?.dosage?.length > 0
          ? [...med.dosage].sort((a, b) => {
              const timeOrder = ["Morning", "Afternoon", "Evening", "Night"];
              return timeOrder.indexOf(a.time) - timeOrder.indexOf(b.time);
            })
          : [];

      const dosageDetails = sortedDosage
        .map(
          (item) =>
            `${
              item.time === "Morning"
                ? "सुबह"
                : item.time === "Afternoon"
                ? "दोपहर"
                : item.time === "Evening"
                ? "शाम"
                : "रात"
            } - ${item.quantity} - ${item.instructions}\n`
        )
        .join("");
      const medInsField = form.getTextField(`Med${index + 1}Ins`);
      const medInsText = `${med.type} (${durationText})\n${dosageDetails}`;
      setFieldText(medInsField, medInsText, true, false, true);
    });

    // Flatten the form if needed
    form.flatten();

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Create a URL for the PDF
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Open the PDF in a new tab
    const printWindow = window.open(pdfUrl, "_blank");

    if (!printWindow) {
      alert("Please allow popups for this site to print prescriptions");
      return;
    }

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();

      // Clean up the URL object after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 30000); // Clean up after 30 seconds
    };
  } catch (error) {
    console.error("Error generating PDF prescription:", error);
    toast({
      title: "Error",
      description:
        "There was an error printing the prescription. Please contact administrator.",
      variant: "destructive",
    });
  }
};
