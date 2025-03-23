"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CalendarDays, Home, Users, User2, Menu, Pill, Stethoscope } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  const NavItems = () => (
    <>
      <Link
        href="/dashboard"
        className={`flex items-center gap-2 p-2 rounded-md ${pathname === "/dashboard" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
      >
        <Home className="h-5 w-5" />
        <span>Dashboard</span>
      </Link>
      <Link
        href="/patients"
        className={`flex items-center gap-2 p-2 rounded-md ${pathname === "/patients" || pathname.startsWith("/patients/") ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
      >
        <Users className="h-5 w-5" />
        <span>Patients</span>
      </Link>
      <Link
        href="/appointments"
        className={`flex items-center gap-2 p-2 rounded-md ${pathname === "/appointments" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
      >
        <CalendarDays className="h-5 w-5" />
        <span>Appointments</span>
      </Link>
      <Link
        href="/medicines"
        className={`flex items-center gap-2 p-2 rounded-md ${pathname === "/medicines" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
      >
        <Pill className="h-5 w-5" />
        <span>Medicines</span>
      </Link>
      <Link
        href="/diagnoses"
        className={`flex items-center gap-2 p-2 rounded-md ${pathname === "/diagnoses" ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
      >
        <Stethoscope className="h-5 w-5" />
        <span>Diagnoses</span>
      </Link>
    </>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-6 sticky top-0 bg-background ">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <User2 className="h-5 w-5 text-primary" />
            <span>PatTracker</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          <NavItems />
        </div>
        <div className="border-t p-4 sticky bottom-0">
          <div className="flex items-center gap-2">
            <User2 className="h-8 w-8 rounded-full bg-primary/10 p-2 text-primary" />
            <div>
              <p className="text-sm font-medium">Dr. Gaurav Puri</p>
              <p className="text-xs text-muted-foreground">B.A.M.S</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-14 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  <User2 className="h-5 w-5 text-primary" />
                  <span>MedTracker</span>
                </Link>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2">
                <NavItems />
              </div>
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <User2 className="h-8 w-8 rounded-full bg-primary/10 p-2 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Dr. Gaurav Puri</p>
                    <p className="text-xs text-muted-foreground">B.A.M.S</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <h1 className="text-lg font-semibold">Rakshanam Health Care</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

