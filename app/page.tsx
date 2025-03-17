"use client"

import { useState, useEffect } from "react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { seedInitialData } from "@/lib/realtime-database-service"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(true)

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        // Check if local storage has an initialization flag
        const initialized = localStorage.getItem("app_initialized")

        if (initialized === "true") {
          // Already initialized, redirect to dashboard
          setIsInitialized(true)
          redirect("/dashboard")
        } else {
          // Not initialized, show the initialization option
          setIsInitializing(false)
        }
      } catch (error) {
        console.error("Error checking initialization:", error)
        setIsInitializing(false)
      }
    }

    checkInitialization()
  }, [])

  const handleInitializeData = async () => {
    setIsLoading(true)

    try {
      await seedInitialData()
      localStorage.setItem("app_initialized", "true")
      setIsInitialized(true)
      redirect("/dashboard")
    } catch (error) {
      console.error("Error initializing data:", error)
      setIsLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isInitialized) {
    redirect("/dashboard")
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Doctor Patient App</CardTitle>
          <CardDescription>First time setup</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Would you like to initialize the system with sample data? This will create example patients and
            prescriptions to help you get started.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              localStorage.setItem("app_initialized", "true")
              redirect("/dashboard")
            }}
          >
            Skip
          </Button>
          <Button onClick={handleInitializeData} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              "Initialize Sample Data"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

