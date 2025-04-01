"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CalendarDays, Plus, Search, User, Users } from "lucide-react"
import { FollowUpList } from "@/components/follow-up-list"
import { PatientSearchResults } from "@/components/patient-search-results"
import type { Patient, Prescription } from "@/lib/types"
import { getAllPatients, getUpcomingFollowUps, getRecentVisits } from "@/lib/realtime-database-service"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { FirebaseRulesNotice } from "@/components/firebase-rules-notice"
import { useTheme } from "next-themes"

export function DashboardView() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPatients: 0,
    followUps: 0,
    recentVisits: 0,
  })

  // Modal states
  const [showPatientsModal, setShowPatientsModal] = useState(false)
  const [showFollowUpsModal, setShowFollowUpsModal] = useState(false)
  const [showRecentVisitsModal, setShowRecentVisitsModal] = useState(false)
  const [followUps, setFollowUps] = useState<{ patient: Patient; prescription: Prescription }[]>([])
  const [recentVisits, setRecentVisits] = useState<{ patient: Patient; prescription: Prescription }[]>([])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load patients
        const patientsData = await getAllPatients()
        setPatients(patientsData)

        // Load follow-ups
        const followUpsData = await getUpcomingFollowUps(4)
        setFollowUps(followUpsData)

        // Load recent visits
        const recentVisitsData = await getRecentVisits(7)
        setRecentVisits(recentVisitsData)

        // Set stats
        setStats({
          totalPatients: patientsData.length,
          followUps: followUpsData.length,
          recentVisits: recentVisitsData.length,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results = patients?.filter((patient) => patient.name.toLowerCase().includes(query))
    setSearchResults(results)
  }, [searchQuery, patients])

  const {setTheme , theme} = useTheme()

  useEffect(()=>{setTheme("light")},[])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* <FirebaseRulesNotice /> */}

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button onClick={() => router.push("/patients/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add New Patient
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowPatientsModal(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowFollowUpsModal(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Follow-ups</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.followUps}</div>
            )}
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setShowRecentVisitsModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Visits (7 days)</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.recentVisits}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Patient Search</CardTitle>
            <CardDescription>Find patient records quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="text"
                placeholder="Search by patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4">
              <PatientSearchResults results={searchResults} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Follow-ups</CardTitle>
            <CardDescription>Patients due for follow-up in the next 4 days</CardDescription>
          </CardHeader>
          <CardContent>
            <FollowUpList />
          </CardContent>
        </Card>
      </div>

      {/* Total Patients Modal */}
      <Dialog open={showPatientsModal} onOpenChange={setShowPatientsModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Patients</DialogTitle>
            <DialogDescription>Complete list of all registered patients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isLoading ? (
              Array(5)
                .fill(0)
                ?.map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : patients.length > 0 ? (
              patients?.map((patient) => (
                <Card key={patient.id} className="hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <Link href={`/patients/${patient.id}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <h3 className="font-medium">{patient.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} years • {patient.gender || "Not specified"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{patient.weight ? `${patient.weight} kg` : "No weight recorded"}</p>
                          <p className="text-sm text-muted-foreground">{patient.address || "No address recorded"}</p>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">No patients found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Follow-ups Modal */}
      <Dialog open={showFollowUpsModal} onOpenChange={setShowFollowUpsModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upcoming Follow-ups</DialogTitle>
            <DialogDescription>Patients due for follow-up in the next 4 days</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isLoading ? (
              Array(3)
                .fill(0)
                ?.map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : followUps.length > 0 ? (
              followUps?.map(({ patient, prescription }) => (
                <Card key={`${patient.id}-${prescription.id}`} className="hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <Link href={`/patients/${patient.id}`}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{patient.name}</h3>
                          <p className="text-sm font-medium text-primary">
                            {format(new Date(prescription.followUpDate!), "PPP")}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {patient.age} years • {patient.gender || "Not specified"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {patient.weight ? `${patient.weight} kg` : "No weight recorded"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{patient.address || "No address recorded"}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">No upcoming follow-ups</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Visits Modal */}
      <Dialog open={showRecentVisitsModal} onOpenChange={setShowRecentVisitsModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recent Visits (7 days)</DialogTitle>
            <DialogDescription>Patients who visited in the last 7 days</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {isLoading ? (
              Array(3)
                .fill(0)
                ?.map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : recentVisits.length > 0 ? (
              recentVisits?.map(({ patient, prescription }) => (
                <Card key={`${patient.id}-${prescription.id}`} className="hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <Link href={`/patients/${patient.id}`}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{patient.name}</h3>
                          <p className="text-sm font-medium text-primary">
                            {format(new Date(prescription.date), "PPP")}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {patient.age} years • {patient.gender || "Not specified"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {patient.weight ? `${patient.weight} kg` : "No weight recorded"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{patient.address || "No address recorded"}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">No recent visits</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

