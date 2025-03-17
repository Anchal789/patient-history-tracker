"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Patient } from "@/lib/types"

interface PatientSearchResultsProps {
  results: Patient[]
}

export function PatientSearchResults({ results }: PatientSearchResultsProps) {
  if (results.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {results.map((patient) => (
        <Link href={`/patients/${patient.id}`} key={patient.id}>
          <Card className="hover:bg-accent transition-colors">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{patient.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {patient.age} years • {patient.gender || "Not specified"}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground max-w-40 truncate">
                  {patient.prescriptions && patient.prescriptions.length > 0
                    ? `${patient.prescriptions[0].diagnosis}`
                    : ""}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

