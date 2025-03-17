"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer } from "lucide-react"
import type { Patient, Prescription, PrintConfig } from "@/lib/types"
import { printPrescription, defaultPrintConfig } from "@/lib/print-utils"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"

interface PrescriptionPrintProps {
  patient: Patient
  prescription: Prescription
}

export function PrescriptionPrint({ patient, prescription }: PrescriptionPrintProps) {
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const form = useForm<PrintConfig>({
    defaultValues: defaultPrintConfig,
  })

  const handlePrint = () => {
    printPrescription(patient, prescription, form.getValues())
  }

  const handleSimplePrint = () => {
    printPrescription(patient, prescription)
  }

  return (
    <>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={handleSimplePrint} className="flex items-center">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowConfigDialog(true)} className="flex items-center">
          Configure
        </Button>
      </div>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Print Configuration</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="hospitalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hospitalAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hospitalContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital Contact</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorQualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor Qualification</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorRegistration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor Registration</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="printLogo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Logo</FormLabel>
                      <FormDescription>Print with hospital logo (if available)</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handlePrint()
                    setShowConfigDialog(false)
                  }}
                >
                  Print
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

