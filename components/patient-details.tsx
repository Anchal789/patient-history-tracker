"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarPlus, Edit, FilePlus } from "lucide-react";
import type { Patient } from "@/lib/types";
import { PrescriptionView } from "@/components/prescription-view";
import {
  getPatientById,
  subscribeToPatient,
} from "@/lib/realtime-database-service";
import { PrescriptionPrint } from "@/components/prescription-print";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientDetailsProps {
  patientId: string;
}

export function PatientDetails({ patientId }: PatientDetailsProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true);
      try {
        const data = await getPatientById(patientId);
        setPatient(data);
      } catch (error) {
        console.error("Error fetching patient:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();

    // Set up real-time subscription
    const unsubscribe = subscribeToPatient(patientId, (updatedPatient) => {
      if (updatedPatient) {
        setPatient(updatedPatient);
      }
    });

    return () => {
      unsubscribe(); // Clean up the subscription
    };
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-8 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold">Patient not found</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/patients")}
        >
          Back to patients
        </Button>
      </div>
    );
  }

  const sortedPrescriptions = [...(patient.prescriptions || [])].sort(
    (a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  );

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{patient.name}</h1>
          <p className="text-muted-foreground">
            {patient.age} years • {patient.gender || "Not specified"} •
            {patient.weight ? ` ${patient.weight} kg` : ""} •
            {patient.height ? ` ${patient.height} cm` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/patients/${patientId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Patient
          </Button>
          <Button
            onClick={() =>
              router.push(`/patients/${patientId}/new-prescription`)
            }
          >
            <FilePlus className="mr-2 h-4 w-4" /> New Prescription
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2">
                  <dt className="font-medium">Age:</dt>
                  <dd>{patient.age} years</dd>

                  <dt className="font-medium">Gender:</dt>
                  <dd>{patient.gender || "Not specified"}</dd>

                  <dt className="font-medium">Weight:</dt>
                  <dd>
                    {patient.weight ? `${patient.weight} kg` : "Not recorded"}
                  </dd>

                  <dt className="font-medium">Height:</dt>
                  <dd>
                    {patient.height ? `${patient.height} cm` : "Not recorded"}
                  </dd>

                  <dt className="font-medium">Blood Group:</dt>
                  <dd>{patient.bloodGroup || "Not recorded"}</dd>

                  <dt className="font-medium">Blood Pressure:</dt>
                  <dd>{patient.bloodPressure || "Not recorded"}</dd>

                  <dt className="font-medium">Address:</dt>
                  <dd>{patient.address || "Not recorded"}</dd>
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Medical Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="font-medium">Current Medications:</dt>
                    <dd className="mt-1">
                      {sortedPrescriptions.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {sortedPrescriptions[0].medicines.map((med, idx) => (
                            <li key={idx}>
                              {med.name} ({med.type})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">
                          No current medications
                        </p>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-medium">Past Illnesses:</dt>
                    <dd className="mt-1">
                      {patient.pastIllnesses ? (
                        <p>{patient.pastIllnesses}</p>
                      ) : (
                        <p className="text-muted-foreground">
                          No past illnesses recorded
                        </p>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-medium">Special Notes:</dt>
                    <dd className="mt-1">
                      {sortedPrescriptions.length > 0 &&
                      sortedPrescriptions[0].specialAdvice ? (
                        <p>{sortedPrescriptions[0].specialAdvice}</p>
                      ) : (
                        <p className="text-muted-foreground">
                          No special notes
                        </p>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          {sortedPrescriptions.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Latest Prescription</CardTitle>
                  <CardDescription>
                    {format(new Date(sortedPrescriptions[0].date), "PPP")}
                  </CardDescription>
                </div>
                {sortedPrescriptions.length > 0 && (
                  <PrescriptionPrint
                    patient={patient}
                    prescription={sortedPrescriptions[0]}
                  />
                )}
              </CardHeader>
              <CardContent>
                <PrescriptionView prescription={sortedPrescriptions[0]} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Past Illnesses & Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.pastIllnesses ? (
                <div className="prose max-w-none">
                  <p>{patient.pastIllnesses}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No past illnesses or medical history recorded
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Vital History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPrescriptions.length > 0 ? (
                  sortedPrescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="border-b pb-4 last:border-0"
                    >
                      <h4 className="font-medium">
                        {format(new Date(prescription.date), "PPP")}
                      </h4>
                      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        <dt className="text-sm text-muted-foreground">
                          Weight:
                        </dt>
                        <dd className="text-sm">
                          {prescription.weight
                            ? `${prescription.weight} kg`
                            : "Not recorded"}
                        </dd>

                        <dt className="text-sm text-muted-foreground">
                          Blood Pressure:
                        </dt>
                        <dd className="text-sm">
                          {prescription.bloodPressure || "Not recorded"}
                        </dd>
                        {prescription.afebrileTemperature && (
                          <>
                            <dt className="text-sm text-muted-foreground">
                              Temperature:
                            </dt>
                            <dd className="text-sm">
                              {prescription.temperature
                                ? `${prescription.temperature}°F`
                                : "Not recorded"}
                            </dd>
                          </>
                        )}
                        {!prescription.afebrileTemperature && (
                          <>
                            <dt className="text-sm text-muted-foreground">
                              Temperature:
                            </dt>
                            <dd className="text-sm">
                              {prescription.temperature
                                ? `${prescription.temperature}°F`
                                : "Not recorded"}
                            </dd>
                          </>
                        )}

                        <dt className="text-sm text-muted-foreground">
                          Pulse:
                        </dt>
                        <dd className="text-sm">
                          {prescription.pulse
                            ? `${prescription.pulse} bpm`
                            : "Not recorded"}
                        </dd>

                        <dt className="text-sm text-muted-foreground">
                          Resp Rate:
                        </dt>
                        <dd className="text-sm">
                          {prescription.respRate
                            ? `${prescription.respRate} rpm`
                            : "Not recorded"}
                        </dd>

                        <dt className="text-sm text-muted-foreground">SpO2:</dt>
                        <dd className="text-sm">
                          {prescription.spo2
                            ? `${prescription.spo2}%`
                            : "Not recorded"}
                        </dd>
                      </dl>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No vital history recorded
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4 mt-4">
          {sortedPrescriptions.length > 0 ? (
            sortedPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <CardTitle>Prescription</CardTitle>
                      <CardDescription>
                        {format(new Date(prescription.date), "PPP")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {prescription.followUpDate && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarPlus className="mr-1 h-4 w-4" />
                          Follow-up:{" "}
                          {format(new Date(prescription.followUpDate), "PPP")}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/patients/${patientId}/prescriptions/${prescription.id}/edit`
                          )
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <PrescriptionPrint
                        patient={patient}
                        prescription={prescription}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PrescriptionView prescription={prescription} />
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 border rounded-md bg-card">
              <p className="text-muted-foreground">No prescriptions yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  router.push(`/patients/${patientId}/new-prescription`)
                }
              >
                <FilePlus className="mr-2 h-4 w-4" /> Create first prescription
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
