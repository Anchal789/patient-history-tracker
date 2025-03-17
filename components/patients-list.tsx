"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import type { Patient } from "@/lib/types"
import { getAllPatients } from "@/lib/realtime-database-service"
import { Skeleton } from "@/components/ui/skeleton"

export function PatientsList() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true)
      try {
        const data = await getAllPatients()
        setPatients(data)
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const filteredPatients = patients.filter((patient) => patient.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Button onClick={() => router.push("/patients/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add New Patient
        </Button>
      </div>

      <div className="flex items-center space-x-2 max-w-sm">
        <Input
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button size="icon" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="rounded-md border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="hidden md:table-cell">Last Visit</TableHead>
                <TableHead className="hidden md:table-cell">Total Visits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => {
                const lastVisitDate =
                  patient.prescriptions && patient.prescriptions.length > 0
                    ? new Date(patient.prescriptions[0].date)
                    : null

                return (
                  <TableRow key={patient.id} className="hover:bg-accent/50">
                    <TableCell className="font-medium">
                      <Link href={`/patients/${patient.id}`} className="hover:underline text-primary">
                        {patient.name}
                      </Link>
                    </TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.gender || "Not specified"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lastVisitDate ? lastVisitDate.toLocaleDateString() : "No visits"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{patient.prescriptions?.length || 0}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-card">
          <p className="text-muted-foreground">No patients found</p>
          {patients.length === 0 && !isLoading && (
            <Button variant="outline" className="mt-4" onClick={() => router.push("/patients/new")}>
              Add your first patient
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

