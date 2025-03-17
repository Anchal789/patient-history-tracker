"use client"

import { useState } from "react"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function FirebaseRulesNotice() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <Alert variant="warning" className="relative mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Firebase Database Rules Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          For optimal performance, please add the following index to your Firebase Realtime Database rules:
        </p>
        <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs">
          {`{
  "rules": {
    ".read": true,
    ".write": true,
    "prescriptions": {
      ".indexOn": ["patientId"]
    }
  }
}`}
        </pre>
        <p className="mt-2">You can update these rules in the Firebase Console under Realtime Database &gt; Rules.</p>
      </AlertDescription>
      <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setDismissed(true)}>
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  )
}

