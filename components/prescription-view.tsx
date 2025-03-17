import type { Prescription } from "@/lib/types"
import { format } from "date-fns"

interface PrescriptionViewProps {
  prescription: Prescription
}

export function PrescriptionView({ prescription }: PrescriptionViewProps) {
  return (
    <div className="space-y-6">
      {prescription.chiefComplaints && (
        <div>
          <h3 className="text-lg font-medium">Chief Complaints</h3>
          <p className="mt-2 text-sm">{prescription.chiefComplaints}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {prescription.afebrileTemperature && (
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground">Afebrile Temperature</p>
            <p className="font-medium">{prescription.afebrileTemperature ? "Yes" : "No"}</p>
          </div>
        )}
        {prescription.temperature && !prescription.afebrileTemperature && (
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground">Temperature</p>
            <p className="font-medium">{prescription.temperature}°F</p>
          </div>
        )}

        {prescription.pulse && (
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground">Pulse</p>
            <p className="font-medium">{prescription.pulse} bpm</p>
          </div>
        )}

        {prescription.respRate && (
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground">Resp Rate</p>
            <p className="font-medium">{prescription.respRate} rpm</p>
          </div>
        )}

        {prescription.bloodPressure && (
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground">Blood Pressure</p>
            <p className="font-medium">{prescription.bloodPressure}</p>
          </div>
        )}

        {prescription.spo2 && (
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground">SpO2</p>
            <p className="font-medium">{prescription.spo2}%</p>
          </div>
        )}

        {prescription.weight && (
          <div className="bg-muted/50 p-2 rounded-md">
            <p className="text-xs text-muted-foreground">Weight</p>
            <p className="font-medium">{prescription.weight} kg</p>
          </div>
        )}
      </div>

      {prescription.examNotes && (
        <div>
          <h3 className="text-lg font-medium">Examination Notes</h3>
          <p className="mt-2 text-sm">{prescription.examNotes}</p>
        </div>
      )}

      {prescription.diagnosis && (
        <div>
          <h3 className="text-lg font-medium">Diagnosis</h3>
          <p className="mt-2 text-sm">{prescription.diagnosis}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium">Medications</h3>
        <div className="mt-2 space-y-4">
          {prescription.medicines.map((medicine, index) => (
            <div key={index} className="border rounded-md p-3">
              <div className="flex justify-between">
                <h4 className="font-medium">
                  {medicine.name} ({medicine.type})
                </h4>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Dosage:</span>
                  <ul className="list-disc pl-5 mt-1">
                    {medicine.dosage.map((dose, idx) => (
                      <li key={idx}>
                        {dose.time}: {dose.quantity} {dose.instructions ? `(${dose.instructions})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="mt-1">
                    {medicine.duration.days > 0 && `${medicine.duration.days} days`}
                    {medicine.duration.months > 0 && ` ${medicine.duration.months} months`}
                    {medicine.duration.years > 0 && ` ${medicine.duration.years} years`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {prescription.specialAdvice && (
        <div>
          <h3 className="text-lg font-medium">Special Advice</h3>
          <p className="mt-2 text-sm">{prescription.specialAdvice}</p>
        </div>
      )}

      {prescription.followUpDate && (
        <div className="p-3 border rounded-md bg-primary/5">
          <h3 className="text-md font-medium">Follow-up</h3>
          <p className="text-sm mt-1">
            Scheduled for {format(new Date(prescription.followUpDate), "PPP")}
            {prescription.appointmentId && ` (ID: ${prescription.appointmentId.substring(0, 8)})`}
          </p>
        </div>
      )}
    </div>
  )
}

